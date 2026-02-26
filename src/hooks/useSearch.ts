"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import useLanguageStore from "@/stores/languageStore";

export interface SearchProduct {
  id: string;
  slug: string;
  nameEn: string;
  nameEs: string;
  descriptionEn: string;
  descriptionEs: string;
  shortDescriptionEn: string;
  shortDescriptionEs: string;
  category: string;
  price: number;
  originalPrice: number | null;
  images: string[];
  inStock: boolean;
  badgeEn: string | null;
  badgeEs: string | null;
}

export interface SearchResult extends SearchProduct {
  score: number;
}

const RECENT_SEARCHES_KEY = "ivania-recent-searches";
const MAX_RECENT = 5;

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(searches: string[]) {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch {
    /* quota exceeded — ignore */
  }
}

function fuzzyMatch(text: string, query: string): { match: boolean; score: number } {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Exact match
  if (lowerText === lowerQuery) return { match: true, score: 100 };

  // Contains full query
  if (lowerText.includes(lowerQuery)) {
    // Starts with query gets higher score
    if (lowerText.startsWith(lowerQuery)) return { match: true, score: 90 };
    return { match: true, score: 75 };
  }

  // Word-level matching: check if query words appear in text
  const queryWords = lowerQuery.split(/\s+/).filter(Boolean);
  const matchedWords = queryWords.filter((w) => lowerText.includes(w));
  if (matchedWords.length > 0) {
    const ratio = matchedWords.length / queryWords.length;
    return { match: ratio >= 0.5, score: Math.round(60 * ratio) };
  }

  return { match: false, score: 0 };
}

function scoreProduct(product: SearchProduct, q: string): number {
  let best = 0;

  // Name fields — highest weight
  const nameEnMatch = fuzzyMatch(product.nameEn, q);
  const nameEsMatch = fuzzyMatch(product.nameEs, q);
  best = Math.max(best, nameEnMatch.score, nameEsMatch.score);

  // Short description — medium weight
  const shortDescEn = fuzzyMatch(product.shortDescriptionEn, q);
  const shortDescEs = fuzzyMatch(product.shortDescriptionEs, q);
  best = Math.max(best, shortDescEn.score * 0.6, shortDescEs.score * 0.6);

  // Description — lower weight
  const descEn = fuzzyMatch(product.descriptionEn, q);
  const descEs = fuzzyMatch(product.descriptionEs, q);
  best = Math.max(best, descEn.score * 0.4, descEs.score * 0.4);

  // Category — lower weight
  const catMatch = fuzzyMatch(product.category, q);
  best = Math.max(best, catMatch.score * 0.3);

  return best;
}

export function useSearch() {
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [queryText, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const language = useLanguageStore((s) => s.language);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchedRef = useRef(false);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  // Fetch all products once and cache in state
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchProducts() {
      try {
        const snap = await getDocs(
          query(collection(db, "products"), where("isActive", "==", true))
        );
        const items: SearchProduct[] = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            slug: d.slug || "",
            nameEn: d.nameEn || "",
            nameEs: d.nameEs || "",
            descriptionEn: d.descriptionEn || "",
            descriptionEs: d.descriptionEs || "",
            shortDescriptionEn: d.shortDescriptionEn || "",
            shortDescriptionEs: d.shortDescriptionEs || "",
            category: d.category || "",
            price: Number(d.price) || 0,
            originalPrice: d.originalPrice ? Number(d.originalPrice) : null,
            images: Array.isArray(d.images) ? d.images : [],
            inStock: d.inStock !== false,
            badgeEn: d.badgeEn || null,
            badgeEs: d.badgeEs || null,
          };
        });
        setProducts(items);
      } catch (err) {
        console.warn("useSearch: failed to fetch products", err);
      }
    }

    fetchProducts();
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!queryText.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(() => {
      const q = queryText.trim();
      let scored = products
        .map((p) => ({ ...p, score: scoreProduct(p, q) }))
        .filter((p) => p.score > 0)
        .sort((a, b) => b.score - a.score);

      if (categoryFilter) {
        scored = scored.filter((p) => p.category === categoryFilter);
      }

      setResults(scored.slice(0, 20));
      setIsLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [queryText, products, categoryFilter]);

  const addRecent = useCallback((term: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== term);
      const updated = [term, ...filtered].slice(0, MAX_RECENT);
      saveRecentSearches(updated);
      return updated;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    saveRecentSearches([]);
  }, []);

  // Extract unique categories from products
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  return {
    results,
    isLoading,
    query: queryText,
    setQuery,
    recentSearches,
    addRecent,
    clearRecent,
    categories,
    categoryFilter,
    setCategoryFilter,
    language,
  };
}
