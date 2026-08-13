function Bone({
  className = "",
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={`skeleton ${tone === "dark" ? "skeleton-dark" : ""} ${className}`}
      aria-hidden
    />
  );
}

function Status({ label }: { label: string }) {
  return (
    <span className="sr-only" role="status">
      {label}
    </span>
  );
}

export function HomePageLoading() {
  return (
    <section
      className="relative min-h-[100svh] overflow-hidden bg-ink"
      aria-busy="true"
    >
      <Status label="Loading NestPaw" />
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-5 pb-14 pt-28 md:px-8 md:pb-20">
        <Bone tone="dark" className="h-[clamp(3.5rem,12vw,8.5rem)] w-[min(100%,22rem)] rounded-2xl" />
        <Bone tone="dark" className="mt-8 h-10 w-[min(100%,20rem)] md:h-12" />
        <Bone tone="dark" className="mt-4 h-16 w-[min(100%,24rem)]" />
      </div>
    </section>
  );
}

export function ShopPageLoading() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-28 md:px-8 md:pb-28 md:pt-32" aria-busy="true">
      <Status label="Loading the collection" />
      <div className="max-w-2xl border-b border-line pb-10">
        <Bone className="h-3 w-16" />
        <Bone className="mt-4 h-12 w-64 md:h-16 md:w-80" />
        <Bone className="mt-4 h-12 w-full max-w-md" />
      </div>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <Bone key={i} className="aspect-[2/3] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function ProductPageLoading() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-20 pt-28 md:px-8 md:pb-28 md:pt-32" aria-busy="true">
      <Status label="Loading product" />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <Bone className="aspect-[2/3] rounded-2xl" />
        <div>
          <Bone className="h-3 w-24" />
          <Bone className="mt-4 h-12 w-3/4 md:h-14" />
          <Bone className="mt-4 h-6 w-2/3" />
          <Bone className="mt-6 h-8 w-20" />
          <Bone className="mt-6 h-24 w-full" />
          <div className="mt-8 flex gap-3">
            <Bone className="h-12 w-40 rounded-[0.9rem]" />
            <Bone className="h-12 w-32 rounded-[0.9rem]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ArticlePageLoading() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-28 md:px-8 md:pb-28 md:pt-32" aria-busy="true">
      <Status label="Loading page" />
      <Bone className="h-3 w-20" />
      <Bone className="mt-4 h-12 w-4/5 md:h-16" />
      <div className="mt-8 space-y-4">
        <Bone className="h-5 w-full" />
        <Bone className="h-5 w-[92%]" />
        <Bone className="h-5 w-full" />
        <Bone className="h-5 w-3/4" />
        <Bone className="mt-6 h-5 w-full" />
        <Bone className="h-5 w-[88%]" />
        <Bone className="h-5 w-2/3" />
      </div>
    </div>
  );
}

export function CartPageLoading() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-28 md:px-8 md:pb-28 md:pt-32" aria-busy="true">
      <Status label="Loading cart" />
      <Bone className="h-12 w-48 md:h-16 md:w-64" />
      <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="grid grid-cols-[96px_1fr] gap-4 sm:grid-cols-[120px_1fr]">
              <Bone className="aspect-square rounded-xl" />
              <div>
                <Bone className="h-6 w-2/3" />
                <Bone className="mt-3 h-5 w-24" />
              </div>
            </div>
          ))}
        </div>
        <Bone className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

export function CheckoutPageLoading() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-28 md:px-8 md:pb-28 md:pt-32" aria-busy="true">
      <Status label="Loading checkout" />
      <Bone className="h-12 w-56 md:h-16 md:w-72" />
      <div className="mt-12 grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <Bone className="h-14 w-56 rounded-[0.9rem]" />
        <Bone className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
