export type Option = {
  id: string;
  label: string;
  detail: string;
  delta: number;
};
export type Configuration = { cpu: string; memory: string; storage: string };
export type Product = {
  id: string;
  name: string;
  series: string;
  category: string;
  price: number;
  image: string;
  tag: string;
  tagline: string;
  description: string;
  display: string;
  weight: string;
  battery: string;
  graphics: string;
  finish: string;
  accent: string;
  options: { cpu: Option[]; memory: Option[]; storage: Option[] };
};
const memory = (sizes: number[]): Option[] =>
  sizes.map((n, i) => ({
    id: `ram-${n}`,
    label: `${n} GB`,
    detail: "LPDDR5X memory",
    delta: i * 16000,
  }));
const storage = (sizes: number[]): Option[] =>
  sizes.map((n, i) => ({
    id: `ssd-${n}`,
    label: n < 1000 ? `${n} GB` : `${n / 1000} TB`,
    detail: "NVMe SSD storage",
    delta: i * 18000,
  }));
const cpu = (pro = false): Option[] =>
  pro
    ? [
        {
          id: "ultra7",
          label: "Intel Core Ultra 7",
          detail: "For demanding creative work",
          delta: 0,
        },
        {
          id: "ultra9",
          label: "Intel Core Ultra 9",
          detail: "Our highest performance option",
          delta: 30000,
        },
      ]
    : [
        {
          id: "ultra5",
          label: "Intel Core Ultra 5",
          detail: "Everyday speed, effortless multitasking",
          delta: 0,
        },
        {
          id: "ultra7",
          label: "Intel Core Ultra 7",
          detail: "More headroom for bigger ideas",
          delta: 22000,
        },
      ];
export const products: Product[] = [
  {
    id: "nova-air-14",
    name: "NOVA Air 14",
    series: "Air",
    category: "Everyday",
    price: 99900,
    image: "/images/nova-air.webp",
    tag: "EVERYDAY, UPGRADED",
    tagline: "Light on weight. Big on possibility.",
    description:
      "Your everywhere laptop. A beautifully slim aluminium body, a vivid edge-to-edge display, and enough headroom to turn your daily to-do list into done.",
    display: "14″ 2.8K IPS",
    weight: "1.2 kg",
    battery: "Up to 16 hours",
    graphics: "Intel integrated graphics",
    finish: "Glacier silver",
    accent: "#aac4d5",
    options: {
      cpu: cpu(),
      memory: memory([16, 32]),
      storage: storage([512, 1000, 2000]),
    },
  },
  {
    id: "nova-air-16",
    name: "NOVA Air 16",
    series: "Air",
    category: "Everyday",
    price: 129900,
    image: "/images/nova-air.webp",
    tag: "MORE ROOM TO THINK",
    tagline: "A bigger canvas. The same freedom.",
    description:
      "Spread out your work, your ideas, and everything in between. A spacious display meets the easy portability of the Air family.",
    display: "16″ 2.8K IPS",
    weight: "1.5 kg",
    battery: "Up to 15 hours",
    graphics: "Intel integrated graphics",
    finish: "Glacier silver",
    accent: "#aac4d5",
    options: {
      cpu: cpu(),
      memory: memory([16, 32]),
      storage: storage([512, 1000, 2000]),
    },
  },
  {
    id: "nova-studio-16",
    name: "NOVA Studio 16",
    series: "Studio",
    category: "Creative",
    price: 189900,
    image: "/images/nova-studio.webp",
    tag: "THE CREATOR’S CHOICE",
    tagline: "For ideas that refuse to sit still.",
    description:
      "A portable creative studio, built around you. Rich OLED colour, dedicated graphics, and serious processing power for your next edit, build, or breakthrough.",
    display: "16″ 3.2K OLED",
    weight: "1.8 kg",
    battery: "Up to 12 hours",
    graphics: "NVIDIA RTX 4060 · 8 GB",
    finish: "Midnight graphite",
    accent: "#f46f37",
    options: {
      cpu: cpu(true),
      memory: memory([32, 64]),
      storage: storage([1000, 2000, 4000]),
    },
  },
  {
    id: "nova-arc-16",
    name: "NOVA Arc 16",
    series: "Arc",
    category: "Gaming",
    price: 219900,
    image: "/images/nova-arc.webp",
    tag: "PLAY AT ANOTHER LEVEL",
    tagline: "No compromises. Just next level.",
    description:
      "From the first frame to the final round. A fluid high-refresh display, dedicated graphics, and a refined cooling design, in a chassis that looks as good off-duty.",
    display: "16″ QHD · 240 Hz",
    weight: "2.2 kg",
    battery: "Up to 8 hours",
    graphics: "NVIDIA RTX 4070 · 8 GB",
    finish: "Graphite black",
    accent: "#a48af0",
    options: {
      cpu: cpu(true),
      memory: memory([32, 64]),
      storage: storage([1000, 2000, 4000]),
    },
  },
];
export const defaultConfig = (p: Product): Configuration => ({
  cpu: p.options.cpu[0].id,
  memory: p.options.memory[0].id,
  storage: p.options.storage[0].id,
});
export function configuredProduct(p: Product, c: Configuration) {
  const selected = (["cpu", "memory", "storage"] as const).map((k) => {
    const option = p.options[k].find((o) => o.id === c[k]);
    if (!option)
      throw new Error(
        "This product configuration is unavailable. Please choose your specifications again.",
      );
    return option;
  });
  return {
    price: p.price + selected.reduce((n, o) => n + o.delta, 0),
    specs: selected.map((o) => o.label).join(" / "),
    configuration: {
      cpu: selected[0].label,
      memory: selected[1].label,
      storage: selected[2].label,
      finish: p.finish,
    },
  };
}
export const lineKey = (id: string, c: Configuration) =>
  `${id}:${c.cpu}:${c.memory}:${c.storage}`;
export const money = (c: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(c / 100);
