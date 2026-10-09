import {
  catalog,
  checkOrigin,
  cookie,
  googleReady,
  identity,
  live,
  sendConfirmation,
  sql,
  hash,
  readCookie,
} from "@/lib/server";
import { cartSchema, checkoutSchema, priceCart } from "@/lib/validation";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const who = await identity(req);
    const items = live()
      ? (await sql()`SELECT items FROM carts WHERE id=${who.owner}`)[0]
          ?.items || []
      : [];
    return Response.json(
      {
        products: await catalog(),
        items,
        user: who.user,
        mode: live() ? "live" : "demo",
        googleReady: googleReady(),
      },
      {
        headers: {
          "Cache-Control": "no-store",
          ...(who.fresh
            ? { "Set-Cookie": cookie("form_visitor", who.visitor, 2592000) }
            : {}),
        },
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized")
      return Response.json({ error: "Please sign in again." }, { status: 401 });
    return Response.json(
      {
        error:
          "The shop could not connect to its database. Check the connection and run the database setup.",
      },
      { status: 503 },
    );
  }
}
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    if (Number(req.headers.get("content-length") || 0) > 20000)
      return Response.json({ error: "Request too large" }, { status: 413 });
    const body = (await req.json()) as Record<string, unknown>;
    const who = await identity(req);
    const headers = {
      "Cache-Control": "no-store",
      ...(who.fresh
        ? { "Set-Cookie": cookie("form_visitor", who.visitor, 2592000) }
        : {}),
    };
    if (body.action === "cart") {
      const items = cartSchema.parse(body.items);
      const baseItems = cartSchema.parse(body.baseItems);
      priceCart(items, await catalog());
      if (live()) {
        const db = sql();
        const results = await db.transaction([
          db`INSERT INTO carts(id,items) VALUES(${who.owner},'[]'::jsonb) ON CONFLICT(id) DO NOTHING`,
          db`UPDATE carts SET items=${JSON.stringify(items)}::jsonb,updated_at=now() WHERE id=${who.owner} AND items=${JSON.stringify(baseItems)}::jsonb RETURNING id`,
        ]);
        const changed = results[1];
        if (!changed.length) return Response.json({ error: "Your bag changed on another device. Refreshing it now; please try again." }, { status: 409, headers });
      }
      return Response.json({ ok: true }, { headers });
    }
    if (body.action === "logout") {
      const session = req.headers.get("authorization")?.replace(/^Bearer /, "") || readCookie(req, "form_session");
      if (session && live())
        await sql()`DELETE FROM sessions WHERE token_hash=${await hash(session)}`;
      return Response.json(
        { ok: true },
        {
          headers: { ...headers, "Set-Cookie": cookie("form_session", "", 0) },
        },
      );
    }
    if (body.action === "retry-email") {
      if (!live())
        return Response.json(
          { error: "Demo orders do not send emails" },
          { status: 400 },
        );
      const id = String(body.id || "");
      if (!/^[a-f0-9-]{36}$/.test(id))
        return Response.json({ error: "Invalid order" }, { status: 400 });
      const owned =
        await sql()`SELECT id FROM orders WHERE id=${id} AND owner=${who.owner}`;
      if (!owned.length)
        return Response.json({ error: "Order not found" }, { status: 404 });
      return Response.json(
        { emailStatus: await sendConfirmation(id, who.owner) },
        { headers },
      );
    }
    if (body.action !== "checkout")
      return Response.json({ error: "Unknown action" }, { status: 400 });
    const data = checkoutSchema.parse(body);
    const totals = priceCart(data.items, await catalog());
    if (!live())
      return Response.json(
        { id: data.key, ...totals, emailStatus: "demo", mode: "demo" },
        { headers },
      );
    const db = sql();
    const fingerprint = await hash(JSON.stringify(data));
    const existing = await db`SELECT * FROM orders WHERE id=${data.key}`;
    if (existing.length) {
      if (
        existing[0].owner !== who.owner ||
        existing[0].request_hash !== fingerprint
      )
        return Response.json(
          {
            error:
              "This checkout attempt changed. Please start a new checkout.",
          },
          { status: 409 },
        );
      return Response.json(
        {
          id: data.key,
          total: existing[0].total,
          emailStatus: existing[0].email_status,
          mode: "live",
        },
        { headers },
      );
    }
    const shipping = {
      name: data.name,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode,
      country: data.country,
    };
    const inserted = await db`WITH created AS (
 INSERT INTO orders(id,owner,user_id,email,shipping,subtotal,shipping_total,total,request_hash) VALUES(${data.key},${who.owner},${who.user?.id || null},${data.email},${JSON.stringify(shipping)}::jsonb,${totals.subtotal},${totals.shipping},${totals.total},${fingerprint}) ON CONFLICT(id) DO NOTHING RETURNING id
 ), lines AS (
 INSERT INTO order_items(order_id,product_id,line_key,name,unit_price,quantity,configuration) SELECT created.id,l.id,l.line_key,l.name,l.price,l.quantity,l.configuration FROM created CROSS JOIN jsonb_to_recordset(${JSON.stringify(totals.lines)}::jsonb) AS l(id text,line_key text,name text,price integer,quantity integer,configuration jsonb) RETURNING order_id
 ) SELECT id FROM created`;
    if (!inserted.length) {
      const rows =
        await db`SELECT * FROM orders WHERE id=${data.key} AND owner=${who.owner} AND request_hash=${fingerprint}`;
      if (!rows.length)
        return Response.json(
          { error: "Please start a new checkout." },
          { status: 409 },
        );
      return Response.json(
        {
          id: data.key,
          total: rows[0].total,
          emailStatus: rows[0].email_status,
          mode: "live",
        },
        { headers },
      );
    }
    await db`UPDATE carts SET items='[]'::jsonb,updated_at=now() WHERE id=${who.owner} AND items=${JSON.stringify(data.items)}::jsonb`;
    const emailStatus = await sendConfirmation(data.key, who.owner);
    if (emailStatus === "not_configured")
      await db`UPDATE orders SET email_status='not_configured' WHERE id=${data.key}`;
    return Response.json(
      { id: data.key, ...totals, emailStatus, mode: "live" },
      { headers },
    );
  } catch (error) {
    const validation =
      error instanceof Error &&
      (error.name === "ZodError" ||
        error.message.includes("reload") ||
        error.message.includes("product"));
    return Response.json(
      {
        error: validation
          ? error instanceof Error && error.name === "ZodError"
            ? "Please check your contact details, delivery address, and bag."
            : (error as Error).message
          : "We could not complete this request. Your details are still here; please try again.",
      },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : validation ? 400 : 503 },
    );
  }
}
