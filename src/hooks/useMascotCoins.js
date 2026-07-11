"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Virtual coin economy with real-benefit accessories.
 *
 * Coins earned by: time, scroll, purchases, reviews, daily login, achievements
 * Accessories give REAL bonuses: extra coins, discounts, speed boosts
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
  // === HATS — Bonus: extra coins per source ===
  { id: "hat_wizard", name: "Sombrero de Mago", price: 50, category: "hat", emoji: "🧙‍♂️", bonus: "+1 moneda extra por fuente", bonusType: "coin_boost", bonusValue: 1 },
  { id: "hat_crown", name: "Corona Real", price: 100, category: "hat", emoji: "👑", bonus: "x2 monedas por compra", bonusType: "purchase_multiplier", bonusValue: 2 },
  { id: "hat_party", name: "Gorro de Fiesta", price: 30, category: "hat", emoji: "🎉", bonus: "+5 monedas de login diario", bonusType: "daily_boost", bonusValue: 5 },
  { id: "hat_santa", name: "Gorro Santa", price: 40, category: "hat", emoji: "🎅", bonus: "Regalo sorpresa cada 24h (10-50 monedas)", bonusType: "daily_gift", bonusValue: 10 },
  { id: "hat_beret", name: "Boina Francesa", price: 35, category: "hat", emoji: "🇫🇷", bonus: "+1 moneda por reseña", bonusType: "review_boost", bonusValue: 1 },

  // === GLASSES — Bonus: scroll speed / discount ===
  { id: "glasses_cool", name: "Lentes Cool", price: 25, category: "glasses", emoji: "😎", bonus: "Scroll 20% más rápido", bonusType: "scroll_speed", bonusValue: 0.2 },
  { id: "glasses_heart", name: "Lentes Corazón", price: 30, category: "glasses", emoji: "😍", bonus: "Mensajes de la mascot 30% más frecuentes", bonusType: "mascot_talk", bonusValue: 0.3 },
  { id: "glasses_nerd", name: "Lentes Nerd", price: 20, category: "glasses", emoji: "🤓", bonus: "+2 monedas extra por explorar", bonusType: "scroll_boost", bonusValue: 2 },
  { id: "glasses_sunglasses", name: "Anteojos de Sol", price: 35, category: "glasses", emoji: "🕶️", bonus: "Mascota camina 30% más rápido", bonusType: "walk_speed", bonusValue: 0.3 },

  // === SCARVES — Bonus: coin multiplier ===
  { id: "scarf_red", name: "Bufanda Roja", price: 20, category: "scarf", emoji: "🧣", bonus: "x1.1 monedas por tiempo", bonusType: "time_multiplier", bonusValue: 1.1 },
  { id: "scarf_gold", name: "Bufanda Dorada", price: 45, category: "scarf", emoji: "✨", bonus: "x1.5 monedas por tiempo", bonusType: "time_multiplier", bonusValue: 1.5 },
  { id: "scarf_rainbow", name: "Bufanda Arcoíris", price: 60, category: "scarf", emoji: "🌈", bonus: "x2 monedas por tiempo", bonusType: "time_multiplier", bonusValue: 2 },

  // === WINGS — Bonus: auto-earn while idle ===
  { id: "wings_angel", name: "Alas de Ángel", price: 80, category: "wings", emoji: "👼", bonus: "+2 monedas por 30s idle", bonusType: "idle_income", bonusValue: 2 },
  { id: "wings_butterfly", name: "Alas de Mariposa", price: 70, category: "wings", emoji: "🦋", bonus: "Monedas dobles al explorar 100%", bonusType: "scroll_double", bonusValue: 2 },
  { id: "wings_fire", name: "Alas de Fuego", price: 120, category: "wings", emoji: "🔥", bonus: "+5 monedas por compra", bonusType: "purchase_boost", bonusValue: 5 },

  // === EFFECTS — Bonus: special abilities ===
  { id: "effect_sparkle", name: "Brillo Mágico", price: 40, category: "effect", emoji: "✨", bonus: "Mascota brilla cada 30s (+1 moneda)", bonusType: "sparkle_income", bonusValue: 1 },
  { id: "effect_rainbow", name: "Arcoíris", price: 55, category: "effect", emoji: "🌈", bonus: "+3 monedas de login diario", bonusType: "daily_boost", bonusValue: 3 },
  { id: "effect_fire", name: "Llamas", price: 65, category: "effect", emoji: "🔥", bonus: "Combo: x3 monedas si tienes 3+ accesorios", bonusType: "combo_bonus", bonusValue: 3 },
];

