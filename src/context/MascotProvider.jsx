"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import mascotEngine from "@/lib/mascot/MascotEngine";
import mascotEvents, { MascotEventTypes } from "@/lib/mascot/MascotEvents";
import { MascotEmotion } from "@/lib/mascot/MascotEmotion";

const MascotContext = createContext(null);

export function useMascotContext() {
  return useContext(MascotContext);
}

const EMOTION_MESSAGES = {
  [MascotEmotion.HAPPY]: [
    "¡Me encanta estar aquí contigo! 😊",
    "¡Qué alegría verte! 🎉",
    "¡Hoy es un gran día para comprar! 🛍️",
  ],
  [MascotEmotion.EXCITED]: [
    "¡¡¡Esto es INCREÍBLE!!! 🤩",
    "¡No puedo contener mi emoción! 🎊",
    "¡Hay cosas geniales aquí! ✨",
  ],
  [MascotEmotion.PROUD]: [
    "¡Estoy muy orgulloso de ti! 🏆",
    "¡Lo estás haciendo genial! 💪",
    "¡Sigue así, campeón! 🥇",
  ],
  [MascotEmotion.CELEBRATING]: [
    "¡FELICIDADES! 🎉🎊",
    "¡Lo lograste! ¡Gran trabajo! 🏅",
    "¡Vamos a celebrar! 🥳",
  ],
  [MascotEmotion.LOVE]: [
    "¡Te quiero mucho! 💖",
    "¡Eres especial! 💝",
    "¡Gracias por estar aquí! ❤️",
  ],
  [MascotEmotion.GREETING]: [
    "¡Hola! ¿Cómo estás? 👋",
    "¡Bienvenido de nuevo! 🤗",
    "¡Qué gusto verte! 😄",
  ],
  [MascotEmotion.CURIOUS]: [
    "¿Qué hay de nuevo? 🤔",
    "Hmm, eso se ve interesante... 👀",
    "¿Qué me recomiendas? 🧐",
  ],
  [MascotEmotion.THINKING]: [
    "Déjame pensar... 🤔",
    "Hmm, quéDecisión tomar... 💭",
    "Estoy analizando las opciones... 🧠",
  ],
  [MascotEmotion.SURPRISED]: [
    "¡Wow! ¡No me lo esperaba! 😲",
    "¡Qué sorpresa! 😱",
    "¡Increíble! 🤯",
  ],
  [MascotEmotion.SLEEPY]: [
    "Bostezo... 😴",
    "Estoy un poco cansado... 💤",
    "Necesito una siesta... 🥱",
  ],
  [MascotEmotion.SAD]: [
    "Me siento un poco triste... 😢",
    "Ojalá alguien me abrace... 🥺",
    "Necesito un poco de ánimo... 💔",
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function MascotProvider({ children }) {
  const [emotion, setEmotion] = useState(MascotEmotion.IDLE);
  const [lastMessage, setLastMessage] = useState("");
  const [emotionMessageKey, setEmotionMessageKey] = useState(0);
  const idleTimerRef = useRef(null);
  const lastEmotionRef = useRef(MascotEmotion.IDLE);

  useEffect(() => {
    if (!mascotEngine.isInitialized()) {
      mascotEngine.initialize();
    }

    const unsubEmotion = mascotEvents.on(
      MascotEventTypes.EMOTION_CHANGED,
      (newEmotion) => {
        setEmotion(newEmotion);
        lastEmotionRef.current = newEmotion;

        const messages = EMOTION_MESSAGES[newEmotion];
        if (messages && Math.random() > 0.4) {
          setLastMessage(pickRandom(messages));
          setEmotionMessageKey((k) => k + 1);

          clearTimeout(idleTimerRef.current);
          idleTimerRef.current = setTimeout(() => {
            setLastMessage("");
          }, 5000);
        }
      }
    );

    const unsubInteraction = mascotEvents.on(
      MascotEventTypes.USER_INTERACTION,
      () => {
        mascotEngine.getBrain()?.interact();
      }
    );

    const unsubOrderPaid = mascotEvents.on(
      MascotEventTypes.ORDER_PAID,
      () => {
        mascotEngine.emit(MascotEventTypes.ORDER_PAID);
      }
    );

    const unsubProductCreated = mascotEvents.on(
      MascotEventTypes.PRODUCT_CREATED,
      () => {
        mascotEngine.emit(MascotEventTypes.PRODUCT_CREATED);
      }
    );

    const unsubAchievement = mascotEvents.on(
      MascotEventTypes.ACHIEVEMENT_UNLOCKED,
      () => {
        mascotEngine.emit(MascotEventTypes.ACHIEVEMENT_UNLOCKED);
      }
    );

    return () => {
      unsubEmotion();
      unsubInteraction();
      unsubOrderPaid();
      unsubProductCreated();
      unsubAchievement();
      clearTimeout(idleTimerRef.current);
    };
  }, []);

  const triggerEmotion = useCallback((eventName, payload = null) => {
    mascotEngine.emit(eventName, payload);
  }, []);

  const triggerInteraction = useCallback(() => {
    mascotEvents.emit(MascotEventTypes.USER_INTERACTION);
  }, []);

  const value = {
    emotion,
    lastMessage,
    emotionMessageKey,
    triggerEmotion,
    triggerInteraction,
    MascotEventTypes,
  };

  return (
    <MascotContext.Provider value={value}>
      {children}
    </MascotContext.Provider>
  );
}
