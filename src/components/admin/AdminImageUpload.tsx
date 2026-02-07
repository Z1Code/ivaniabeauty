"use client";

import { useRef, useState } from "react";
import { AlertCircle, Crop, GripVertical, Loader2, Sparkles, Upload, X } from "lucide-react";

interface AdminImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  onCropImage?: (imageUrl: string) => void;
  onEnhanceImage?: (imageUrl: string) => void;
  enhancingImageUrls?: string[];
  maxImages?: number;
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to) return items;
  if (from < 0 || from >= items.length) return items;
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export default function AdminImageUpload({
  images,
  onImagesChange,
  onCropImage,
  onEnhanceImage,
  enhancingImageUrls = [],
  maxImages = 6,
}: AdminImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function clearDragState() {
    setDraggingIndex(null);
    setDragOverIndex(null);
  }

  function handleRemove(index: number) {
    const updated = images.filter((_, imageIndex) => imageIndex !== index);
    onImagesChange(updated);
  }

  function handleAddUrl() {
    const url = prompt("URL de la imagen:");
    if (url && url.trim()) {
      onImagesChange([...images, url.trim()]);
    }
  }

  function handleDragStart(index: number, event: React.DragEvent<HTMLElement>) {
    setDraggingIndex(index);
    setDragOverIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }

  function handleDragOver(index: number, event: React.DragEvent<HTMLElement>) {
    if (draggingIndex === null) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  }

  function handleDrop(index: number, event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    const fromRaw = event.dataTransfer.getData("text/plain");
    const parsed = Number.parseInt(fromRaw, 10);
    const fromIndex =
      Number.isFinite(parsed) && parsed >= 0 ? parsed : draggingIndex ?? -1;
    if (fromIndex < 0 || fromIndex === index) {
      clearDragState();
      return;
    }
    onImagesChange(moveItem(images, fromIndex, index));
    clearDragState();
  }

  function handleDragEnd() {
    clearDragState();
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      let count = 0;

      for (let i = 0; i < files.length && images.length + count < maxImages; i += 1) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) continue;
        formData.append("files", file);
        count += 1;
      }

      if (count === 0) {
        setError("No se seleccionaron archivos validos");
        setUploading(false);
        return;
      }

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Error al subir imagenes");
      }

      const { urls } = await response.json();
      onImagesChange([...images, ...urls]);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Error al subir imagenes"
      );
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
        Arrastra usando el icono de agarre para reordenar. La primera imagen sera la
        portada.
      </p>

      {error && (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mb-3 p-2 bg-red-50 dark:bg-red-950 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        {images.map((imageUrl, index) => {
          const isDragging = draggingIndex === index;
          const isDropTarget = dragOverIndex === index && draggingIndex !== null;
          return (
            <div
              key={`image-card-${index}-${imageUrl.slice(0, 48)}`}
              onDragOver={(event) => handleDragOver(index, event)}
              onDrop={(event) => handleDrop(index, event)}
              className={`relative aspect-square rounded-xl border-2 overflow-hidden group bg-gradient-to-br from-rosa-light/20 to-arena dark:from-gray-800 dark:to-gray-900 select-none transition-all ${
                isDropTarget
                  ? "border-rosa shadow-lg shadow-rosa/20"
                  : "border-gray-200 dark:border-gray-700"
              } ${isDragging ? "scale-[1.02] opacity-95" : ""}`}
            >
              <button
                type="button"
                draggable
                onDragStart={(event) => handleDragStart(index, event)}
                onDragEnd={handleDragEnd}
                onClick={(event) => event.preventDefault()}
                className="absolute top-2 left-2 z-20 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center cursor-grab active:cursor-grabbing shadow-md border border-white/70 hover:bg-white transition-colors"
                title="Arrastrar para reordenar"
              >
                <GripVertical className="w-4 h-4 text-gray-500" />
              </button>

              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={`Producto ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              )}

              <div className="absolute inset-0 flex items-center justify-center text-rosa/30 -z-0">
                <GripVertical className="w-6 h-6" />
              </div>

              <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
                {onEnhanceImage && (
                  <button
                    type="button"
                    onClick={() => onEnhanceImage(imageUrl)}
                    disabled={enhancingImageUrls.includes(imageUrl)}
                    draggable={false}
                    className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-indigo-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    title="Regenerar HD 4K"
                  >
                    {enhancingImageUrls.includes(imageUrl) ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
                {onCropImage && (
                  <button
                    type="button"
                    onClick={() => onCropImage(imageUrl)}
                    draggable={false}
                    className="w-7 h-7 rounded-full bg-rosa text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-rosa-dark transition-colors"
                    title="Recortar imagen"
                  >
                    <Crop className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  draggable={false}
                  className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-red-600 transition-colors"
                  title="Eliminar imagen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <span className="absolute bottom-2 left-2 text-xs font-bold bg-black/50 text-white px-2 py-0.5 rounded-full">
                {index + 1}
              </span>
            </div>
          );
        })}
      </div>

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
