import Link from "next/link";

/** Higgsfield option 2 wordmark — paw knocked out of the P, nest replacing the a. */
const WORDMARK_SRC = "/marketing/nestpaw-wordmark.png";
const WORDMARK_ASPECT = "1600 / 316";

/** Capital P with a four-toe paw cut out of the bowl. Used as the compact mark. */
function PawLetterP({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 56 80"
      fill="currentColor"
      className={`shrink-0 overflow-visible ${className}`}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M8 6h23c13.8 0 24 10.4 24 24.5S44.8 55 31 55H20v19H8V6ZM30.8 35.8a5.8 4.6 0 1 0 11.6 0 5.8 4.6 0 1 0-11.6 0ZM27 26.4a2.55 2.55 0 1 0 5.1 0 2.55 2.55 0 1 0-5.1 0ZM32.2 23.8a2.7 2.7 0 1 0 5.4 0 2.7 2.7 0 1 0-5.4 0ZM38 23.8a2.7 2.7 0 1 0 5.4 0 2.7 2.7 0 1 0-5.4 0ZM43.4 26.6a2.55 2.55 0 1 0 5.1 0 2.55 2.55 0 1 0-5.1 0Z"
      />
    </svg>
  );
}

type NestPawLogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  withWordmark?: boolean;
  href?: string | null;
};

export function NestPawLogo({
  className = "",
  markClassName = "",
  wordmarkClassName = "",
  withWordmark = true,
  href = "/",
}: NestPawLogoProps) {
  const content = (
    <span className={`inline-flex items-center ${className}`}>
      {withWordmark ? (
        <span
          className={`inline-block h-[1em] leading-none bg-current ${wordmarkClassName || "text-[1.55rem] md:text-[1.75rem]"}`}
          style={{
            aspectRatio: WORDMARK_ASPECT,
            WebkitMaskImage: `url(${WORDMARK_SRC})`,
            maskImage: `url(${WORDMARK_SRC})`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
          }}
          aria-hidden
        />
      ) : (
        <PawLetterP className={`h-8 w-6 md:h-9 md:w-7 ${markClassName}`} />
      )}
    </span>
  );

  if (href === null) return content;

  return (
    <Link href={href} className="inline-flex items-center" aria-label="NestPaw home">
      {content}
    </Link>
  );
}
