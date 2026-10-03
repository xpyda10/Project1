import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import { setting } from "./server";
export const googleKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);
export const signingKey = () =>
  new TextEncoder().encode(setting("SESSION_SECRET"));
export const signFlow = async (payload: Record<string, string>) =>
  new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(signingKey());
export const verifyFlow = async (value: string) =>
  (await jwtVerify(value, signingKey(), { algorithms: ["HS256"] })).payload;
