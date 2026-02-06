"use client";

import { useMemo, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Reorder, useDragControls } from "framer-motion";
import { Upload, X, GripVertical, AlertCircle, Scissors } from "lucide-react";

interface AdminImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

const CROP_ASPECT_PRESETS: Array<{
  id: string;
  label: string;
  value?: number;
}> = [
  { id: "1:1", label: "1:1", value: 1 },
  { id: "3:4", label: "3:4", value: 3 / 4 },
  { id: "4:5", label: "4:5", value: 4 / 5 },
  { id: "16:9", label: "16:9", value: 16 / 9 },
  { id: "original", label: "Original" },
];

function DraggableImage({
  img,
  index,
  onRemove,
  onCrop,
}: {
  img: string;
  index: number;
  onRemove: () => void;
  onCrop: () => void;
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
        title="Eliminar imagen"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Crop button */}
      <button
        type="button"
        onClick={onCrop}
        className="absolute top-2 right-11 z-20 w-7 h-7 rounded-full bg-white/90 text-gray-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md border border-gray-200"
        title="Recortar imagen"
      >
        <Scissors className="w-3.5 h-3.5" />
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
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropAspectId, setCropAspectId] = useState("1:1");
  const [cropping, setCropping] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);

  const activeCropImage = cropIndex != null ? images[cropIndex] || null : null;
  const activeAspect = useMemo(
    () => CROP_ASPECT_PRESETS.find((item) => item.id === cropAspectId) || CROP_ASPECT_PRESETS[0],
    [cropAspectId]
  );

  function handleRemove(index: number) {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  }

  function openCropModal(index: number) {
    setCropIndex(index);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropAspectId("1:1");
    setCroppedAreaPixels(null);
    setCropError(null);
    setError(null);
  }

  function closeCropModal() {
    if (cropping) return;
    setCropIndex(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropError(null);
  }

  async function handleSaveCrop() {
    if (cropIndex == null || !activeCropImage || !croppedAreaPixels) {
      setCropError("No se pudo preparar el recorte.");
      return;
    }

    setCropping(true);
    setCropError(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/images/crop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: activeCropImage,
          crop: {
            x: croppedAreaPixels.x,
            y: croppedAreaPixels.y,
            width: croppedAreaPixels.width,
            height: croppedAreaPixels.height,
          },
          aspect: activeAspect.id,
          targetLongEdge: 1600,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        croppedImageUrl?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "No se pudo recortar la imagen.");
      }

      if (!data.croppedImageUrl) {
        throw new Error("No se recibio URL de imagen recortada.");
      }

      const updated = [...images];
      updated[cropIndex] = data.croppedImageUrl;
      onImagesChange(updated);
      closeCropModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al recortar imagen";
      setCropError(message);
    } finally {
      setCropping(false);
    }
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
            onCrop={() => openCropModal(i)}
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

      {cropIndex != null && activeCropImage && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Editor de recorte
              </h4>
              <button
                type="button"
                onClick={closeCropModal}
                disabled={cropping}
                className="w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
                <div className="relative h-[420px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                  <Cropper
                    image={activeCropImage}
                    crop={crop}
                    zoom={zoom}
                    aspect={activeAspect.value}
                    showGrid
                    objectFit="contain"
                    minZoom={1}
                    maxZoom={3}
                    zoomSpeed={0.1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                      Proporcion
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {CROP_ASPECT_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setCropAspectId(preset.id)}
                          className={`px-2.5 py-2 text-xs rounded-lg border transition-colors cursor-pointer ${
                            cropAspectId === preset.id
                              ? "border-rosa bg-rosa/10 text-rosa"
                              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                      Zoom
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.01}
                      value={zoom}
                      onChange={(e) => setZoom(Number.parseFloat(e.target.value))}
                      className="w-full accent-rosa cursor-pointer"
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      {zoom.toFixed(2)}x
                    </p>
                  </div>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Arrastra para posicionar la prenda/modelo dentro del recorte final.
                  </p>

                  {cropError && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {cropError}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCropModal}
                  disabled={cropping}
                  className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCrop}
                  disabled={cropping}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-rosa text-white hover:bg-rosa-dark transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {cropping ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Scissors className="w-3.5 h-3.5" />
                  )}
                  {cropping ? "Recortando..." : "Guardar recorte"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
