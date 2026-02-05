"use client";

import { create } from "zustand";

interface FilterState {
  category: string | null;
  size: string | null;
  compression: string | null;
  color: string | null;
  occasion: string | null;
  sortBy: string;
  setCategory: (category: string | null) => void;
  setSize: (size: string | null) => void;
  setCompression: (compression: string | null) => void;
  setColor: (color: string | null) => void;
  setOccasion: (occasion: string | null) => void;
  setSortBy: (sort: string) => void;
  clearFilters: () => void;
}

const useFilters = create<FilterState>((set) => ({
  category: null,
  size: null,
  compression: null,
  color: null,
  occasion: null,
  sortBy: "featured",

  setCategory: (category) => set({ category }),
  setSize: (size) => set({ size }),
  setCompression: (compression) => set({ compression }),
  setColor: (color) => set({ color }),
  setOccasion: (occasion) => set({ occasion }),
  setSortBy: (sortBy) => set({ sortBy }),
  clearFilters: () =>
    set({
      category: null,
      size: null,
      compression: null,
      color: null,
      occasion: null,
      sortBy: "featured",
    }),
}));

export default useFilters;
