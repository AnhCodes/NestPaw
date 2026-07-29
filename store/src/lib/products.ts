/** Launch catalog of calm and groom essentials for dogs at home. */
export type Category = "calm" | "groom";

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  compareAt?: number;
  /** Fallback only — live stock lives in the `inventory` table / admin UI. */
  stock: number;
  category: Category;
  image: string;
  gallery: string[];
  benefits: string[];
  includes: string[];
  shippingNote: string;
  featured?: boolean;
  badge?: string;
};

export const categories: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "calm", label: "Calm" },
  { id: "groom", label: "Groom" },
];

export const products: Product[] = [
  {
    id: "shed-brush",
    slug: "shedding-brush-kit",
    name: "Shedding Brush Kit",
    tagline: "Less fur on the couch. More calm in the routine.",
    description:
      "A dual-sided deshedding brush and glove kit designed for everyday coat care at home. Remove loose undercoat in minutes without turning grooming into a battle.",
    price: 24,
    stock: 0,
    category: "groom",
    image: "/products/nestpaw-shedding-brush-kit-fill.png",
    gallery: [
      "/products/nestpaw-shedding-brush-kit-fill.png",
      "/products/nestpaw-shedding-brush-gallery-v2.png",
      "/products/nestpaw-shedding-glove-gallery-v2.png",
    ],
    benefits: [
      "Cuts down loose fur before it hits furniture",
      "Gentle enough for weekly home use",
      "Demo-friendly — results you can see in one session",
    ],
    includes: [
      "Deshedding brush",
      "Grooming glove",
      "Dog calm tips card",
      "Single packaged dog treat",
    ],
    shippingNote: "Ships within 24 hours · typically arrives in 5–8 business days",
    featured: true,
    badge: "Best seller",
  },
  {
    id: "snuffle-mat",
    slug: "forage-snuffle-mat",
    name: "Forage Snuffle Mat",
    tagline: "Ten quiet minutes, earned through the nose.",
    description:
      "A washable foraging mat that turns mealtime treats into a calming scent game. Built for rainy evenings, restless energy, and dogs who need a job indoors.",
    price: 28,
    stock: 0,
    category: "calm",
    image: "/products/nestpaw-forage-snuffle-mat-hero.png",
    gallery: [
      "/products/nestpaw-forage-snuffle-mat-hero.png",
    ],
    benefits: [
      "Encourages slower, focused foraging",
      "Machine-washable fleece construction",
      "Ideal rainy-day enrichment without screens or chaos",
    ],
    includes: [
      "Snuffle mat",
      "Storage strap",
      "Dog calm tips card",
      "Single packaged dog treat",
    ],
    shippingNote: "Ships within 24 hours · typically arrives in 5–8 business days",
    featured: true,
  },
  {
    id: "puzzle-feeder",
    slug: "puzzle-slow-feeder",
    name: "Silicone Slow Feeder Mat",
    tagline: "Dinner that lasts longer than four seconds.",
    description:
      "A food-grade silicone feeding mat with a built-in slow bowl and lick zones. Slows inhale-speed eaters, contains spills, and turns mealtime into calm enrichment.",
    price: 34,
    stock: 0,
    category: "calm",
    image: "/products/nestpaw-slow-feeder-mat-fill.png",
    gallery: [
      "/products/nestpaw-slow-feeder-mat-fill.png",
    ],
    benefits: [
      "Star-ridge slow bowl slows rapid eating",
      "Integrated lick textures for wet food or spreadables",
      "Easy to rinse; pairs well with the Forage Snuffle Mat",
    ],
    includes: [
      "Silicone slow-feeder mat",
      "Dog calm tips card",
      "Single packaged dog treat",
    ],
    shippingNote: "Ships within 24 hours · typically arrives in 5–8 business days",
    featured: true,
  },
  {
    id: "nail-trimmer",
    slug: "quiet-nail-grinder",
    name: "Quiet Nail Grinder",
    tagline: "Easier nail care without the clipper panic.",
    description:
      "A compact electric nail grinder for at-home touch-ups. Soft approach for dogs who tense up at the sight of traditional clippers.",
    price: 25,
    stock: 0,
    category: "groom",
    image: "/products/nestpaw-quiet-nail-grinder-fill.png",
    gallery: [
      "/products/nestpaw-quiet-nail-grinder-fill.png",
    ],
    benefits: [
      "Gradual grinding instead of abrupt clipping",
      "USB-friendly for small-space living",
      "Includes safety-first pacing tips",
    ],
    includes: [
      "Nail grinder",
      "USB charging cable",
      "Dog calm tips card",
      "Single packaged dog treat",
    ],
    shippingNote: "Ships within 24 hours · typically arrives in 5–8 business days",
    featured: true,
  },
  {
    id: "lick-mat",
    slug: "suction-lick-mat",
    name: "Suction Lick Mat",
    tagline: "A simple wind-down ritual for slower, quieter evenings.",
    description:
      "A food-grade silicone lick mat with suction backing for spreadable treats, bath-time distractions, and calmer at-home routines. Easy to rinse, easy to repeat.",
    price: 14,
    stock: 0,
    category: "calm",
    image: "/products/nestpaw-lick-mat-fill.png",
    gallery: ["/products/nestpaw-lick-mat-fill.png"],
    benefits: [
      "Turns spreadable treats into a longer-lasting calm activity",
      "Suction backing helps keep the mat in place on smooth surfaces",
      "Useful for grooming, bath time, or crate wind-downs",
    ],
    includes: [
      "Suction lick mat",
      "Dog calm tips card",
      "Single packaged dog treat",
    ],
    shippingNote: "Ships within 24 hours · typically arrives in 5–8 business days",
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: Category | "all") {
  if (category === "all") return products;
  return products.filter((p) => p.category === category);
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function isInStock(product: Product) {
  return product.stock > 0;
}

export function formatStock(product: Product) {
  if (product.stock <= 0) return "0 in stock";
  if (product.stock === 1) return "1 in stock";
  return `${product.stock} in stock`;
}

export const FREE_SHIPPING_THRESHOLD = 40;
export const FLAT_SHIPPING = 4.95;
