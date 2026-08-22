import Image from "next/image";
import Link from "next/link";

const WORDMARKS = {
  teal: {
    src: "/marketing/nestpaw-wordmark-teal.png",
    width: 2000,
    height: 390,
  },
  cream: {
    src: "/marketing/nestpaw-wordmark-cream.png",
    width: 2000,
    height: 390,
  },
  white: {
    src: "/marketing/nestpaw-wordmark-white.png",
    width: 2000,
    height: 390,
  },
} as const;

type NestPawLogoProps = {
  className?: string;
  variant?: keyof typeof WORDMARKS;
  href?: string | null;
  priority?: boolean;
  sizes?: string;
};

export function NestPawLogo({
  className = "h-[1.55rem] w-auto md:h-[1.75rem]",
  variant = "teal",
  href = "/",
  priority = false,
  sizes = "(max-width: 768px) 180px, 220px",
}: NestPawLogoProps) {
  const wordmark = WORDMARKS[variant];
  const content = (
    <Image
      src={wordmark.src}
      alt={href ? "" : "NestPaw"}
      width={wordmark.width}
      height={wordmark.height}
      priority={priority}
      sizes={sizes}
      className={className}
    />
  );

  if (href === null) return content;

  return (
    <Link href={href} className="inline-flex items-center" aria-label="NestPaw home">
      {content}
    </Link>
  );
}
