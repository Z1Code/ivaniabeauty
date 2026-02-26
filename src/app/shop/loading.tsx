export default function ShopLoading() {
  return (
    <main className="min-h-screen bg-perla px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      {/* Title skeleton */}
      <div className="mx-auto mb-8 max-w-7xl">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-rosa-light/30" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-rosa-light/20" />
      </div>

      {/* Product grid skeleton */}
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl bg-white shadow-sm"
          >
            <div className="aspect-[3/4] w-full animate-pulse bg-rosa-light/20" />
            <div className="p-3 sm:p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-rosa-light/20" />
              <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-rosa-light/20" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
