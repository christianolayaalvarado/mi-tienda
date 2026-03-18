"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination } from "swiper/modules"
import "swiper/css"

import {pagination} from "swiper/modules"
import "swiper/css/pagination"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false
    })

    if (!res.error) {
      router.push("/dashboard")
    } else {
      alert("Credenciales incorrectas")
    }
  }

  const slides = [
  {
    title: "Decora tu hogar",
    image: "/slides/slide1.jpg"
  },
  {
    title: "Ofertas únicas",
    image: "/slides/slide2.jpg"
  },
  {
    title: "Compra fácil",
    image: "/slides/slide3.jpg"
  }
]

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* IZQUIERDA (imagen/carrusel) */}
      <div className="md:w-1/2 w-full h-56 md:h-auto">
        {/* luego metemos carrusel */}
      

<Swiper
  modules={[Autoplay, Pagination]}
  autoplay={{ delay: 3500, disableOnInteraction: false }}
  pagination={{ clickable: true }}        
  loop={true}
  className="h-full"
>
  {slides.map((slide, index) => (
    <SwiperSlide key={index}>
      <div className="relative w-full h-full">

        <Image
          src={slide.image}
          alt={slide.title}
          fill
          className="object-cover"
        />

        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Texto */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h2 className="text-white text-2xl md:text-3xl font-bold text-center px-4">
            {slide.title}
          </h2>
        </div>

      </div>
    </SwiperSlide>
  ))}
</Swiper>
      </div>

      {/* DERECHA (login) */}
      <div className="md:w-1/2 w-full flex items-center justify-center p-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md space-y-4"
        >
          <h2 className="text-2xl font-bold text-center">
            Iniciar sesión
          </h2>

          <input
            type="email"
            placeholder="Correo"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          />

          <input
            type="password"
            placeholder="Contraseña"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          />

          <button className="w-full bg-green-600 text-white py-2 rounded">
            Ingresar
          </button>
        </form>
      </div>

    </div>
  )
}