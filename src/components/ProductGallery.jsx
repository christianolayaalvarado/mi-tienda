"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

function Chevron({ className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export default function ProductGallery({ images, title }) {

  // 🔹 Limpiar imágenes inválidas
  const validImages =
    images && images.length > 0
      ? images.filter(img => img && img.trim() !== "")
      : []

  const displayImages =
    validImages.length > 0
      ? validImages
      : ["/images/placeholder.png"]

  const [selectedImage, setSelectedImage] = useState(null)
  const [startIndex, setStartIndex] = useState(0)
  const [fade, setFade] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)

  const visibleCount = 4

  // 🔥 FIX IMPORTANTE: inicializar correctamente
  useEffect(() => {
    if (displayImages.length > 0) {
      setSelectedImage(displayImages[0])
      setStartIndex(0)
    }
  }, [images])

  // 🔹 ESC para cerrar viewer
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setViewerOpen(false)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  const next = () => {
    if (startIndex + visibleCount < displayImages.length) {
      setStartIndex(startIndex + 1)
    }
  }

  const prev = () => {
    if (startIndex > 0) {
      setStartIndex(startIndex - 1)
    }
  }

  const changeImage = (img) => {
    setFade(true)
    setSelectedImage(img)
    setTimeout(() => setFade(false), 120)
  }

  // 🔥 Fallback si imagen falla (clave para Cloudinary)
  const handleImageError = () => {
    setSelectedImage("/images/placeholder.png")
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start w-full max-w-full">

      {/* Miniaturas */}
      <div className="flex lg:flex-col items-center justify-center mx-auto lg:mx-0 max-w-full">
        
        <button
          onClick={prev}
          className="mb-2 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-lime-100 hover:scale-110 transition"
        >
          <Chevron className="rotate-180 md:-rotate-90" />
        </button>

        <div className="flex gap-3 lg:flex-col lg:gap-4 overflow-x-auto lg:overflow-visible max-w-full py-2 scrollbar-none">
          {displayImages
            .slice(startIndex, startIndex + visibleCount)
            .map((img, index) => (
              <div
                key={index}
                onMouseEnter={() => changeImage(img)}
                onClick={() => changeImage(img)}
                className={`relative w-16 h-16 md:w-24 md:h-24 flex-shrink-0 rounded-lg cursor-pointer border-2 transition-all duration-200 ${
                  selectedImage === img
                    ? "border-lime-500 scale-105 shadow-2xl ring-2 ring-lime-300 z-10"
                    : "border-gray-300 hover:border-lime-400 hover:scale-105 hover:shadow-md"
                }`}
              >
                <div className="relative w-full h-full rounded-lg overflow-hidden">
                  <Image
                    src={img || "/images/placeholder.png"}
                    alt={`${title} ${index}`}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/images/placeholder.png"
                    }}
                  />
                </div>
              </div>
            ))}
        </div>

        <button
          onClick={next}
          className="mt-2 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-lime-100 hover:scale-110 transition"
        >
          <Chevron className="md:rotate-90" />
        </button>
      </div>

      {/* Imagen grande */}
      <div className="relative w-full sm:w-[85%] md:w-full max-w-[640px] aspect-square mx-auto">
        <div
          onClick={() => setViewerOpen(true)}
          className="relative w-full h-full cursor-zoom-in"
        >
          {selectedImage && (
            <Image
              src={selectedImage}
              alt={title}
              fill
              sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 40vw"
              className={`object-contain rounded-xl shadow-lg transition-all duration-300 hover:scale-105 ${
                fade ? "opacity-40 scale-95" : "opacity-100"
              }`}
              priority
              onError={handleImageError}
            />
          )}
        </div>
      </div>

      {/* Viewer fullscreen */}
      {viewerOpen && (
        <div
          onClick={() => setViewerOpen(false)}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 cursor-zoom-out"
        >
          <div className="relative w-[90vw] h-[90vh]">
            <Image
              src={selectedImage || "/images/placeholder.png"}
              alt={title}
              fill
              className="object-contain"
              priority
              onError={handleImageError}
            />
          </div>
        </div>
      )}
    </div>
  )
}