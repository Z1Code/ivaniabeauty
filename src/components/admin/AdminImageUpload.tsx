"use client";

import { useState, useRef } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { Upload, X, GripVertical, AlertCircle } from "lucide-react";

interface AdminImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

function DraggableImage({
  img,
  index,
  onRemove,
}: {
  img: string;
  index: number;
  onRemove: () => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={img}
      dragListener={false}
      dragControls={controls}
      className="relative aspect-square rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden group bg-gradient-to-br from-rosa-light/20 to-arena dark:from-gray-800 dark:to-gray-900 select-none"
      whileDrag={{
        scale: 1.05,
        boxShadow: "0 8px 30px rgba(255,107,157,0.25)",
        zIndex: 50,
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Drag handle */}
      <div
        onPointerDown={(e) => controls.start(e)}
        className="absolute top-2 left-2 z-20 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center cursor-grab active:cursor-grabbing shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-4 h-4 text-gray-500" />
      </div>

      {/* Image */}
      {img && (
        <img
          src={img}
          alt={`Producto ${index + 1}`}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}

      {/* Fallback icon when no image loads */}
      <div className="absolute inset-0 flex items-center justify-center text-rosa/30 -z-0">
        <GripVertical className="w-6 h-6" />
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Position number */}
      <span className="absolute bottom-2 left-2 text-xs font-bold bg-black/50 text-white px-2 py-0.5 rounded-full">
        {index + 1}
      </span>
    </Reorder.Item>
  );
}

export default function AdminImageUpload({
  images,
  onImagesChange,
  maxImages = 6,
}: AdminImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);

    try {
      const formData = new FormData();
      let count = 0;

      for (let i = 0; i < files.length && images.length + count < maxImages; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) continue;
        formData.append("files", file);
        count++;
      }

      if (count === 0) {
        setError("No se seleccionaron archivos válidos");
        setUploading(false);
        return;
      }

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al subir imágenes");
      }

      const { urls } = await res.json();
      onImagesChange([...images, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir imágenes");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Imagenes del producto
      </label>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
        Arrastra para reordenar. La primera imagen será la portada.
      </p>

      {error && (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mb-3 p-2 bg-red-50 dark:bg-red-950 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Reorderable Image Grid */}
      <Reorder.Group
        axis="x"
        values={images}
        onReorder={onImagesChange}
        className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3"
      >
        {images.map((img, i) => (
          <DraggableImage
            key={img}
            img={img}
            index={i}
            onRemove={() => handleRemove(i)}
          />
        ))}

        {/* Add Image Button (outside Reorder items) */}
      </Reorder.Group>

      {images.length < maxImages && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500 hover:text-rosa hover:border-rosa transition-colors cursor-pointer disabled:opacity-50 mb-3"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-rosa border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">
            {uploading ? "Subiendo..." : "Agregar imagenes"}
          </span>
        </button>
      )}

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

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Max {maxImages} imagenes. JPEG, PNG o WebP. Max 5MB cada una.
      </p>
    </div>
  );
}
