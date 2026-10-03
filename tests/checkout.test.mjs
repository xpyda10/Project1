import test from "node:test";
import assert from "node:assert/strict";
import {
  products,
  defaultConfig,
  lineKey,
  configuredProduct,
} from "../lib/catalog.ts";
import { cartSchema, checkoutSchema, priceCart } from "../lib/validation.ts";
const air = products[0];
const base = defaultConfig(air);
const upgraded = { cpu: "ultra7", memory: "ram-32", storage: "ssd-2000" };
test("configuration prices use server catalog values and ignore client prices", () => {
  const line = { id: air.id, quantity: 1, config: upgraded, price: 1 };
  const priced = priceCart(cartSchema.parse([line]), products);
  assert.equal(priced.total, 173900);
  assert.equal(priced.shipping, 0);
  assert.equal(priced.lines[0].configuration.memory, "32 GB");
  assert.equal(priced.lines[0].configuration.storage, "2 TB");
});
test("two configurations of the same laptop stay separate", () => {
  const items = [
    { id: air.id, quantity: 1, config: base },
    { id: air.id, quantity: 2, config: upgraded },
  ];
  assert.equal(cartSchema.safeParse(items).success, true);
  assert.equal(priceCart(items, products).total, 447700);
  assert.notEqual(lineKey(air.id, base), lineKey(air.id, upgraded));
  assert.equal(cartSchema.safeParse([items[0], items[0]]).success, false);
});
test("incompatible and fabricated upgrades are rejected", () => {
  assert.throws(
    () => configuredProduct(air, { ...base, cpu: "ultra9" }),
    /unavailable/,
  );
  assert.throws(
    () => configuredProduct(air, { ...base, memory: "ram-128" }),
    /unavailable/,
  );
  assert.throws(
    () => priceCart([{ id: "fake", quantity: 1, config: base }], products),
    /product/,
  );
  for (const quantity of [-1, 0, 1.5, 11])
    assert.equal(
      cartSchema.safeParse([{ id: air.id, quantity, config: base }]).success,
      false,
    );
});
test("checkout validates address, email, bag, and idempotency key", () => {
  const good = {
    key: "42b6da17-1724-4fc1-8556-f29483d7c8b8",
    items: [{ id: air.id, quantity: 1, config: base }],
    email: "test@example.com",
    name: "Test Person",
    address: "123 Example Street",
    city: "Example City",
    postalCode: "12345",
    country: "Example Country",
  };
  assert.equal(checkoutSchema.safeParse(good).success, true);
  for (const invalid of [
    { email: "bad" },
    { items: [] },
    { key: "fake" },
    { address: "" },
  ])
    assert.equal(
      checkoutSchema.safeParse({ ...good, ...invalid }).success,
      false,
    );
});
test("every advertised model and option can be priced", () => {
  for (const p of products) {
    assert.equal(configuredProduct(p, defaultConfig(p)).price, p.price);
    for (const cpu of p.options.cpu)
      for (const memory of p.options.memory)
        for (const storage of p.options.storage) {
          const result = configuredProduct(p, {
            cpu: cpu.id,
            memory: memory.id,
            storage: storage.id,
          });
          assert.equal(
            result.price,
            p.price + cpu.delta + memory.delta + storage.delta,
          );
        }
  }
});
