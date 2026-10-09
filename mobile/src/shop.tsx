import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { fetch } from 'expo/fetch';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';

export const SITE = 'https://nova-shop-eight-mu.vercel.app';
export type Configuration = { cpu: string; memory: string; storage: string };
export type Option = { id: string; label: string; detail: string; delta: number };
export type Product = { id: string; name: string; price: number; image: string; series: string; category: string; tagline: string; description: string; display: string; weight: string; battery: string; graphics: string; finish: string; options: Record<keyof Configuration, Option[]> };
export type Item = { id: string; quantity: number; config: Configuration };
export type User = { id: string; name: string; email: string };
export const money = (amount: number) => '$' + (amount / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const keyOf = (item: Item) => [item.id, item.config.cpu, item.config.memory, item.config.storage].join('|');
export const defaults = (p: Product): Configuration => ({ cpu: p.options.cpu[0].id, memory: p.options.memory[0].id, storage: p.options.storage[0].id });
export function configured(p: Product, config: Configuration) {
  const options = (Object.keys(config) as (keyof Configuration)[]).map(k => p.options[k].find(o => o.id === config[k]));
  if (options.some(o => !o)) throw new Error('This configuration is no longer available.');
  return { price: p.price + options.reduce((n, o) => n + o!.delta, 0), labels: options.map(o => o!.label) };
}
type Shop = {
  products: Product[]; items: Item[]; user: User | null; loading: boolean; busy: boolean;
  error: string; connected: boolean; pairing: string; refresh: () => Promise<void>;
  signIn: () => Promise<void>; cancelSignIn: () => void; signOut: () => Promise<void>;
  save: (items: Item[]) => Promise<boolean>;
  checkout: (details: Record<string, string>, key: string) => Promise<{ id: string; total: number; emailStatus: string }>;
};
const Context = createContext<Shop | null>(null);
export const useShop = () => { const value = useContext(Context); if (!value) throw new Error('Missing shop provider'); return value; };
export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [pairing, setPairing] = useState('');
  const [session, setSession] = useState('');
  const sessionRef = useRef('');
  const saving = useRef(false);
  const pairingRun = useRef(0);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const latestRefresh = useRef<() => Promise<void>>(async () => {});

  async function clearSession() {
    sessionRef.current = ''; setSession(''); setUser(null); setItems([]); setConnected(false);
    await SecureStore.deleteItemAsync('nova-session');
  }
  async function request(path: string, body?: unknown, explicitSession = sessionRef.current) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(SITE + path, {
        method: body ? 'POST' : 'GET', credentials: 'omit',
        headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(explicitSession ? { Authorization: 'Bearer ' + explicitSession } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}), signal: controller.signal,
      });
      if (response.status === 401) { await clearSession(); throw new Error('Your session expired. Please sign in again.'); }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not connect. Please try again.');
      return result;
    } finally { clearTimeout(timer); }
  }
  async function refresh() {
    const before = sessionRef.current;
    const data = await request('/api/shop');
    if (before !== sessionRef.current) return;
    setProducts(data.products); setUser(data.user);
    if (!saving.current) setItems(data.user ? data.items : []);
    setError('');
  }
  useEffect(() => { latestRefresh.current = refresh; });
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync('nova-session');
        if (!alive) return;
        sessionRef.current = saved || ''; setSession(saved || '');
        await latestRefresh.current();
      } catch (e) { if (alive) setError((e as Error).message); }
      finally { if (alive) setLoading(false); }
    })();
    const listener = AppState.addEventListener('change', state => { setActive(state === 'active'); if (state !== 'active') setConnected(false); });
    // The generation is a cancellation counter, not a captured DOM ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { alive = false; pairingRun.current++; listener.remove(); };
  }, []);

  useEffect(() => {
    if (!active || !session) return;
    const controller = new AbortController();
    let retry = 1000;
    (async () => {
      while (!controller.signal.aborted) {
        try {
          const response = await fetch(SITE + '/api/cart-events', {
            headers: { Authorization: 'Bearer ' + session, Accept: 'text/event-stream' },
            credentials: 'omit', signal: controller.signal,
          });
          if (response.status === 401) { await clearSession(); setError('Please sign in again.'); return; }
          if (!response.ok || !response.body) throw new Error('Sync is reconnecting');
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (!controller.signal.aborted) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let end: number;
            while ((end = buffer.indexOf('\n\n')) >= 0) {
              const event = buffer.slice(0, end); buffer = buffer.slice(end + 2);
              if (!event.startsWith('data: ')) continue;
              const data = JSON.parse(event.slice(6));
              if (data.expired) { await clearSession(); return; }
              if (data.items && !controller.signal.aborted && sessionRef.current === session) {
                setConnected(true); retry = 1000;
                if (!saving.current) setItems(data.items);
              }
            }
          }
        } catch { /* Reconnect while foregrounded; no background polling. */ }
        if (!controller.signal.aborted) {
          setConnected(false);
          await new Promise(resolve => setTimeout(resolve, retry));
          retry = Math.min(retry * 2, 10000);
        }
      }
    })();
    return () => controller.abort();
  }, [session, active]);

  async function signIn() {
    const run = ++pairingRun.current;
    setError('');
    try {
      const verifier = Crypto.randomUUID() + Crypto.randomUUID();
      const challenge = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier);
      const begin = await request('/api/mobile-auth', { action: 'begin', challenge }, '');
      if (run !== pairingRun.current) return;
      setPairing(begin.code);
      // The connection ticket contains no session token. Only this app holds its proof.
      void WebBrowser.openBrowserAsync(begin.url).catch(e => setError(e.message));
      const deadline = Date.now() + 10 * 60 * 1000;
      while (run === pairingRun.current && Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (run !== pairingRun.current) return;
        const data = await request('/api/mobile-auth', { action: 'redeem', ticket: begin.ticket, verifier }, '');
        if (data.session) {
          if (run !== pairingRun.current) return;
          await SecureStore.setItemAsync('nova-session', data.session);
          sessionRef.current = data.session; setSession(data.session); setPairing('');
          await latestRefresh.current(); return;
        }
      }
      if (run === pairingRun.current) throw new Error('Sign-in timed out. Please try again.');
    } catch (e) { if (run === pairingRun.current) { setError((e as Error).message); setPairing(''); } }
  }
  async function signOut() {
    pairingRun.current++; setPairing('');
    try { if (sessionRef.current) await request('/api/shop', { action: 'logout' }); }
    catch (e) { setError((e as Error).message); return; }
    await clearSession();
  }
  async function save(next: Item[]) {
    if (saving.current) return false;
    if (!sessionRef.current) { setError('Sign in to save your bag across devices.'); return false; }
    saving.current = true; setBusy(true); setError('');
    try { await request('/api/shop', { action: 'cart', items: next, baseItems: items }); setItems(next); return true; }
    catch (e) {
      setError((e as Error).message);
      saving.current = false;
      try { const d = await request('/api/shop'); setItems(d.items); } catch { /* retain error */ }
      return false;
    } finally { saving.current = false; setBusy(false); }
  }
  async function checkout(details: Record<string, string>, key: string) {
    if (saving.current || !sessionRef.current) throw new Error('Please sign in and wait for your bag to finish saving.');
    saving.current = true; setBusy(true);
    try {
      const data = await request('/api/shop', { action: 'checkout', key, items, ...details });
      // Never clear a new item added on another device during checkout.
      const snapshot = await request('/api/shop'); setItems(snapshot.items);
      return data;
    } finally { saving.current = false; setBusy(false); }
  }
  return <Context.Provider value={{ products, items, user, loading, busy, error, connected, pairing, refresh, signIn, signOut, cancelSignIn: () => { pairingRun.current++; setPairing(''); }, save, checkout }}>{children}</Context.Provider>;
}
