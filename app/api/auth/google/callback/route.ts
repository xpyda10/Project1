import { jwtVerify } from "jose";
import { googleKeys, verifyFlow } from "@/lib/oauth";
import {
  googleReady,
  cookie,
  origin,
  setting,
  token,
  hash,
  readCookie,
  sql,
} from "@/lib/server";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const headers = new Headers({ "Cache-Control": "no-store" });
  headers.append("Set-Cookie", cookie("form_oauth", "", 0));
  try {
    if (!googleReady()) throw new Error("Unavailable");
    const url = new URL(req.url);
    const flow = await verifyFlow(readCookie(req, "form_oauth"));
    if (
      !url.searchParams.get("state") ||
      url.searchParams.get("state") !== flow.state ||
      !url.searchParams.get("code")
    )
      throw new Error("Invalid state");
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: setting("GOOGLE_CLIENT_ID"),
        client_secret: setting("GOOGLE_CLIENT_SECRET"),
        code: url.searchParams.get("code")!,
        redirect_uri: origin(req) + "/api/auth/google/callback",
        grant_type: "authorization_code",
        code_verifier: String(flow.verifier),
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Token exchange failed");
    const data = (await response.json()) as { id_token: string };
    const { payload } = await jwtVerify(data.id_token, googleKeys, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: setting("GOOGLE_CLIENT_ID"),
      algorithms: ["RS256"],
    });
    if (
      payload.nonce !== flow.nonce ||
      !payload.sub ||
      payload.email_verified !== true ||
      typeof payload.email !== "string"
    )
      throw new Error("Unverified identity");
    const session = token();
    const db = sql();
    await db.transaction([
      db`INSERT INTO users(id,email,name) VALUES(${payload.sub},${payload.email},${String(payload.name || payload.email)}) ON CONFLICT(id) DO UPDATE SET email=EXCLUDED.email,name=EXCLUDED.name`,
      db`INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(${await hash(session)},${payload.sub},now()+interval '7 days')`,
    ]);
    headers.append("Set-Cookie", cookie("form_session", session, 604800));
    headers.set("Location", origin(req) + "/?auth=success");
  } catch {
    headers.set("Location", origin(req) + "/?auth=failed");
  }
  return new Response(null, { status: 303, headers });
}
