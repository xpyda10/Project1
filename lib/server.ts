import { neon } from "@neondatabase/serverless";
import { products } from "./catalog";
export const setting = (key: string) => process.env[key] || "";
export const live = () => !!setting("DATABASE_URL");
export const sql = () => neon(setting("DATABASE_URL"));
export const hash = async (value: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
  )
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
export const token = () => crypto.randomUUID() + crypto.randomUUID();
export function readCookie(req: Request, name: string) {
  return (
    req.headers
      .get("cookie")
      ?.split("; ")
      .find((c) => c.startsWith(name + "="))
      ?.slice(name.length + 1) || ""
  );
}
export function cookie(name: string, value: string, seconds: number) {
  return `${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${seconds}${setting("APP_URL").startsWith("https:") ? "; Secure" : ""}`;
}
export function origin(req: Request) {
  return setting("APP_URL") || new URL(req.url).origin;
}
export function checkOrigin(req: Request) {
  if (req.headers.get("origin") !== origin(req))
    throw new Error("Please reload this page before trying again.");
}
export async function identity(req: Request) {
  let visitor = readCookie(req, "form_visitor");
  let fresh = false;
  if (!/^[a-f0-9-]{72}$/.test(visitor)) {
    visitor = token();
    fresh = true;
  }
  const owner = await hash(visitor);
  let user: null | { id: string; name: string; email: string } = null;
  const session = readCookie(req, "form_session");
  if (live() && session) {
    const rows =
      await sql()`SELECT u.id,u.name,u.email FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=${await hash(session)} AND s.expires_at>now()`;
    user = (rows[0] as { id: string; name: string; email: string }) || null;
  }
  return { owner, user, visitor, fresh };
}
export async function catalog() {
  if (!live()) return products;
  const rows =
    await sql()`SELECT data FROM products WHERE data->>'series' IS NOT NULL ORDER BY position`;
  return rows.map((r) => r.data) as typeof products;
}
export const googleReady = () =>
  live() &&
  !!setting("GOOGLE_CLIENT_ID") &&
  !!setting("GOOGLE_CLIENT_SECRET") &&
  setting("SESSION_SECRET").length >= 32;
export async function sendConfirmation(orderId: string, owner: string) {
  const useResend = !!setting("RESEND_API_KEY");
  if (
    useResend ? !setting("RESEND_FROM") : (
    !setting("MAILGUN_API_KEY") ||
    !setting("MAILGUN_DOMAIN") ||
    !setting("MAILGUN_FROM")
    )
  )
    return "not_configured";
  const db = sql();
  const claimed =
    await db`UPDATE orders SET email_status='sending' WHERE id=${orderId} AND owner=${owner} AND email_status IN ('pending','failed','not_configured') RETURNING *`;
  if (!claimed.length) {
    const rows =
      await db`SELECT email_status FROM orders WHERE id=${orderId} AND owner=${owner}`;
    return rows[0]?.email_status || "failed";
  }
  const order = claimed[0];
  try {
    const lines =
      await db`SELECT name,quantity,unit_price,configuration FROM order_items WHERE order_id=${orderId}`;
    const amount = (c: number) => (c / 100).toFixed(2);
    const form = new FormData();
    form.set("from", setting(useResend ? "RESEND_FROM" : "MAILGUN_FROM"));
    form.set("to", order.email);
    form.set("subject", `Your NOVA order ${orderId.slice(0, 8).toUpperCase()}`);
    form.set(
      "text",
      `Thank you, ${order.shipping.name}.\n\nYour NOVA student-store order has been received. No payment was collected.\n\n${lines.map((l) => `${l.name} (${Object.values(l.configuration || {}).join(" / ")}) × ${l.quantity} — $${amount(l.unit_price * l.quantity)}`).join("\n")}\n\nShipping: $${amount(order.shipping_total)}\nTotal: $${amount(order.total)}\n\nDelivery address: ${order.shipping.address}, ${order.shipping.city}, ${order.shipping.postalCode}, ${order.shipping.country}\n\nThis is a bootcamp demonstration. No physical goods will be shipped.`,
    );
    const host =
      setting("MAILGUN_REGION") === "EU"
        ? "api.eu.mailgun.net"
        : "api.mailgun.net";
    const response = useResend ? await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + setting("RESEND_API_KEY"),
        "Content-Type": "application/json",
        "Idempotency-Key": `nova-order-${orderId}`,
      },
      body: JSON.stringify({
        from: form.get("from"),
        to: [order.email],
        subject: form.get("subject"),
        text: form.get("text"),
      }),
      signal: AbortSignal.timeout(12000),
    }) : await fetch(
      `https://${host}/v3/${encodeURIComponent(setting("MAILGUN_DOMAIN"))}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa("api:" + setting("MAILGUN_API_KEY")),
        },
        body: form,
        signal: AbortSignal.timeout(12000),
      },
    );
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      const category = typeof detail.name === "string" && /^[a-z_]+$/.test(detail.name)
        ? detail.name : "provider_error";
      console.error("Order confirmation rejected", { provider: useResend ? "resend" : "mailgun", status: response.status, category });
      throw new Error("Email provider rejected request");
    }
    await db`UPDATE orders SET email_status='sent' WHERE id=${orderId}`;
    return "sent";
  } catch {
    await db`UPDATE orders SET email_status='failed' WHERE id=${orderId}`;
    return "failed";
  }
}

