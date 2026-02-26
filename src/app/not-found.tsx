import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-perla px-4 text-center">
      <h1 className="font-serif text-6xl font-bold text-rosa sm:text-8xl">
        404
      </h1>
      <p className="mt-4 font-serif text-xl font-semibold text-gray-900 sm:text-2xl">
        Page not found
      </p>
      <p className="mt-2 text-sm text-gray-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/shop"
        className="mt-8 inline-block rounded-full bg-rosa px-8 py-3 text-sm font-semibold text-white transition hover:bg-rosa-dark"
      >
        Browse Shop
      </Link>
    </main>
  );
}
