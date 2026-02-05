"use client";

import { useState, useRef } from "react";
import { Upload, X, GripVertical } from "lucide-react";
import Image from "next/image";

interface AdminImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export default function AdminImageUpload({
  images,
  onImagesChange,
  maxImages = 6,
}: AdminImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleRemove(index: number) {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  }

  function handleAddUrl() {
    const url = prompt("URL de la imagen:");
    if (url && url.trim()) {
      onImagesChange([...images, url.trim()]);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    // For now, create object URLs as placeholders
    // In production, this would upload to Firebase Storage
    const newUrls: string[] = [];
    for (let i = 0; i < files.length && images.length + newUrls.length < maxImages; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 5 * 1024 * 1024) continue; // 5MB max

      // TODO: Upload to Firebase Storage
      // For now, use a placeholder path
      const placeholder = `/images/products/upload-${Date.now()}-${i}.jpg`;
      newUrls.push(placeholder);
    }

    onImagesChange([...images, ...newUrls]);
    setUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Imagenes del producto
      </label>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        {images.map((img, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-xl border-2 border-gray-200 overflow-hidden group bg-gradient-to-br from-rosa-light/20 to-arena"
          >
            <div className="absolute inset-0 flex items-center justify-center text-rosa/30">
              <GripVertical className="w-6 h-6" />
            </div>
            {img.startsWith("http") && (
              <Image
                src={img}
                alt={`Producto ${i + 1}`}
                fill
                className="object-cover"
              />
            )}
            <button
              onClick={() => handleRemove(i)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="absolute bottom-2 left-2 text-xs font-bold bg-black/50 text-white px-2 py-0.5 rounded-full">
              {i + 1}
            </span>
          </div>
        ))}

        {/* Add Image Button */}
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-rosa hover:border-rosa transition-colors cursor-pointer"
          >
            <Upload className="w-6 h-6" />
            <span className="text-xs font-medium">
              {uploading ? "Subiendo..." : "Agregar"}
            </span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Add by URL */}
      <button
        type="button"
        onClick={handleAddUrl}
        className="text-sm text-rosa hover:text-rosa-dark transition-colors cursor-pointer"
      >
        + Agregar por URL
      </button>

      <p className="text-xs text-gray-400 mt-1">
        Max {maxImages} imagenes. JPEG, PNG o WebP. Max 5MB cada una.
      </p>
    </div>
  );
}
