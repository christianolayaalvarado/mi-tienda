export const CELEBRATIONS = {
  fiestas_patrias: {
    id: "fiestas_patrias",
    name: "Fiestas Patrias",
    emoji: "🇵🇪",
    cardImage: "/escarapela.png",
    bannerImage: "/escarapela.png",
    bannerTitle: "FIESTAS PATRIAS",
    bannerSubtitle: "Ofertas especiales por semana patria",
    bannerGradient: "linear-gradient(135deg, #C8102E 0%, #8B0000 40%, #C8102E 70%, #fff 100%)",
    bannerTextColor: "#fff",
    bannerLink: "/ofertas",
    mascotImage: "/escarapela.png",
    mascotLabel: "Escarapela + Banda",
    mascotGradient: "from-red-50 to-white",
    mascotBorder: "border-red-200",
    dateStart: { month: 6, day: 28 },
    dateEnd: { month: 6, day: 31 },
  },
  cancion_criolla: {
    id: "cancion_criolla",
    name: "Día de la Canción Criolla",
    emoji: "🎸",
    cardImage: "/celebrations/guitarra.svg",
    bannerImage: "/celebrations/guitarra.svg",
    bannerTitle: "CANCIÓN CRIOLLA",
    bannerSubtitle: "Música, tradición y ofertas especiales",
    bannerGradient: "linear-gradient(135deg, #5C3317 0%, #8B4513 40%, #D2691E 70%, #FFF8DC 100%)",
    bannerTextColor: "#fff",
    bannerLink: "/ofertas",
    mascotImage: "/celebrations/guitarra.svg",
    mascotLabel: "Guitarra Criolla",
    mascotGradient: "from-amber-50 to-orange-50",
    mascotBorder: "border-amber-200",
    dateStart: { month: 9, day: 28 },
    dateEnd: { month: 9, day: 31 },
  },
  navidad: {
    id: "navidad",
    name: "Navidad",
    emoji: "🎄",
    cardImage: "/celebrations/estrella.svg",
    bannerImage: "/celebrations/estrella.svg",
    bannerTitle: "NAVIDAD",
    bannerSubtitle: "Regalos y ofertas navideñas para todos",
    bannerGradient: "linear-gradient(135deg, #1a5f2a 0%, #c41e3a 50%, #1a5f2a 100%)",
    bannerTextColor: "#fff",
    bannerLink: "/ofertas",
    mascotImage: "/celebrations/estrella.svg",
    mascotLabel: "Estrella Navideña",
    mascotGradient: "from-green-50 to-red-50",
    mascotBorder: "border-green-200",
    dateStart: { month: 11, day: 15 },
    dateEnd: { month: 11, day: 31 },
  },
};

export const CELEBRATION_LIST = Object.values(CELEBRATIONS);

export function isCelebrationInSeason(celebration) {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  const { dateStart, dateEnd } = celebration;
  if (month === dateStart.month && day >= dateStart.day) return true;
  if (month === dateEnd.month && day <= dateEnd.day) return true;
  if (dateStart.month !== dateEnd.month) {
    if (month > dateStart.month && month < dateEnd.month) return true;
  }
  return false;
}

export function getActiveCelebration() {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("activeCelebration");
    if (stored && CELEBRATIONS[stored]) return CELEBRATIONS[stored];
  } catch {}
  for (const c of CELEBRATION_LIST) {
    if (isCelebrationInSeason(c)) return c;
  }
  return null;
}
