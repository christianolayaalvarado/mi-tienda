"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Virtual coin economy for mascots.
 *
 * Coins are earned by:
 *   - Time on page (1 coin/30s)
 *   - Scrolling (1 coin/10% scroll)
 *   - Purchases (10 coins per purchase)
 *   - Reviews (5 coins per review)
 *   - Daily login (20 coins)
 *
 * Coins are spent on:
 *   - Accessories (hats, glasses, scarves, etc.)
 */

const COIN_SOURCES = {
  TIME: { amount: 1, interval: 30000, label: "Tiempo en página" },
  SCROLL: { amount: 1, threshold: 10, label: "Explorar" },
  PURCHASE: { amount: 10, label: "Compra" },
  REVIEW: { amount: 5, label: "Reseña" },
  DAILY_LOGIN: { amount: 20, label: "Login diario" },
  ACHIEVEMENT: { amount: 15, label: "Logro desbloqueado" },
};

const ACCESSORIES = [
  // Hats
  { id: "hat_wizard", name: "Sombrero de Mago", price: 50, category: "hat", emoji: "🧙‍♂️" },
  { id: "hat_crown", name: "Corona Real", price: 100, category: "hat", emoji: "👑" },
  { id: "hat_party", name: "Gorro de Fiesta", price: 30, category: "hat", emoji: "🎉" },
  { id: "hat_santa", name: "Gorro Santa", price: 40, category: "hat", emoji: "🎅" },
  { id: "hat_beret", name: "Boina Francesa", price: 35, category: "hat", emoji: "🇫🇷" },

  // Glasses
  { id: "glasses_cool", name: "Lentes Cool", price: 25, category: "glasses", emoji: "😎" },
  { id: "glasses_heart", name: "Lentes Corazón", price: 30, category: "glasses", emoji: "😍" },
  { id: "glasses_nerd", name: "Lentes Nerd", price: 20, category: "glasses", emoji: "🤓" },
  { id: "glasses_sunglasses", name: "Anteojos de Sol", price: 35, category: "glasses", emoji: "🕶️" },

  // Scarves
  { id: "scarf_red", name: "Bufanda Roja", price: 20, category: "scarf", emoji: "🧣" },
  { id: "scarf_gold", name: "Bufanda Dorada", price: 45, category: "scarf", emoji: "✨" },
  { id: "scarf_rainbow", name: "Bufanda Arcoíris", price: 60, category: "scarf", emoji: "🌈" },

  // Wings
  { id: "wings_angel", name: "Alas de Ángel", price: 80, category: "wings", emoji: "👼" },
  { id: "wings_butterfly", name: "Alas de Mariposa", price: 70, category: "wings", emoji: "🦋" },
  { id: "wings_fire", name: "Alas de Fuego", price: 120, category: "wings", emoji: "🔥" },

  // Effects
  { id: "effect_sparkle", name: "Brillo Mágico", price: 40, category: "effect", emoji: "✨" },
  { id: "effect_rainbow", name: "Arcoíris", price: 55, category: "effect", emoji: "🌈" },
  { id: "effect_fire", name: "Llamas", price: 65, category: "effect", emoji: "🔥" },
];

const STORAGE_KEY = "mascot_coins";
const ACCESSORIES_KEY = "mascot_accessories";
const LAST_LOGIN_KEY = "mascot_last_login";
const EQUIPPED_KEY = "mascot_equipped";

function loadCoins() {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
  } catch { return 0; }
}

function saveCoins(amount) {
  try { localStorage.setItem(STORAGE_KEY, String(amount)); } catch {}
}

function loadOwned() {
  try {
    return JSON.parse(localStorage.getItem(ACCESSORIES_KEY) || "[]");
  } catch { return []; }
}

function saveOwned(owned) {
  try { localStorage.setItem(ACCESSORIES_KEY, JSON.stringify(owned)); } catch {}
}

function loadEquipped() {
  try {
    return JSON.parse(localStorage.getItem(EQUIPPED_KEY) || "{}");
  } catch { return {}; }
}

