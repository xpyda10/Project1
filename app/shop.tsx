"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  UserRound,
  Search,
  Plus,
  Minus,
  Check,
  Truck,
  ShieldCheck,
  SlidersHorizontal,
  Cpu,
  Monitor,
  MemoryStick,
  HardDrive,
  ChevronRight,
  Trash2,
  LockKeyhole,
  PackageCheck,
  Headphones,
  MoveUpRight,
  Zap,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster, toast } from "sonner";
import {
  products as seed,
  money,
  defaultConfig,
  configuredProduct,
  lineKey,
  type Product,
  type Configuration,
} from "@/lib/catalog";
import { priceCart, cartSchema, type CartItem } from "@/lib/validation";
type User = { name: string; email: string };
type Result = { id: string; total: number; emailStatus: string; mode: string };
let demoCart: CartItem[] = [];
async function action(body: unknown) {
  const response = await fetch("/api/shop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as Result & { error?: string };
  if (!response.ok) throw new Error(data.error || "Please try again.");
  return data;
}
function Brand() {
  return (
    <span className="brand">
      <span className="brand-symbol" aria-hidden="true">
        n
      </span>
      nova<span className="brand-dot">®</span>
    </span>
  );
}
function Configurator({
  product,
  onClose,
  onAdd,
  busy,
  ready,
}: {
  product: Product | null;
  onClose: () => void;
  onAdd: (p: Product, c: Configuration) => Promise<boolean>;
  busy: boolean;
  ready: boolean;
}) {
  const [config, setConfig] = useState<Configuration | null>(null);
  useEffect(() => {
    setConfig(product ? defaultConfig(product) : null);
  }, [product]);
  const selected =
    product && config ? configuredProduct(product, config) : null;
  return (
    <Dialog
      open={!!product}
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="config-dialog">
        {product && config && selected && (
          <>
            <div className="config-visual">
              <div className="config-brand">
                <Brand />
                <span>BUILT AROUND YOU</span>
              </div>
              <div
                className={`config-image ${product.series === "Studio" ? "dark-image" : ""}`}
              >
                <img src={product.image} alt={product.name} />
              </div>
              <div className="visual-caption">
                <span className="eyebrow">{product.finish}</span>
                <h3>{product.tagline}</h3>
                <div className="config-fixed">
                  <span>
                    <Monitor />
                    {product.display}
                  </span>
                  <span>
                    <Zap />
                    {product.graphics}
                  </span>
                </div>
                <p>Product render · Sample specifications</p>
              </div>
            </div>
            <div className="config-details">
              <p className="eyebrow orange">YOUR LAPTOP. YOUR RULES.</p>
              <DialogTitle className="config-title">
                Make {product.name.replace("NOVA ", "")} yours.
              </DialogTitle>
              <DialogDescription className="config-description">
                Start with a great laptop. Build the one that’s right for you.
              </DialogDescription>
              {(["cpu", "memory", "storage"] as const).map((key, index) => (
                <section className="option-section" key={key}>
                  <div className="option-heading">
                    <h4>
                      <span>0{index + 1}</span>
                      {key === "cpu"
                        ? "Processor"
                        : key === "memory"
                          ? "Memory"
                          : "Storage"}
                    </h4>
                    <span>
                      {key === "cpu"
                        ? "The power behind your work"
                        : key === "memory"
                          ? "Room for more at once"
                          : "Space for everything you make"}
                    </span>
                  </div>
                  <RadioGroup
                    aria-label={
                      key === "cpu"
                        ? "Processor"
                        : key === "memory"
                          ? "Memory"
                          : "Storage"
                    }
                    value={config[key]}
                    onValueChange={(value) =>
                      setConfig({ ...config, [key]: value })
                    }
                    className={`option-grid ${key === "cpu" ? "processor-options" : ""}`}
                    disabled={busy}
                  >
                    {product.options[key].map((o) => (
                      <label
                        key={o.id}
                        className={`spec-option ${config[key] === o.id ? "chosen" : ""}`}
                      >
                        <RadioGroupItem value={o.id} className="spec-radio" />
                        <span>
                          <strong>{o.label}</strong>
                          <small>
                            {key === "cpu"
                              ? o.detail
                              : key === "memory"
                                ? "LPDDR5X"
                                : "NVMe SSD"}
                          </small>
                        </span>
                        <em>{o.delta ? `+${money(o.delta)}` : "Included"}</em>
                      </label>
                    ))}
                  </RadioGroup>
                </section>
              ))}
              <div className="config-footer">
                <div>
                  <small>Your configuration</small>
                  <strong aria-live="polite">{money(selected.price)}</strong>
                  <span>Complimentary delivery</span>
                </div>
                <button
                  className="button orange-button"
                  disabled={!ready || busy}
                  onClick={() => onAdd(product, config)}
                >
                  <ShoppingBag size={17} />
                  {busy ? "Adding…" : "Add to bag"}
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
export default function Shop({ checkout = false }: { checkout?: boolean }) {
  const [catalog, setCatalog] = useState<Product[]>(seed);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState("All laptops");
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState<"bag" | "account" | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [mode, setMode] = useState("loading");
  const [ready, setReady] = useState(false);
  const [google, setGoogle] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const orderKey = useRef("");
  const searchRef = useRef<HTMLInputElement>(null);
  const totals = priceCart(cart, catalog);
  const count = cart.reduce((n, i) => n + i.quantity, 0);
  useEffect(() => {
    let active = true;
    fetch("/api/shop")
      .then(async (r) => {
        const d = (await r.json()) as {
          error?: string;
          products: Product[];
          items: CartItem[];
          user: User | null;
          googleReady: boolean;
          mode: string;
        };
        if (!r.ok) throw new Error(d.error);
        return d;
      })
      .then((d) => {
        if (!active) return;
        const validCatalog = d.products.filter((p) => p.options);
        if (!validCatalog.length)
          throw new Error(
            "The laptop collection needs to be seeded. Run npm run db:setup.",
          );
        setCatalog(validCatalog);
        const raw = d.mode === "demo" ? demoCart : d.items;
        const parsed = cartSchema.safeParse(raw);
        const restored = parsed.success
          ? parsed.data.filter((i) => {
              try {
                priceCart([i], validCatalog);
                return true;
              } catch {
                return false;
              }
            })
          : [];
        setCart(restored);
        setUser(d.user);
        setGoogle(d.googleReady);
        setMode(d.mode);
        setReady(true);
      })
      .catch((e) => {
        if (active) {
          setMode("error");
          setError(e.message);
        }
      });
    const auth = new URLSearchParams(location.search).get("auth");
    if (auth === "failed")
      toast.error("Google sign-in did not finish. Please try again.");
    if (auth === "success") toast.success("Welcome to NOVA.");
    if (auth === "unavailable") setPanel("account");
    return () => {
      active = false;
    };
  }, []);
  async function saveCart(next: CartItem[]) {
    if (saving.current || !ready) return false;
    saving.current = true;
    setBusy(true);
    try {
      await action({ action: "cart", items: next });
      setCart(next);
      if (mode === "demo") demoCart = next;
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  async function add(p: Product, config: Configuration) {
    const key = lineKey(p.id, config);
    const existing = cart.find((i) => lineKey(i.id, i.config) === key);
    if (existing && existing.quantity >= 10) {
      toast.error("A maximum of 10 of each configuration is allowed.");
      return false;
    }
    const next = existing
      ? cart.map((i) =>
          lineKey(i.id, i.config) === key
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        )
      : [...cart, { id: p.id, quantity: 1, config }];
    const ok = await saveCart(next);
    if (ok) {
      setProduct(null);
      setPanel("bag");
      toast.success("Your custom build is in the bag.");
    }
    return ok;
  }
  async function quantity(key: string, n: number) {
    if (n > 10) return;
    await saveCart(
      n === 0
        ? cart.filter((i) => lineKey(i.id, i.config) !== key)
        : cart.map((i) =>
            lineKey(i.id, i.config) === key ? { ...i, quantity: n } : i,
          ),
    );
  }
  function browse(cat = "All laptops") {
    setCategory(cat);
    setQuery("");
    document
      .getElementById("collection")
      ?.scrollIntoView({ behavior: "smooth" });
  }
  useEffect(() => {
    const ctx = (
      document as unknown as {
        modelContext?: { registerTool: (t: unknown, o: unknown) => unknown };
      }
    ).modelContext;
    if (!ctx?.registerTool || !ready) return;
    const lifecycle = new AbortController();
    Promise.resolve(
      ctx.registerTool(
        {
          name: "view_shop_catalog",
          description:
            "Read NOVA laptops, base prices in cents, and available specification upgrades.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true },
          execute: (input: unknown) => {
            if (
              !input ||
              typeof input !== "object" ||
              Object.keys(input).length
            )
              throw new Error("Pass an empty object.");
            return {
              products: catalog.map(({ id, name, price, options }) => ({
                id,
                name,
                price,
                options,
              })),
            };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => {});
    return () => lifecycle.abort();
  }, [catalog, ready]);
  async function placeOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    orderKey.current ||= crypto.randomUUID();
    const fields = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const order = await action({
        ...fields,
        action: "checkout",
        key: orderKey.current,
        items: cart,
      });
      setResult(order);
      setCart([]);
      demoCart = [];
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  const visible = catalog.filter(
    (p) =>
      (category === "All laptops" || p.category === category) &&
      `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  const hero = catalog.find((p) => p.series === "Studio") || seed[2];
  const bagLines = (
    <>
      {totals.lines.map((item) => (
        <div className="bag-line" key={item.line_key}>
          <img src={item.image} alt={item.name} />
          <div className="line-info">
            <h3>{item.name}</h3>
            <p>{item.configuration.cpu}</p>
            <p>
              {item.configuration.memory} memory · {item.configuration.storage}{" "}
              SSD
            </p>
            <div className="quantity">
              <button
                disabled={busy}
                aria-label={`Decrease ${item.name} ${item.specs}`}
                onClick={() => quantity(item.line_key, item.quantity - 1)}
              >
                <Minus size={12} />
              </button>
              <span>{item.quantity}</span>
              <button
                disabled={busy || item.quantity >= 10}
                aria-label={`Increase ${item.name} ${item.specs}`}
                onClick={() => quantity(item.line_key, item.quantity + 1)}
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
          <div className="line-end">
            <strong>{money(item.price * item.quantity)}</strong>
            <button
              disabled={busy}
              aria-label={`Remove ${item.name} ${item.specs}`}
              onClick={() => quantity(item.line_key, 0)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </>
  );
  const emailText =
    result?.emailStatus === "sent"
      ? "Your confirmation is on its way. Check your inbox for your build details."
      : result?.emailStatus === "demo"
        ? "This is a demo order. Nothing was saved, no email was sent, and no payment was taken."
        : result?.emailStatus === "not_configured"
          ? "Your order is saved. Connect Mailgun to send the confirmation."
          : result?.emailStatus === "sending"
            ? "Your order is saved. Your confirmation email is being processed."
            : "Your order is saved, but its confirmation email has not been sent.";
  return (
    <>
      <Toaster position="bottom-right" />
      <div className="announcement">
        <span>YOUR NEXT CHAPTER STARTS HERE</span>
        <span>
          Complimentary delivery on every laptop{" "}
          <span className="bar-divider">|</span> Configure it your way
        </span>
      </div>
      <header className="header">
        <Link className="brand-link" href="/" aria-label="NOVA home">
          <Brand />
        </Link>
        <nav>
          {checkout ? (
            <>
              <Link href="/#collection">Shop laptops</Link>
              <Link href="/#why-nova">Why NOVA</Link>
            </>
          ) : (
            <>
              <button onClick={() => browse()}>Shop laptops</button>
              <button onClick={() => browse("Creative")}>For creators</button>
              <button onClick={() => browse("Gaming")}>For gamers</button>
              <a href="#why-nova">Why NOVA</a>
            </>
          )}
        </nav>
        <div className="header-actions">
          {!checkout && (
            <button
              aria-label="Search laptops"
              onClick={() => {
                browse();
                searchRef.current?.focus();
              }}
            >
              <Search size={20} />
            </button>
          )}
          <button aria-label="Your account" onClick={() => setPanel("account")}>
            <UserRound size={20} />
          </button>
          <button
            className="bag-button"
            aria-label={`Shopping bag, ${count} items`}
            onClick={() => setPanel("bag")}
          >
            <ShoppingBag size={20} />
            <span className="bag-label">Bag</span>
            <b>{count}</b>
          </button>
        </div>
      </header>
      {mode === "error" && (
        <div role="alert" className="error-banner">
          {error} <button onClick={() => location.reload()}>Try again</button>
        </div>
      )}
      {checkout ? (
        <main className="checkout-main">
          {result ? (
            <section className="confirmation">
              <div className="success-icon">
                <Check size={32} />
              </div>
              <p className="eyebrow orange">
                {result.mode === "demo"
                  ? "DEMO CHECKOUT COMPLETE"
                  : "YOUR NEXT CHAPTER IS ON ITS WAY"}
              </p>
              <h1>
                Great things
                <br />
                start here.
              </h1>
              <p>
                {result.mode === "demo"
                  ? "You’ve built your NOVA."
                  : "Thank you for choosing NOVA."}
              </p>
              <div className="receipt">
                <span>ORDER REFERENCE</span>
                <strong>{result.id.slice(0, 8).toUpperCase()}</strong>
                <div>
                  Total <b>{money(result.total)}</b>
                </div>
                <p>{emailText}</p>
                {result.mode === "live" &&
                  ["failed", "not_configured", "pending"].includes(
                    result.emailStatus,
                  ) && (
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          const d = await action({
                            action: "retry-email",
                            id: result.id,
                          });
                          setResult({ ...result, emailStatus: d.emailStatus });
                        } catch (e) {
                          toast.error((e as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Retry confirmation
                    </button>
                  )}
              </div>
              <Link href="/" className="button dark-button">
                Back to NOVA
              </Link>
            </section>
          ) : !ready ? (
            <div className="empty-state">
              <h2>
                {mode === "error"
                  ? "Checkout unavailable"
                  : "Preparing your build…"}
              </h2>
              <p>{error || "Just a moment."}</p>
            </div>
          ) : !cart.length ? (
            <div className="empty-state">
              <ShoppingBag size={36} />
              <h2>Your next laptop is waiting.</h2>
              <p>Your bag is empty. Let’s build something great.</p>
              <Link href="/#collection" className="button orange-button">
                Explore laptops
              </Link>
            </div>
          ) : (
            <>
              <div className="breadcrumbs">
                <Link href="/">Home</Link>
                <ChevronRight />
                <span>Checkout</span>
              </div>
              <div className="checkout-grid">
                <section>
                  <p className="eyebrow orange">ONE LAST THING</p>
                  <h1>Make it official.</h1>
                  <p className="checkout-intro">
                    Your next chapter is just a few details away.
                  </p>
                  {mode === "demo" && (
                    <div className="demo-note">
                      <strong>Demo checkout</strong> Use fictional details.
                      Orders and emails are enabled when the services are
                      connected.
                    </div>
                  )}
                  <button
                    className="google-button"
                    onClick={() =>
                      user
                        ? setPanel("account")
                        : google
                          ? location.assign("/api/auth/google")
                          : setPanel("account")
                    }
                  >
                    <b className="google-g">G</b>
                    {user
                      ? `Signed in as ${user.name}`
                      : "Continue with Google"}
                  </button>
                  <div className="or-divider">
                    <span>or checkout as a guest</span>
                  </div>
                  <form onSubmit={placeOrder}>
                    <fieldset disabled={busy}>
                      <legend>01 &nbsp; Contact information</legend>
                      <label>
                        Email address
                        <input
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          required
                          maxLength={254}
                          defaultValue={user?.email}
                        />
                      </label>
                      <h3 className="second-legend">
                        02 &nbsp; Delivery details
                      </h3>
                      <label>
                        Full name
                        <input
                          name="name"
                          autoComplete="name"
                          placeholder="Alex Morgan"
                          required
                          minLength={2}
                          maxLength={100}
                          defaultValue={user?.name}
                        />
                      </label>
                      <label>
                        Street address
                        <input
                          name="address"
                          autoComplete="street-address"
                          placeholder="Street and house number"
                          required
                          minLength={4}
                          maxLength={200}
                        />
                      </label>
                      <div className="field-pair">
                        <label>
                          City
                          <input
                            name="city"
                            autoComplete="address-level2"
                            placeholder="City"
                            required
                            minLength={2}
                            maxLength={100}
                          />
                        </label>
                        <label>
                          Postal code
                          <input
                            name="postalCode"
                            autoComplete="postal-code"
                            placeholder="Postal code"
                            required
                            minLength={2}
                            maxLength={20}
                          />
                        </label>
                      </div>
                      <label>
                        Country
                        <input
                          name="country"
                          autoComplete="country-name"
                          placeholder="Country"
                          required
                          minLength={2}
                          maxLength={100}
                        />
                      </label>
                    </fieldset>
                    <div className="payment-note">
                      <LockKeyhole size={18} />
                      <p>
                        <strong>No payment required.</strong> Student concept
                        store. No charge or physical shipment.
                      </p>
                    </div>
                    {error && (
                      <p className="form-error" role="alert">
                        {error}
                      </p>
                    )}
                    <button
                      className="button orange-button full"
                      disabled={busy || !ready}
                    >
                      {busy
                        ? "Placing your order…"
                        : `${mode === "demo" ? "Place demo order" : "Place order"} · ${money(totals.total)}`}
                    </button>
                  </form>
                </section>
                <aside className="order-summary">
                  <div className="summary-title">
                    <h2>Your custom build</h2>
                    <span>
                      {count} {count === 1 ? "laptop" : "laptops"}
                    </span>
                  </div>
                  {bagLines}
                  <div className="totals">
                    <div>
                      <span>Subtotal</span>
                      <span>{money(totals.subtotal)}</span>
                    </div>
                    <div>
                      <span>Delivery</span>
                      <span className="delivery-free">On us</span>
                    </div>
                    <div className="grand-total">
                      <span>
                        Total <small>USD</small>
                      </span>
                      <strong>{money(totals.total)}</strong>
                    </div>
                  </div>
                  <p className="summary-note">
                    <ShieldCheck size={17} /> Your specifications are included
                    with your order.
                  </p>
                  <Link href="/" className="text-link">
                    Continue shopping
                  </Link>
                </aside>
              </div>
            </>
          )}
        </main>
      ) : (
        <main>
          <section className="hero">
            <div className="hero-art">
              <img
                src="/images/nova-studio.webp"
                alt="NOVA Studio graphite laptop with an orange abstract display"
                fetchPriority="high"
              />
            </div>
            <div className="hero-copy">
              <div className="hero-eyebrow">
                <span>MEET NOVA STUDIO 16</span>
                <b>NEW PERSPECTIVES</b>
              </div>
              <h1>
                Your next move.
                <br />
                Made <span>powerful.</span>
              </h1>
              <p>
                For the work you love. The worlds you explore.
                <br />A laptop built around what comes next.
              </p>
              <div className="hero-buttons">
                <button
                  className="button orange-button"
                  onClick={() => setProduct(hero)}
                >
                  Build your Studio
                </button>
                <button
                  className="button hero-secondary"
                  onClick={() => browse()}
                >
                  Explore all laptops
                </button>
              </div>
              <div className="hero-price">
                <span>From {money(hero.price)}</span>
                <i />
                Configured by you. Crafted by NOVA.
              </div>
            </div>
            <div className="hero-bottom">
              <span>LESS LIMITS. MORE POSSIBILITIES.</span>
              <div>
                <span>16″ OLED</span>
                <i />
                <span>Up to 64 GB RAM</span>
                <i />
                <span>All you.</span>
              </div>
            </div>
          </section>
          <div className="benefits">
            <span>
              <Truck /> Delivery, on us
            </span>
            <span>
              <SlidersHorizontal /> Built to your specifications
            </span>
            <span>
              <ShieldCheck /> Secure checkout
            </span>
            <span>
              <Cpu /> Power for every purpose
            </span>
          </div>
          <section className="collection" id="collection">
            <div className="section-heading">
              <div>
                <p className="eyebrow orange">THE NOVA LINEUP</p>
                <h2>Find your kind of powerful.</h2>
              </div>
              <p>
                Different ambitions. Same attention to detail.
                <br />
                Find your fit, then make it yours.
              </p>
            </div>
            <div className="collection-bar">
              <Tabs value={category} onValueChange={setCategory}>
                <TabsList className="category-tabs">
                  {["All laptops", "Everyday", "Creative", "Gaming"].map(
                    (c) => (
                      <TabsTrigger key={c} value={c}>
                        {c}
                      </TabsTrigger>
                    ),
                  )}
                </TabsList>
              </Tabs>
              <div className="catalog-search">
                <Search size={16} />
                <input
                  ref={searchRef}
                  aria-label="Search the laptop collection"
                  placeholder="Find your laptop"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="product-grid">
              {visible.map((p) => (
                <article key={p.id} className="product-card">
                  <div className="card-top">
                    <span>{p.category}</span>
                    <span
                      className="color-dot"
                      style={{ background: p.accent }}
                    />
                  </div>
                  <button
                    className={`product-image ${p.series === "Studio" ? "dark-image" : ""}`}
                    onClick={() => setProduct(p)}
                    aria-label={`Explore ${p.name}`}
                  >
                    <img src={p.image} alt={p.name} loading="lazy" />
                  </button>
                  <div className="product-body">
                    <p className="product-tag">{p.tag}</p>
                    <h3>
                      <button onClick={() => setProduct(p)}>{p.name}</button>
                    </h3>
                    <p className="product-tagline">{p.tagline}</p>
                    <div className="card-specs">
                      <span>
                        <Monitor />
                        {p.display}
                      </span>
                      <span>
                        <MemoryStick />
                        {p.options.memory[0].label} memory
                      </span>
                      <span>
                        <HardDrive />
                        {p.options.storage[0].label} SSD
                      </span>
                    </div>
                    <div className="product-bottom">
                      <div>
                        <small>From</small>
                        <strong>{money(p.price)}</strong>
                      </div>
                      <button
                        className="configure-button"
                        onClick={() => setProduct(p)}
                        aria-label={`Configure ${p.name}`}
                      >
                        Configure <Plus size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {!visible.length && (
              <div className="empty-state">
                <h3>No laptops found.</h3>
                <button
                  className="text-link"
                  onClick={() => {
                    setQuery("");
                    setCategory("All laptops");
                  }}
                >
                  Show all laptops
                </button>
              </div>
            )}
            <p className="collection-footnote">
              Every model is just the beginning. Choose the processor, memory,
              and storage that work for you.
            </p>
          </section>
          <section className="build-banner">
            <div>
              <span className="eyebrow">STANDARD IS ONLY THE START.</span>
              <h2>
                Good on paper.
                <br />
                <span>Even better, your way.</span>
              </h2>
              <p>
                More tabs. Bigger projects. A growing game library.
                <br />
                Build a laptop that keeps up with your kind of life.
              </p>
              <button
                className="button dark-button"
                onClick={() => setProduct(hero)}
              >
                <SlidersHorizontal size={17} /> Create your configuration
              </button>
            </div>
            <div className="build-stack">
              <div>
                <Cpu />
                <span>
                  <small>PROCESSOR</small>Think bigger.
                </span>
                <b>01</b>
              </div>
              <div>
                <MemoryStick />
                <span>
                  <small>MEMORY</small>Do more at once.
                </span>
                <b>02</b>
              </div>
              <div>
                <HardDrive />
                <span>
                  <small>STORAGE</small>Make room for what’s next.
                </span>
                <b>03</b>
              </div>
              <p>
                <Check size={15} /> Your specs. Your price. No guesswork.
              </p>
            </div>
          </section>
          <section className="why-nova" id="why-nova">
            <div className="why-title">
              <p className="eyebrow orange">THE NOVA DIFFERENCE</p>
              <h2>
                Considered from
                <br />
                the inside out.
              </h2>
            </div>
            <div>
              <SlidersHorizontal />
              <h3>Made for your workflow.</h3>
              <p>
                Choose what matters to you. Every upgrade is clear, with pricing
                that updates as you build.
              </p>
            </div>
            <div>
              <PackageCheck />
              <h3>Every detail, together.</h3>
              <p>
                Your exact specification travels with your order, from the bag
                to your confirmation.
              </p>
            </div>
            <div>
              <Monitor />
              <h3>One family. Your fit.</h3>
              <p>
                Lightweight everyday companions, creative workstations, and
                serious gaming machines.
              </p>
            </div>
          </section>
        </main>
      )}
      <footer>
        <div className="footer-main">
          <div>
            <Link href="/" aria-label="NOVA home">
              <Brand />
            </Link>
            <p>Built for what’s next.</p>
          </div>
          <div className="footer-links">
            <Link href="/#collection">The collection</Link>
            <button onClick={() => setProduct(hero)}>Build your NOVA</button>
            <button onClick={() => setPanel("account")}>Your account</button>
          </div>
          <span className="footer-statement">
            MAKE IT
            <br />
            <em>YOUR OWN.</em>
          </span>
        </div>
        <div className="footer-bottom">
          <span>© 2026 NOVA. A student concept store.</span>
          <span>
            Sample hardware & pricing · {mode === "demo" ? "Demo mode · " : ""}
            USD $
          </span>
        </div>
      </footer>
      <Configurator
        product={product}
        onClose={() => setProduct(null)}
        onAdd={add}
        ready={ready}
        busy={busy}
      />
      <Sheet
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
        }}
      >
        <SheetContent className="shop-sheet">
          <SheetTitle className="sheet-title">
            {panel === "bag"
              ? `Your bag (${count})`
              : user
                ? "Welcome back."
                : "Welcome to NOVA."}
          </SheetTitle>
          <SheetDescription>
            {panel === "bag"
              ? "Your next chapter, configured by you."
              : user
                ? user.email
                : "A space for your next big thing."}
          </SheetDescription>
          {panel === "bag" ? (
            <>
              {mode === "demo" && (
                <div className="demo-note">
                  Demo bag · Temporary for this visit.
                </div>
              )}
              {cart.length ? (
                <>
                  <div className="sheet-lines">{bagLines}</div>
                  <div className="bag-bottom">
                    <div className="bag-total">
                      <span>Subtotal</span>
                      <strong>{money(totals.total)}</strong>
                    </div>
                    <p>Complimentary delivery. All prices in USD.</p>
                    <Link
                      href="/checkout"
                      className={`button orange-button full ${busy ? "disabled-link" : ""}`}
                      onClick={(e) => {
                        if (busy) e.preventDefault();
                        else setPanel(null);
                      }}
                    >
                      Continue to checkout
                    </Link>
                    <button
                      className="text-link"
                      onClick={() => setPanel(null)}
                    >
                      Keep exploring
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <ShoppingBag size={36} />
                  <h2>Make room for what’s next.</h2>
                  <p>Your bag is empty.</p>
                  <Link
                    href="/#collection"
                    className="button dark-button"
                    onClick={() => setPanel(null)}
                  >
                    Explore laptops
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="account-content">
              <div className="account-avatar">
                {user ? user.name.charAt(0) : <UserRound size={28} />}
              </div>
              {user ? (
                <>
                  <h2>{user.name}</h2>
                  <p>You’re signed in with Google.</p>
                  <button
                    className="button secondary full"
                    onClick={async () => {
                      try {
                        await action({ action: "logout" });
                        setUser(null);
                        toast.success("Signed out");
                      } catch (e) {
                        toast.error((e as Error).message);
                      }
                    }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <h2>Your world. Your NOVA.</h2>
                  <p>Sign in to connect your orders to your account.</p>
                  {google ? (
                    <a className="google-button" href="/api/auth/google">
                      <b className="google-g">G</b>Sign in with Google
                    </a>
                  ) : (
                    <>
                      <button className="google-button" disabled>
                        <b className="google-g">G</b>Sign in with Google
                      </button>
                      <div className="demo-note">
                        Google sign-in needs your Neon and Google credentials.
                        Follow the project setup guide. Guest checkout is
                        available now.
                      </div>
                    </>
                  )}
                  <button className="text-link" onClick={() => setPanel(null)}>
                    Continue as a guest
                  </button>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
