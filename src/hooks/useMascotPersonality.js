"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Mascot personality engine — contextual dialogue + mood system.
 *
 * Mood affects: colors, animation speed, dialogue selection
 * Dialogue is contextual: reacts to scroll, products, cart, time, etc.
 */

const MOODS = {
  HAPPY: "happy",
  EXCITED: "excited",
  CURIOUS: "curious",
  SLEEPY: "sleepy",
  SILLY: "silly",
  WISE: "wise",
};

const MOOD_WEIGHTS = {
  [MOODS.HAPPY]: 30,
  [MOODS.EXCITED]: 15,
  [MOODS.CURIOUS]: 20,
  [MOODS.SLEEPY]: 10,
  [MOODS.SILLY]: 15,
  [MOODS.WISE]: 10,
};

const MOOD_EMOJIS = {
  [MOODS.HAPPY]: "😊",
  [MOODS.EXCITED]: "🤩",
  [MOODS.CURIOUS]: "🧐",
  [MOODS.SLEEPY]: "😴",
  [MOODS.SILLY]: "🤪",
  [MOODS.WISE]: "🧠",
};

function weightedRandom(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [key, weight] of entries) {
    r -= weight;
    if (r <= 0) return key;
  }
  return entries[0][0];
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Contextual dialogue by situation
const DIALOGUE = {
  // Greetings
  greeting: {
    [MOODS.HAPPY]: [
      "¡Hola! ¡Qué gusto verte! 😊",
      "¡Bienvenido! Estoy aquí para ayudarte 🛍️",
      "¡Hola! ¿Listo para comprar algo genial?",
    ],
    [MOODS.EXCITED]: [
      "¡¡¡HOLA!!! ¡Qué emoción verte! 🎉",
      "¡Hola! ¡Hay cosas increíbles hoy! ✨",
      "¡WOW! ¡Por fin llegaste! 🤩",
    ],
    [MOODS.CURIOUS]: [
      "Hola... ¿qué buscas hoy? 🤔",
      "¿Ya viste las novedades? 👀",
      "Hmm, ¿compras o solo miras? 🧐",
    ],
    [MOODS.SLEEPY]: [
      "Ya llegaste... estaba dormido... 😴",
      "Hola... *bostezo*... bienvenido 🥱",
      "¿Qué hora es? Ah, ya llegaste 💤",
    ],
    [MOODS.SILLY]: [
      "¡Soy una mascota y estoy aquí! 🤪",
      "¡Bip bip! ¡Soy un robot! Nah, solo bromeo 😜",
      "¡Hola! ¿Me extrañaste? ¡Porque yo sí! 💕",
    ],
    [MOODS.WISE]: [
      "Bienvenido. La sabiduría está en los descuentos 📚",
      "Ah, un comprador inteligente. Adelante 🎩",
      "La paciencia trae buenas ofertas. Espera... ¡ya hay! 🧠",
    ],
  },

  // Scrolling
  scrolling: {
    [MOODS.HAPPY]: [
      "¡Sigue bajando! ¡Hay más! 👇",
      "¡Me encanta ver cómo compras! 🛒",
      "¡Buen ritmo! Sigue así 🏃",
    ],
    [MOODS.EXCITED]: [
      "¡¡MIRA ESO!! ¡abajo hay ofertas! 🔥",
      "¡¿Ya viste?! ¡¡ES INCREÍBLE!! 🤩",
      "¡No pares! ¡Hay tesoros abajo! 💎",
    ],
    [MOODS.CURIOUS]: [
      "¿Qué buscas exactamente? 🤔",
      "Hmm, ¿ese producto te llama? 👀",
      "¿Comparas precios? ¡Buena estrategia! 🧐",
    ],
    [MOODS.SLEEPY]: [
      "Ya vas... sigo aquí... 😴",
      "Zzz... ¿ya encontraste algo? 💤",
      "Estoy... *bostezo*... mirándote... 🥱",
    ],
    [MOODS.SILLY]: [
      "¡Bajando como una montaña rusa! 🎢",
      "¡Whee! ¡Esto es divertido! 🤪",
      "¿Ya viste el precio de eso? ¡Wow! 😜",
    ],
    [MOODS.WISE]: [
      "La paciencia revela las mejores ofertas 📖",
      "Los compradores sabios comparan tres veces 🧠",
      "El scroll profundo revela tesoros ocultos 🗺️",
    ],
  },

  // Product seen
  product_view: {
    [MOODS.HAPPY]: [
      "¡Buen ojo! Eso se ve genial 👀",
      "¡Me gusta tu estilo! 🎨",
      "¡Ese producto es TOP! ⭐",
    ],
    [MOODS.EXCITED]: [
      "¡¡ESE ES INCREÍBLE!! ¡Cómpralo!! 🔥",
      "¡¡WOW!! ¡No lo puedo creer! 🤩",
      "¡¡EL MEJOR PRODUCTO!! ¡De verdad! 💯",
    ],
    [MOODS.CURIOUS]: [
      "¿Lo necesitas o lo quieres? 🤔",
      "Hmm, interesante elección... 🧐",
      "¿Ya leíste la descripción? 👀",
    ],
    [MOODS.SILLY]: [
      "¡Eso es más bonito que yo! 🤪",
      "¡Cómpralo! ¡O me pongo triste! 😜",
      "¡Dinero bien gastado! Bueno, tu dinero 😂",
    ],
    [MOODS.WISE]: [
      "Inversión inteligente, comprador sabio 🎩",
      "La calidad se nota, no se explica 📚",
      "Un buen producto vale cada centavo 🧠",
    ],
  },

  // Cart
  cart: {
    [MOODS.HAPPY]: [
      "¡Tu carrito se ve lleno! 🛒",
      "¡Buenas compras! 👍",
      "¡El carrito está contento! 🎉",
    ],
    [MOODS.EXCITED]: [
      "¡¡LLÉNALO MÁS!! ¡MÁS!! 🔥",
      "¡¡ESE CARRITO NECESITA AMOR!! 💕",
      "¡¡COMPRA TODO!! ¡Digo, lo que necesites! 🤩",
    ],
    [MOODS.CURIOUS]: [
      "¿Ya revisaste el total? 🤔",
      "¿Algo más en tu lista? 📝",
      "¿Listo para pagar o sigues viendo? 🧐",
    ],
    [MOODS.SILLY]: [
      "¡El carrito dice que quieres más! 🛒",
      "¡Yo también quiero ir en el carrito! 🤪",
      "¡Ese carrito es sexy! ¿Puedo decir eso? 😜",
    ],
    [MOODS.WISE]: [
      "Un carrito lleno es un corazón contento 💚",
      "La estrategia es comprar inteligente, no rápido 🧠",
      "Cada producto en el carrito es una decisión sabia 📚",
    ],
  },

  // Bottom of page
  bottom: {
    [MOODS.HAPPY]: [
      "¡Llegaste al final! 🎉",
      "¡Ya viste todo! ¿Algo te gustó? ⭐",
      "¡Fue un gran recorrido! 🏆",
    ],
    [MOODS.EXCITED]: [
      "¡¡LO LOGRASTE!! ¡FIN!! 🎊",
      "¡¡ERES EL MEJOR SCROLLERO!! 🏅",
      "¡¡VICTORIA!! ¡Llegaste al fondo! 🎉",
    ],
    [MOODS.SLEEPY]: [
      "Ya llegamos... puedo dormir ahora... 😴",
      "Fin... *bostezo*... qué largo 🥱",
      "¿Ya? Puedo descansar... 💤",
    ],
    [MOODS.SILLY]: [
      "¡FIN! ¡Como mi paciencia! Nah, te quiero 😜",
      "¡Llegaste! ¡Toma tu medalla! 🏅",
      "¡Eso fue épico! Como una película 🎬",
    ],
    [MOODS.WISE]: [
      "El final del camino revela la sabiduría del comprador 📜",
      "Has visto todo. Ahora decide con calma 🧠",
      "El verdadero tesoro está en las decisiones sabias 💎",
    ],
  },

  // Idle (no interaction)
  idle: {
    [MOODS.HAPPY]: [
      "¿Sigues ahí? 😊",
      "Estoy aquí si me necesitas 🛍️",
      "¿Ya decidiste? No hay prisa 👍",
    ],
    [MOODS.SLEEPY]: [
      "Zzz... ¿me extrañas? 😴",
      "Dormido... pero alerta... 💤",
      "Ya... *bostezo*... vuelvo... 🥱",
    ],
    [MOODS.CURIOUS]: [
      "¿Qué piensas hacer? 🤔",
      "¿Necesitas ayuda? 👀",
      "¿Otra cosa? Estoy aquí 🧐",
    ],
    [MOODS.SILLY]: [
      "¡¿ME IGNORAS?! ¡Estoy aquí! 🤪",
      "Si no me miras, harécosas raras 😜",
      "¡Hola? ¿Hola? ¿Hay alguien? 📢",
    ],
    [MOODS.WISE]: [
      "El silencio también es una decisión 🤫",
      "A veces no comprar es la mejor compra 🧠",
      "La paciencia es virtue... pero hay ofertas! 📚",
    ],
  },
};

