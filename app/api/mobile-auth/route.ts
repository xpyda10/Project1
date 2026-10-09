import { SignJWT, jwtVerify } from "jose";
import { signingKey } from "@/lib/oauth";
import { checkOrigin, googleReady, hash, identity, origin, sql, token } from "@/lib/server";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
export async function POST(req: Request) {
  try {
    if (!googleReady()) return Response.json({ error: "Sign-in is not configured." }, { status: 503, headers });
    const text = await req.text();
    if (text.length > 4000) return new Response(null, { status: 413 });
    const body = JSON.parse(text);
    if (body.action === "begin") {
      if (!/^[a-f0-9]{64}$/.test(body.challenge || "")) throw new Error("Invalid challenge");
      const id = crypto.randomUUID();
      const ticket = await new SignJWT({ challenge: body.challenge })
        .setProtectedHeader({ alg: "HS256" }).setAudience("nova-mobile-pairing")
        .setJti(id).setIssuedAt().setExpirationTime("10m").sign(signingKey());
      return Response.json({ ticket, code: id.slice(0, 8).toUpperCase(), url: origin(req) + "/mobile-connect?ticket=" + encodeURIComponent(ticket) }, { headers });
    }
    const { payload } = await jwtVerify(body.ticket, signingKey(), { algorithms: ["HS256"], audience: "nova-mobile-pairing" });
    if (!payload.jti || typeof payload.challenge !== "string" || !payload.exp) throw new Error("Invalid ticket");
    if (body.action === "authorize") {
      checkOrigin(req);
      const who = await identity(req);
      if (!who.user) return Response.json({ error: "Sign in with Google first." }, { status: 401, headers });
      const rows = await sql()`INSERT INTO mobile_pairings(id,user_id,expires_at) VALUES(${payload.jti},${who.user.id},to_timestamp(${payload.exp})) ON CONFLICT(id) DO NOTHING RETURNING id`;
      if (!rows.length) return Response.json({ error: "This connection has already been approved. Return to the app." }, { status: 409, headers });
      return Response.json({ ok: true }, { headers });
    }
    if (body.action === "redeem") {
      if (!/^[a-f0-9-]{72}$/.test(body.verifier || "") || await hash(body.verifier) !== payload.challenge)
        return Response.json({ error: "Invalid connection proof." }, { status: 401, headers });
      const session = token();
      const rows = await sql()`WITH pairing AS (
        UPDATE mobile_pairings SET redeemed_at=now() WHERE id=${payload.jti} AND expires_at>now() AND redeemed_at IS NULL RETURNING user_id
      ) INSERT INTO sessions(token_hash,user_id,expires_at) SELECT ${await hash(session)},user_id,now()+interval '7 days' FROM pairing RETURNING user_id`;
      if (!rows.length) return Response.json({ pending: true }, { status: 202, headers });
      return Response.json({ session }, { headers });
    }
    throw new Error("Unknown action");
  } catch {
    return Response.json({ error: "This connection expired or could not be completed. Start sign-in again from the app." }, { status: 400, headers });
  }
}
