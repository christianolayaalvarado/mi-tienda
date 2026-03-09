"use client"

import { useState } from "react"
import Image from "next/image"

export default function ProductGallery({ images, title }) {

  const [selectedImage, setSelectedImage] = useState(images[0])
  const [startIndex, setStartIndex] = useState(0)

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

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start w-full">

      {/* Miniaturas */}
      <div className="flex lg:flex-col items-center w-full lg:w-auto justify-center">

        {/* Botón anterior */}
        <button
          onClick={prev}
          className="mr-2 md:mb-2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-600 text-white hover:bg-green-700 transition flex items-center justify-center"
        >
          <span className="md:hidden">←</span>
          <span className="hidden md:block">↑</span>
        </button>

        {/* Contenedor miniaturas */}
        <div className="flex md:flex-col gap-3 md:gap-4 overflow-hidden">
          {images
            .slice(startIndex, startIndex + visibleCount)
            .map((img, index) => (
              <div
                key={index}
                onClick={() => setSelectedImage(img)}
                className={`relative w-16 h-16 md:w-24 md:h-24 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 transition-transform ${
                  selectedImage === img
                    ? "border-green-600 scale-105"
                    : "border-gray-300 hover:border-green-400 hover:scale-110"
                }`}
              >
                <Image
                  src={img}
                  alt={`${title} ${index}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
        </div>

        {/* Botón siguiente */}
        <button
          onClick={next}
          className="ml-2 md:mt-2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-600 text-white hover:bg-green-700 transition flex items-center justify-center"
        >
          <span className="md:hidden">→</span>
          <span className="hidden md:block">↓</span>
        </button>

      </div>

      {/* Imagen grande */}
      <div className="relative w-full max-w-[420px] md:max-w-[640px] aspect-square order-first md:order-none mx-auto">
        <Image
          src={selectedImage}
          alt={title}
          fill
          className="object-contain rounded-xl shadow-lg transition duration-300"
        />
      </div>

    </div>
  )
}