export default function useMascotPersonality() {
  const [mood, setMood] = useState(MOODS.HAPPY);
  const [moodEmoji, setMoodEmoji] = useState(MOOD_EMOJIS[MOODS.HAPPY]);
  const [lastDialogue, setLastDialogue] = useState("");
  const [dialogueKey, setDialogueKey] = useState(0);
  const moodTimer = useRef(null);
  const dialogueTimer = useRef(null);

  // Change mood periodically
  useEffect(() => {
    const changeMood = () => {
      const newMood = weightedRandom(MOOD_WEIGHTS);
      setMood(newMood);
      setMoodEmoji(MOOD_EMOJIS[newMood]);
    };

    moodTimer.current = setInterval(changeMood, 45000); // every 45s
    return () => clearInterval(moodTimer.current);
  }, []);

  // Get contextual dialogue
  const getDialogue = useCallback((context = "idle") => {
    const contextDialogues = DIALOGUE[context] || DIALOGUE.idle;
    const moodDialogues = contextDialogues[mood] || contextDialogues[MOODS.HAPPY];
    return pickRandom(moodDialogues);
  }, [mood]);

  // Show dialogue
  const speak = useCallback((context = "idle") => {
    const msg = getDialogue(context);
    setLastDialogue(msg);
    setDialogueKey((k) => k + 1);

    clearTimeout(dialogueTimer.current);
    dialogueTimer.current = setTimeout(() => {
      setLastDialogue("");
    }, 5000);

    return msg;
  }, [getDialogue]);

  // Force specific mood
  const setMoodForce = useCallback((newMood) => {
    if (MOOD_EMOJIS[newMood]) {
      setMood(newMood);
      setMoodEmoji(MOOD_EMOJIS[newMood]);
    }
  }, []);

  return {
    mood,
    moodEmoji,
    lastDialogue,
    dialogueKey,
    speak,
    getDialogue,
    setMood: setMoodForce,
    MOODS,
  };
}
