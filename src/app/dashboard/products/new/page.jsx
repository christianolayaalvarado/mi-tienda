"use client"
import { products } from "@/data/products"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useProducts } from "@/hooks/useProducts"
import Image from "next/image"

export default function NewProduct() {
  const router = useRouter()
  const { addProduct } = useProducts()
  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "",
    stock: "",
    seller: "",
    store: "",
    description: ""
  })

  const [images, setImages] = useState([])
  const [toast, setToast] = useState(false)
  const [errors, setErrors] = useState({})

  const categories = [...new Set(products.map(p => p.category))].sort((a, b) => a.localeCompare(b))

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })

    setErrors(prev => ({
      ...prev,
      [e.target.name]: ""
    }))
  }

  function validate() {

  const newErrors = {}

  if (!form.title.trim()) {
    newErrors.title = "El nombre es obligatorio"
  }

  if (!form.price || Number(form.price) <= 0) {
    newErrors.price = "Precio inválido"
  }

  if (!form.category) {
    newErrors.category = "Selecciona una categoría"
  }

  if (!form.stock || Number(form.stock) < 0) {
    newErrors.stock = "Stock inválido"
  }

  if (!form.seller.trim()) {
    newErrors.seller = "El vendedor es obligatorio"
  }
    
  if (!form.store.trim()) {
    newErrors.store = "La tienda es obligatoria"
    }
    
  if (images.length === 0) {
  newErrors.images = "Debes subir al menos una imagen"
    }


  return newErrors
}

  function handleImages(e) {

  const files = Array.from(e.target.files)

  const readers = files.map(file => {

    return new Promise((resolve) => {

      const reader = new FileReader()

      reader.onload = () => {
        resolve(reader.result)
      }

      reader.readAsDataURL(file)

    })

  })

  Promise.all(readers).then(base64Images => {

    const previewImages = base64Images.map(img => ({
      preview: img,
      data: img
    }))

    setImages(previewImages)

  })

}

  function removeImage(indexToRemove) {
  setImages(prev =>
    prev.filter((_, index) => index !== indexToRemove)
  )
}

  function handleSubmit(e) {
    e.preventDefault()
    
    const validationErrors = validate()

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }

  const newProduct = {
  id: Date.now(),
  ...form,
  price: Number(form.price),
  stock: Number(form.stock),
  images: images.map(img => img.data)
}

addProduct(newProduct)

    setToast(true)
    setTimeout(() => {
      router.push("/dashboard/products")
    }, 2500)
}

  return (

    <div className="max-w-2xl">

      <h1 className="text-2xl font-bold mb-6">
        Nuevo producto
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <input
          name="title"
          placeholder="Nombre del producto"
          className="border p-3 rounded"
          onChange={handleChange}
        />

        {errors.title && (
          <p className="text-red-500 text-sm">{errors.title}</p>
        )}

        <input
          name="price"
          type="number"
          placeholder="Precio"
          className="border p-3 rounded"
          onChange={handleChange}
        />

        {errors.price && (
          <p className="text-red-500 text-sm">{errors.price}</p>
        )}

          <select
            name="category"
            className="border p-3 rounded"
            onChange={handleChange}
        >
            <option value="">
              Seleccionar categoría
            </option>

            {categories.map((cat, index) => (
              <option key={index} value={cat}>
                {cat}
              </option>
            ))}

        </select>
        {errors.category && (
          <p className="text-red-500 text-sm">{errors.category}</p>
        )}

        <input
          name="stock"
          type="number"
          placeholder="Stock"
          className="border p-3 rounded"
          onChange={handleChange}
        />
        
        {errors.stock && (
          <p className="text-red-500 text-sm">{errors.stock}</p>
        )}


        <input
          name="seller"
          placeholder="Vendedor"
          className="border p-3 rounded"
          onChange={handleChange}
        />

        {errors.seller && (
          <p className="text-red-500 text-sm">{errors.seller}</p>
        )}
        
        <input
          name="store"
          placeholder="Tienda"
          className="border p-3 rounded"
          onChange={handleChange}
        />

        {errors.store && (
          <p className="text-red-500 text-sm">{errors.store}</p>
        )}
        
        <textarea
          name="description"
          placeholder="Descripción del producto"
          className="border p-3 rounded min-h-[120px]"
          onChange={handleChange}
        />

        <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImages}
            className="border p-3 rounded"
          />

        {errors.images && (
          <p className="text-red-500 text-sm">{errors.images}</p>
        )}


        {images.length > 0 && (

  <div className="grid grid-cols-3 gap-3 mt-2">

    {images.map((img, index) => (

  <div
    key={index}
    className="relative w-full aspect-square border rounded overflow-hidden"
  >

    <Image
      src={img.preview}
      alt="preview"
      className="object-cover w-full h-full"
    />

    <button
      type="button"
      onClick={() => removeImage(index)}
      className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded hover:bg-black"
    >
      ✕
    </button>

  </div>

))}

  </div>

)}

        {toast && (
          <div className="mt-3 p-3 bg-green-100 border border-green-300 text-green-800 rounded text-sm">
            Producto guardado correctamente
          </div>

        )}
        
        <button className="bg-lime-600 text-white p-3 rounded hover:bg-lime-700">
          Guardar producto
        </button>



      </form>

    </div>

  )
}