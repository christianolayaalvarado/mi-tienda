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
    <div className="flex flex-col md:flex-row gap-6 items-center w-full">

      {/* Miniaturas */}
      <div className="flex md:flex-col items-center w-full md:w-auto">

      <button
        onClick={prev}
        className="hidden md:flex mb-2 w-10 h-10 rounded-full bg-green-600 text-white hover:bg-green-700 transition items-center justify-center"
      >
          ↑
        </button>

        <div className="flex md:flex-col items-center w-full md:w-auto">
          {images
            .slice(startIndex, startIndex + visibleCount)
            .map((img, index) => (
              <div
                key={index}
                onClick={() => setSelectedImage(img)}
                className={`relative w-28 h-28 rounded-lg overflow-hidden cursor-pointer border-2 transition transform ${
                selectedImage === img
                  ? "border-green-600 scale-105"
                  : "border-gray-300 hover:border-green-400 hover:scale-105"
                }`}
              >
                <Image
                  src={img}
                  alt={`${title} ${index}`}
                  fill
                  className="object-cover transition duration-300"
                />
              </div>
            ))}
        </div>

        <button
          onClick={next}
          className="mt-2 w-10 h-10 rounded-full bg-green-600 text-white hover:bg-green-700 transition"
        >
          ↓
        </button>
      </div>

      {/* Imagen grande */}
        <div className="relative w-full max-w-[720px] aspect-square order-first md:order-none">
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