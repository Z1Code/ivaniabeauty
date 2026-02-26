"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-perla px-4 text-center">
      <h1 className="font-serif text-5xl font-bold text-rosa sm:text-6xl">
        Oops
      </h1>
      <p className="mt-4 font-serif text-xl font-semibold text-gray-900">
        Something went wrong
      </p>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-block rounded-full bg-rosa px-8 py-3 text-sm font-semibold text-white transition hover:bg-rosa-dark"
      >
        Try Again
      </button>
    </main>
  );
}
