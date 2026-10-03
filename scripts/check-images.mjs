import { access } from 'node:fs/promises';
import { products } from '../lib/catalog.ts';
for (const p of products) {
  await access(new URL('../public' + p.image, import.meta.url));
  console.log(p.id + ': image exists');
}
