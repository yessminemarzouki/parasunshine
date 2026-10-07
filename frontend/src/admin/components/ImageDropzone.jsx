import { useState, useRef } from "react";
import { Upload, X, Image } from "lucide-react";

export default function ImageDropzone({
  preview,
  onFileSelect,
  onClear,
  existingImage,
  height = "h-52",
}) {
  const [dragging, setDragging] = useState(false);
  const [clearing, setClearing] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4 Mo

  const [sizeError, setSizeError] = useState(false);

  const acceptFile = (file) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > MAX_SIZE_BYTES) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 3000);
      return;
    }
    setSizeError(false);
    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) acceptFile(file);
  };

  return (
    <div>
      {preview ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-xl overflow-hidden border ${height} ${
            dragging
              ? "border-[#1a4731] ring-2 ring-[#1a4731]/30"
              : "border-gray-200"
          }`}
        >
          <img
            src={preview}
            alt="Aperçu"
            className="w-full h-full object-contain bg-gray-50 p-2"
          />
          {dragging && (
            <div className="absolute inset-0 bg-[#1a4731]/80 flex items-center justify-center">
              <p className="text-white text-[13px] font-semibold flex items-center gap-2">
                <Upload size={16} /> Relâchez pour remplacer
              </p>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 md:hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-800 text-[12px] font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Upload size={13} /> Changer
            </button>
            <button
              type="button"
              onClick={() => {
                setClearing(true);
                setTimeout(() => {
                  onClear();
                  setClearing(false);
                }, 300);
              }}
              disabled={clearing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-[12px] font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60"
            >
              {clearing ? (
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <X size={13} />
              )}
              Supprimer
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`w-full ${height} rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-150 ${
            dragging
              ? "border-[#1a4731] bg-[#edf7f3] scale-[1.01]"
              : "border-gray-300 bg-gray-50 hover:border-[#1a4731] hover:bg-[#edf7f3]/50"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${dragging ? "bg-[#1a4731]" : "bg-gray-200"}`}
          >
            {dragging ? (
              <Upload size={22} className="text-white" />
            ) : (
              <Image size={22} className="text-gray-400" />
            )}
          </div>
          <div className="text-center">
            <p
              className={`text-[13px] font-semibold ${dragging ? "text-[#1a4731]" : "text-gray-600"}`}
            >
              {dragging ? "Relâchez pour uploader" : "Glissez une image ici"}
            </p>
            <p className="text-[11.5px] text-gray-400 mt-0.5">
              ou{" "}
              <span className="text-[#1a4731] font-semibold underline">
                cliquez pour parcourir
              </span>
            </p>
            <p
              className={`text-[11px] mt-1 ${sizeError ? "text-red-500 font-semibold" : "text-gray-300"}`}
            >
              {sizeError
                ? "Fichier trop volumineux (max 4 Mo)"
                : "PNG, JPG, WEBP — max 4 Mo"}
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {existingImage && !preview && (
        <p className="text-[11px] text-gray-400 mt-2 text-center">
          Image actuelle conservée si aucune nouvelle sélectionnée
        </p>
      )}
    </div>
  );
}