function saveEquipped(equipped) {
  try { localStorage.setItem(EQUIPPED_KEY, JSON.stringify(equipped)); } catch {}
}

export default function useMascotCoins() {
  const [coins, setCoins] = useState(0);
  const [owned, setOwned] = useState([]);
  const [equipped, setEquipped] = useState({});
  const [newCoinAnimation, setNewCoinAnimation] = useState(false);
  const scrollRef = useRef(0);
  const timeRef = useRef(null);

  // Load on mount
  useEffect(() => {
    setCoins(loadCoins());
    setOwned(loadOwned());
    setEquipped(loadEquipped());

    // Check daily login
    const lastLogin = localStorage.getItem(LAST_LOGIN_KEY);
    const today = new Date().toDateString();
    if (lastLogin !== today) {
      localStorage.setItem(LAST_LOGIN_KEY, today);
      addCoins(COIN_SOURCES.DAILY_LOGIN.amount, "Login diario");
    }
  }, []);

  // Earn coins over time
  useEffect(() => {
    timeRef.current = setInterval(() => {
      addCoins(COIN_SOURCES.TIME.amount, "Tiempo");
    }, COIN_SOURCES.TIME.interval);

    return () => clearInterval(timeRef.current);
  }, []);

  const addCoins = useCallback((amount, source = "") => {
    setCoins((prev) => {
      const newAmount = prev + amount;
      saveCoins(newAmount);
      return newAmount;
    });

    // Show animation
    setNewCoinAnimation(true);
    setTimeout(() => setNewCoinAnimation(false), 1000);
  }, []);

  const addScrollCoins = useCallback((scrollPercent) => {
    const tenPercentBlocks = Math.floor(scrollPercent / 10);
    if (tenPercentBlocks > scrollRef.current) {
      const newBlocks = tenPercentBlocks - scrollRef.current;
      addCoins(newBlocks * COIN_SOURCES.SCROLL.amount, "Explorar");
      scrollRef.current = tenPercentBlocks;
    }
  }, [addCoins]);

  const spendCoins = useCallback((amount) => {
    if (coins < amount) return false;
    setCoins((prev) => {
      const newAmount = prev - amount;
      saveCoins(newAmount);
      return newAmount;
    });
    return true;
  }, [coins]);

  const buyAccessory = useCallback((accessoryId) => {
    const accessory = ACCESSORIES.find((a) => a.id === accessoryId);
    if (!accessory) return { success: false, message: "Accesorio no encontrado" };
    if (owned.includes(accessoryId)) return { success: false, message: "Ya lo tienes" };
    if (coins < accessory.price) return { success: false, message: "No tienes suficientes monedas" };

    spendCoins(accessory.price);
    const newOwned = [...owned, accessoryId];
    setOwned(newOwned);
    saveOwned(newOwned);
    return { success: true, message: `¡Compraste ${accessory.name}!` };
  }, [coins, owned, spendCoins]);

  const equipAccessory = useCallback((accessoryId) => {
    const accessory = ACCESSORIES.find((a) => a.id === accessoryId);
    if (!accessory || !owned.includes(accessoryId)) return;

    setEquipped((prev) => {
      const newEquipped = { ...prev };
      if (newEquipped[accessory.category] === accessoryId) {
        delete newEquipped[accessory.category];
      } else {
        newEquipped[accessory.category] = accessoryId;
      }
      saveEquipped(newEquipped);
      return newEquipped;
    });
  }, [owned]);

  const getEquippedDisplay = useCallback(() => {
    return Object.entries(equipped).map(([category, id]) => {
      const accessory = ACCESSORIES.find((a) => a.id === id);
      return accessory ? { ...accessory, category } : null;
    }).filter(Boolean);
  }, [equipped]);

  return {
    coins,
    owned,
    equipped,
    newCoinAnimation,
    accessories: ACCESSORIES,
    addCoins,
    addScrollCoins,
    spendCoins,
    buyAccessory,
    equipAccessory,
    getEquippedDisplay,
    COIN_SOURCES,
  };
}
