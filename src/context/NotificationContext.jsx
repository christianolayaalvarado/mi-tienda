"use client"

import { createContext, useContext, useState } from "react"

const NotificationContext = createContext()

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const addNotification = (message, type = "success") => {
    const id = Date.now()

    setNotifications((prev) => [
      ...prev,
      { id, message, type },
    ])

    // ⏳ Auto eliminar
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 3000)
  }

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}

      {/* UI de notificaciones */}
      <div className="fixed top-5 right-5 space-y-2 z-50">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`px-4 py-2 rounded shadow text-white transition-all ${
              n.type === "success"
                ? "bg-green-500"
                : n.type === "error"
                ? "bg-red-500"
                : "bg-gray-800"
            }`}
          >
            {n.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  return useContext(NotificationContext)
}