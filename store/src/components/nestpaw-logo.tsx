import Link from "next/link";

/** Paw inside a nest */
function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="currentColor"
      className={`h-8 w-8 shrink-0 md:h-9 md:w-9 ${className}`}
      aria-hidden
    >
      {/* Nest bowl (ring) */}
      <path
        fillRule="evenodd"
        d="M32 6c14.4 0 26 11.2 26 28 0 13.2-9.2 24-26 24S6 47.2 6 34C6 17.2 17.6 6 32 6Zm0 8C21.5 14 14 22.2 14 34c0 9.4 6.2 16 18 16s18-6.6 18-16C50 22.2 42.5 14 32 14Z"
      />
      {/* Paw main pad — sits in the nest */}
      <ellipse cx="32" cy="38" rx="8" ry="7" />
      {/* Toes */}
      <circle cx="20.5" cy="28" r="4" />
      <circle cx="27.5" cy="24.5" r="4.2" />
      <circle cx="36.5" cy="24.5" r="4.2" />
      <circle cx="43.5" cy="28" r="4" />
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
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark className={markClassName} />
      {withWordmark ? (
        <span
          className={`font-display text-[1.55rem] font-bold tracking-[-0.05em] md:text-[1.75rem] ${wordmarkClassName}`}
        >
          NestPaw
        </span>
      ) : null}
    </span>
  );

  if (href === null) return content;

  return (
    <Link href={href} className="inline-flex items-center" aria-label="NestPaw home">
      {content}
    </Link>
  );
}
