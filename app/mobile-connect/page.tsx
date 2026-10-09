"use client";
import { useEffect, useState } from "react";
export default function MobileConnect() {
  const [ticket, setTicket] = useState("");
  const [code, setCode] = useState("");
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const value = new URLSearchParams(location.search).get("ticket") || sessionStorage.getItem("nova-pairing") || "";
    try {
      const payload = JSON.parse(atob(value.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (payload.exp * 1000 < Date.now()) throw new Error();
      setTicket(value); setCode(payload.jti.slice(0, 8).toUpperCase()); sessionStorage.setItem("nova-pairing", value);
    } catch { setMessage("Start sign-in from the NOVA Android app to get a fresh connection code."); }
    fetch("/api/shop").then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(d => { setUser(d.user); setReady(true); }).catch(() => setMessage("Could not connect. Please reload this page."));
  }, []);
  async function connect() {
    setBusy(true); setMessage("");
    try {
      const r = await fetch("/api/mobile-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "authorize", ticket }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error);
      setDone(true); sessionStorage.removeItem("nova-pairing");
    } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); }
  }
  return <main style={{ minHeight: "100vh", background: "#f5f4f0", display: "grid", placeItems: "center", padding: 24 }}>
    <section style={{ background: "white", padding: 36, borderRadius: 24, maxWidth: 480, width: "100%" }}>
      <p style={{ fontSize: 28, fontWeight: 800 }}>nova<span style={{ color: "#f15b35" }}>®</span></p>
      <p style={{ color: "#f15b35", marginTop: 28 }}>YOUR SHOP. EVERYWHERE.</p>
      <h1 style={{ fontSize: 32, lineHeight: 1.1, margin: "14px 0" }}>{done ? "You’re connected." : "Connect your Android app."}</h1>
      {done ? <p>Return to NOVA on your phone. Your account and bag will appear automatically.</p> : <>
        <p>Only approve if you started sign-in in your own NOVA app and this code matches the one shown there.</p>
        {code && <p style={{ letterSpacing: 5, fontSize: 28, fontWeight: 700, padding: "20px 0" }}>{code}</p>}
        {user && <p style={{ marginBottom: 18 }}>Connect as <strong>{user.name}</strong><br />{user.email}</p>}
        {ready && ticket && (user ? <button disabled={busy} onClick={connect} style={{ background: "#f15b35", color: "white", padding: 16, borderRadius: 12, width: "100%" }}>{busy ? "Connecting…" : "Connect my Android app"}</button> : <a href="/api/auth/google?mobile=1" style={{ display: "block", background: "#171717", color: "white", padding: 16, borderRadius: 12, textAlign: "center" }}>Continue with Google</a>)}
      </>}
      {message && <p role="alert" style={{ marginTop: 20, color: "#b33521" }}>{message}</p>}
      <p style={{ marginTop: 24, color: "#666", fontSize: 13 }}>The app uses the same NOVA account and saves its session securely on your phone.</p>
    </section>
  </main>;
}
