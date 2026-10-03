import { googleReady, cookie, origin, setting, token } from "@/lib/server";
import { signFlow } from "@/lib/oauth";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  if (!googleReady())
    return Response.redirect(new URL("/?auth=unavailable", origin(req)), 303);
  const state = token();
  const nonce = token();
  const verifier = token();
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
  );
  const challenge = btoa(String.fromCharCode(...digest))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const params = new URLSearchParams({
    client_id: setting("GOOGLE_CLIENT_ID"),
    redirect_uri: origin(req) + "/api/auth/google/callback",
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: "https://accounts.google.com/o/oauth2/v2/auth?" + params,
      "Set-Cookie": cookie(
        "form_oauth",
        await signFlow({ state, nonce, verifier }),
        600,
      ),
      "Cache-Control": "no-store",
    },
  });
}
