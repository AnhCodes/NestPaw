import Link from "next/link";

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
    <span
      className={`inline-flex items-center font-display font-semibold leading-none ${className}`}
    >
      {withWordmark ? (
        <span className={wordmarkClassName || "text-[1.55rem] md:text-[1.75rem]"}>
          NestPaw
        </span>
      ) : (
        <span className={markClassName || "text-[1.55rem] md:text-[1.75rem]"}>
          N
        </span>
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
