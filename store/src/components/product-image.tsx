import Image from "next/image";

type ProductImageProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
};

export function ProductImage({
  src,
  alt,
  sizes,
  className = "",
  priority = false,
}: ProductImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      quality={90}
      sizes={sizes}
      priority={priority}
      className={`object-cover object-center ${className}`}
    />
  );
}
