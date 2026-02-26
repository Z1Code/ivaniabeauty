export default function ProductLoading() {
  return (
    <main className="min-h-screen bg-perla px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb skeleton */}
        <div className="mb-6 h-4 w-48 animate-pulse rounded bg-rosa-light/20" />

        <div className="grid gap-8 md:grid-cols-2">
          {/* Image placeholder */}
          <div className="aspect-square w-full animate-pulse rounded-xl bg-rosa-light/20" />

          {/* Details */}
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded-lg bg-rosa-light/30" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-rosa-light/20" />
            <div className="mt-4 space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-rosa-light/15" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-rosa-light/15" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-rosa-light/15" />
            </div>
            <div className="mt-6 flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-14 animate-pulse rounded-lg bg-rosa-light/20"
                />
              ))}
            </div>
            <div className="mt-6 h-12 w-full animate-pulse rounded-xl bg-rosa-light/30" />
          </div>
        </div>
      </div>
    </main>
  );
}