const STORAGE_KEY = "mascot_coins";
const ACCESSORIES_KEY = "mascot_accessories";
const LAST_LOGIN_KEY = "mascot_last_login";
const EQUIPPED_KEY = "mascot_equipped";
const LAST_GIFT_KEY = "mascot_last_gift";

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function useMascotCoins() {
  const [coins, setCoins] = useState(0);
  const [owned, setOwned] = useState([]);
  const [equipped, setEquipped] = useState({});
  const [newCoinAnimation, setNewCoinAnimation] = useState(false);
  const [lastBonusMsg, setLastBonusMsg] = useState("");
  const scrollRef = useRef(0);

  useEffect(() => {
    setCoins(load(STORAGE_KEY, 0));
    setOwned(load(ACCESSORIES_KEY, []));
    setEquipped(load(EQUIPPED_KEY, {}));

    // Daily login bonus
    const lastLogin = localStorage.getItem(LAST_LOGIN_KEY);
    const today = new Date().toDateString();
    if (lastLogin !== today) {
      localStorage.setItem(LAST_LOGIN_KEY, today);
      const bonus = calculateBonus("daily", 20);
      addCoins(bonus, `Login diario (+${bonus})`);
    }

    // Daily gift from Santa hat
    const lastGift = localStorage.getItem(LAST_GIFT_KEY);
    const todayStr = new Date().toDateString();
    if (lastGift !== todayStr && isEquipped("hat_santa")) {
      localStorage.setItem(LAST_GIFT_KEY, todayStr);
      const gift = 10 + Math.floor(Math.random() * 41);
      addCoins(gift, `🎁 Regalo sorpresa: ${gift} monedas`);
    }
  }, []); // eslint-disable-line

  // Idle income timer
  useEffect(() => {
    if (!isEquipped("wings_angel")) return;
    const t = setInterval(() => {
      const bonus = calculateBonus("idle", 2);
      addCoins(bonus, `Idle bonus: +${bonus}`);
    }, 30000);
    return () => clearInterval(t);
  }, [owned, equipped]); // eslint-disable-line

  // Sparkle income
  useEffect(() => {
    if (!isEquipped("effect_sparkle")) return;
    const t = setInterval(() => {
      const bonus = calculateBonus("sparkle", 1);
      addCoins(bonus, `✨ Brillo: +${bonus}`);
    }, 30000);
    return () => clearInterval(t);
  }, [owned, equipped]); // eslint-disable-line

  function isEquipped(id) {
    const acc = ACCESSORIES.find((a) => a.id === id);
    return acc && equipped[acc.category] === id;
  }

  function calculateBonus(type, baseAmount) {
    let amount = baseAmount;

    // Hat wizard: +1 per source
    if (type !== "daily" && isEquipped("hat_wizard")) amount += 1;

    // Scarf multipliers on time
    if (type === "time" && isEquipped("scarf_rainbow")) amount = Math.floor(amount * 2);
    else if (type === "time" && isEquipped("scarf_gold")) amount = Math.floor(amount * 1.5);
    else if (type === "time" && isEquipped("scarf_red")) amount = Math.floor(amount * 1.1);

    // Daily boost
    if (type === "daily") {
      if (isEquipped("hat_party")) amount += 5;
      if (isEquipped("effect_rainbow")) amount += 3;
    }

    // Review boost
    if (type === "review" && isEquipped("hat_beret")) amount += 1;

    // Scroll boost
    if (type === "scroll" && isEquipped("glasses_nerd")) amount += 2;

    // Purchase boost
    if (type === "purchase") {
      if (isEquipped("wings_fire")) amount += 5;
      if (isEquipped("hat_crown")) amount = Math.floor(amount * 2);
    }

    // Combo bonus: 3+ accessories = x3
    const equippedCount = Object.keys(equipped).length;
    if (equippedCount >= 3 && isEquipped("effect_fire")) {
      amount = Math.floor(amount * 3);
    }

    return amount;
  }

  const addCoins = useCallback((amount, source = "") => {
    setCoins((prev) => {
      const newAmount = prev + amount;
      save(STORAGE_KEY, newAmount);
      return newAmount;
    });
    setNewCoinAnimation(true);
    setTimeout(() => setNewCoinAnimation(false), 1000);
    if (source) {
      setLastBonusMsg(source);
      setTimeout(() => setLastBonusMsg(""), 3000);
    }
  }, []);

  const addScrollCoins = useCallback((scrollPercent) => {
    const tenPercentBlocks = Math.floor(scrollPercent / 10);
    if (tenPercentBlocks > scrollRef.current) {
      const newBlocks = tenPercentBlocks - scrollRef.current;
      let amount = newBlocks * COIN_SOURCES.SCROLL.amount;
      if (isEquipped("glasses_nerd")) amount += newBlocks * 2;
      if (isEquipped("glasses_cool")) amount = Math.floor(amount * 1.2);
      addCoins(amount, `Explorar: +${amount}`);
      scrollRef.current = tenPercentBlocks;
    }
  }, [addCoins, owned, equipped]); // eslint-disable-line

  const spendCoins = useCallback((amount) => {
    if (coins < amount) return false;
    setCoins((prev) => {
      const newAmount = prev - amount;
      save(STORAGE_KEY, newAmount);
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
    save(ACCESSORIES_KEY, newOwned);
    return { success: true, message: `¡Compraste ${accessory.name}! ${accessory.bonus}` };
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
      save(EQUIPPED_KEY, newEquipped);
      return newEquipped;
    });
  }, [owned]);

  const getEquippedDisplay = useCallback(() => {
    return Object.entries(equipped).map(([category, id]) => {
      const accessory = ACCESSORIES.find((a) => a.id === id);
      return accessory ? { ...accessory, category } : null;
    }).filter(Boolean);
  }, [equipped]);

  const getScrollSpeed = useCallback(() => {
    if (isEquipped("glasses_cool")) return 1.2;
    return 1;
  }, [owned, equipped]); // eslint-disable-line

  const getWalkSpeed = useCallback(() => {
    if (isEquipped("glasses_sunglasses")) return 1.3;
    return 1;
  }, [owned, equipped]); // eslint-disable-line

  return {
    coins,
    owned,
    equipped,
    newCoinAnimation,
    lastBonusMsg,
    accessories: ACCESSORIES,
    addCoins,
    addScrollCoins,
    spendCoins,
    buyAccessory,
    equipAccessory,
    getEquippedDisplay,
    getScrollSpeed,
    getWalkSpeed,
    COIN_SOURCES,
  };
}
