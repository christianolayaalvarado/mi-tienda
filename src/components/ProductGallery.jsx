"use client"

import { useState } from "react"
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

  const [selectedImage, setSelectedImage] = useState(images[0])
  const [startIndex, setStartIndex] = useState(0)
  const [fade, setFade] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)

  const visibleCount = 4

  const next = () => {
    if (startIndex + visibleCount < images.length) {
      setStartIndex(startIndex + 1)
    }
  }

  const prev = () => {
    if (startIndex > 0) {
      setStartIndex(startIndex - 1)
    }
  }

  function changeImage(img) {
  setFade(true)

  setTimeout(() => {
    setSelectedImage(img)
    setFade(false)
  }, 120)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start w-full max-w-full px-2">

      {/* Miniaturas */}
      <div className="flex lg:flex-col items-center justify-center mx-auto lg:mx-0 max-w-full">

        {/* Botón anterior */}
        <button
          onClick={prev}
          className="mb-2 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-lime-100 hover:scale-110 transition"
        >
          <Chevron className="rotate-180 md:-rotate-90" />
        </button>

        {/* Contenedor miniaturas */}
        <div className="flex gap-3 lg:flex-col lg:gap-4 overflow-visible max-w-full">
          {images
            .slice(startIndex, startIndex + visibleCount)
            .map((img, index) => (
              <div
                key={index}
                onMouseEnter={() => changeImage(img)}
                onClick={() => changeImage(img)}
                className={`relative w-16 h-16 md:w-24 md:h-24 flex-shrink-0 rounded-lg cursor-pointer border-2 transition-all duration-200 ${
                  selectedImage === img
                    ? "border-lime-500 scale-110 shadow-2xl ring-2 ring-lime-300 z-10"
                    : "border-gray-300 hover:border-lime-400 hover:scale-105 hover:shadow-md"
                }`}
              >

              <div className="relative w-full h-full rounded-lg overflow-hidden">

                <Image
                  src={img}
                  alt={`${title} ${index}`}
                  fill
                  className="object-cover"
                />

              </div>

            </div>
          ))}
        </div>

        {/* Botón siguiente */}
        <button
          onClick={next}
          className="mt-2 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-lime-100 hover:scale-110 transition"
        >
          <Chevron className="md:rotate-90" />
        </button>

      </div>

      {/* Imagen grande */}
      <div className="relative w-[80%] sm:w-[85%] md:w-full max-w-[420px] md:max-w-[640px] aspect-square order-first md:order-none mx-auto">
      
        <div
          onClick={() => setViewerOpen(true)}
          className="relative w-[80%] sm:w-[85%] md:w-full max-w-[420px] md:max-w-[640px] aspect-square order-first md:order-none mx-auto cursor-zoom-in"
        >
            
        <Image
        src={selectedImage}
        alt={title}
        fill
        sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 40vw"
        className={`object-contain rounded-xl shadow-lg transition-all duration-300 hover:scale-105 ${
          fade ? "opacity-40 scale-95" : "opacity-100"
        }`}
      />   </div>   </div>

      {viewerOpen && (
  <div
    onClick={() => setViewerOpen(false)}
    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
  >
    <div className="relative w-[90vw] h-[90vh]">
      <Image
        src={selectedImage}
        alt={title}
        fill
        className="object-contain"
      />
    </div>
  </div>
)}






    </div>
  )
}