import Link from "next/link";
import { NestPawLogo } from "@/components/nestpaw-logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-ink text-mist">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[1.3fr_1fr_1fr] md:px-8">
        <div>
          <NestPawLogo
            className="text-mist"
            wordmarkClassName="text-4xl md:text-4xl"
            markClassName="h-10 w-10 md:h-11 md:w-11"
          />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-mist/65">
            Products that help your dog feel calm and comfortable — and make
            home life easier for you.
          </p>
        </div>
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-mist/40">
            Explore
          </p>
          <div className="mt-5 flex flex-col gap-3 text-sm text-mist/80">
            <Link href="/shop" className="transition hover:text-mist">
              Shop
            </Link>
            <Link href="/about" className="transition hover:text-mist">
              Our story
            </Link>
            <Link href="/shipping" className="transition hover:text-mist">
              Shipping & returns
            </Link>
            <Link href="/contact" className="transition hover:text-mist">
              Contact
            </Link>
          </div>
        </div>
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-mist/40">
            Policies
          </p>
          <div className="mt-5 flex flex-col gap-3 text-sm text-mist/80">
            <Link href="/privacy" className="transition hover:text-mist">
              Privacy
            </Link>
            <Link href="/shipping" className="transition hover:text-mist">
              30-day returns
            </Link>
            <p className="pt-4 text-mist/45">Free shipping on orders over $30</p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-5 text-[0.7rem] uppercase tracking-[0.14em] text-mist/35 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} NestPaw</span>
          <span>Built for calmer homes</span>
        </div>
      </div>
    </footer>
  );
}
