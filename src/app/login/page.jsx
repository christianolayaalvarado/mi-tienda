"use client"

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useState, useEffect } from "react"

import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination } from "swiper/modules"
import "swiper/css"
import "swiper/css/pagination"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const router = useRouter()

  useEffect(() => {
  setProgress(0)

  const interval = setInterval(() => {
    setProgress((prev) => {
      if (prev >= 100) return 100
      return prev + 2
    })
  }, 70) // 70ms * 50 ≈ 3500ms

  return () => clearInterval(interval)
}, [activeIndex])

  const handleLogin = async (e) => {
    e.preventDefault()
    // Validación básica
    if (!email || !password) {
        setError("Completa todos los campos")
        return
      }
      setLoading(true)
    
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false
    })
    setLoading(false)

    // Si hay error, mostrar mensaje Manejo SEGURO del error
    if (!res||res.error) {
      setError("Credenciales incorrectas")
    } else {
      router.push("/dashboard")
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
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
    <div className="w-full h-screen flex flex-col md:flex-row">
      {/* IZQUIERDA (imagen/carrusel) */}
      <div className="md:w-1/2 w-full md:h-full relative">
        {/* luego metemos carrusel */}
      

<Swiper
modules={[Autoplay]}
autoplay={{ delay: 4000, disableOnInteraction: false }}
loop={true}
onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
className="h-full"
>
  {slides.map((slide, index) => (
    <SwiperSlide key={index} className="h-full">
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
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 w-1/2 z-50">
  {slides.map((_, i) => (
    <div key={i} className="flex-1 h-3 bg-white/20 rounded overflow-hidden">
      
      <div
        style={{
  width:
    i < activeIndex
      ? "100%"
      : i === activeIndex
      ? `${progress}%`
      : "0%",
}}
className="h-full bg-green-500/40 transition-all duration-75"
      />
      
    </div>
  ))}
</div>

        

      </div>
    </SwiperSlide>
  ))}
</Swiper>
      </div>

      {/* DERECHA (login) */}
      <div className="md:w-1/2 w-full flex items-center justify-center px-6">
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
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError("")
            }}
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError("")
            }}
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          />

            <button
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-50"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>

          {error && (
            <p className="text-red-500 text-sm text-center">
              {error}
            </p>
          )}

        </form>
      </div>
    </div>
    </div>
  )
}