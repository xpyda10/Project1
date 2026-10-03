import { z } from "zod";
import { configuredProduct, lineKey, type Product } from "./catalog.ts";
export const configSchema = z.object({
  cpu: z.string().min(1).max(40),
  memory: z.string().min(1).max(40),
  storage: z.string().min(1).max(40),
});
export const cartSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(80),
      quantity: z.number().int().min(1).max(10),
      config: configSchema,
    }),
  )
  .max(30)
  .refine(
    (a) => new Set(a.map((i) => lineKey(i.id, i.config))).size === a.length,
    "Duplicate configurations",
  );
export const checkoutSchema = z.object({
  key: z.string().uuid(),
  items: cartSchema.refine((a) => a.length > 0, "Your bag is empty"),
  email: z.string().trim().email().max(254),
  name: z.string().trim().min(2).max(100),
  address: z.string().trim().min(4).max(200),
  city: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(2).max(20),
  country: z.string().trim().min(2).max(100),
});
export type CartItem = z.infer<typeof cartSchema>[number];
export function priceCart(items: CartItem[], catalog: Product[]) {
  const lines = items.map((item) => {
    const p = catalog.find((p) => p.id === item.id);
    if (!p)
      throw new Error(
        "A product is no longer available. Please refresh your bag.",
      );
    return {
      ...item,
      ...configuredProduct(p, item.config),
      line_key: lineKey(p.id, item.config),
      name: p.name,
      image: p.image,
    };
  });
  const subtotal = lines.reduce((n, l) => n + l.price * l.quantity, 0);
  return { lines, subtotal, shipping: 0, total: subtotal };
}
