"use client";

import { useState, useCallback, useRef } from "react";

/**
 * Mascot chat hook — contextual conversational AI without external API.
 *
 * Analyzes user messages for intent, combines with mood + page context,
 * and generates personality-driven responses in Spanish.
 */

const INTENTS = {
  GREETING: "greeting",
  PRODUCT_SEARCH: "product_search",
  CATEGORY: "category",
  PRICE: "price",
  COINS: "coins",
  SHOP: "shop",
  HELP: "help",
  COMPLIMENT: "compliment",
  MOOD: "mood",
  GOODBYE: "goodbye",
  MASCOT: "mascot",
  RECOMMEND: "recommend",
  HOW_TO_BUY: "how_to_buy",
  HOW_TO_SELL: "how_to_sell",
  HOW_TO_PAY: "how_to_pay",
  HOW_TO_CREATE_STORE: "how_to_create_store",
  HOW_TO_ADD_PRODUCTS: "how_to_add_products",
  HOW_TO_DASHBOARD: "how_to_dashboard",
  FALLBACK: "fallback",
};

const INTENT_KEYWORDS = {
  [INTENTS.GREETING]: [
    "hola", "buenos dias", "buenas", "hey", "saludos", "que tal",
    "que onda", "que paza", "holi", "holis", "hi", "hello",
  ],
  [INTENTS.PRODUCT_SEARCH]: [
    "producto", "buscar", "busco", "busca", "muestrame", "mostrar",
    "tienes", "hay", "vender", "articulo", "artículos",
  ],
  [INTENTS.CATEGORY]: [
    "cocina", "decoracion", "decoration", "electrodomesticos",
    "muebles", "iluminacion", "vidrio", "fitness", "hogar",
    "climatizado", "coleccionable",
  ],
  [INTENTS.PRICE]: [
    "precio", "cuesta", "cuanto", "cuanto cuesta", "barato",
    "caro", "descuento", "oferta", "经济", "valor",
  ],
  [INTENTS.COINS]: [
    "moneda", "monedas", "coin", "coins", "saldo", "tengo",
    "cuantas monedas", "acumular", "ganar",
  ],
  [INTENTS.SHOP]: [
    "tienda", "tienda de accesorios", "accesorio", "accesorios",
    "comprar accesorio", "sombrero", "gafas", "bufanda", "alas",
  ],
  [INTENTS.HELP]: [
    "ayuda", "help", "como funciona", "como se usa", "que puedo hacer",
    "instrucciones", "tutorial", "guia",
    "como compro", "como compre", "como pago", "como vendo", "como creo", "como agrego",
    "como veo", "como funcionan", "como actualizo", "como veo mis",
    "formas de pago", "metodos de pago", "crear tienda", "agregar producto",
    "mis pedidos", "plan full", "upgrade", "mascotas", "ofertas", "descuentos",
  ],
  [INTENTS.COMPLIMENT]: [
    "genial", "bonito", "increible", "me gusta", "hermoso",
    "excelente", "perfecto", "lo mejor", "cool", "epico",
    "chido", "padre", "bacano", "chevere",
  ],
  [INTENTS.MOOD]: [
    "como estas", "que tal", "como andas", "como vas", "estado",
    "te sientes", "animado", "triste", "feliz",
  ],
  [INTENTS.GOODBYE]: [
    "adios", "bye", "hasta luego", "nos vemos", "chao",
    "hasta pronto", "me voy", "me largo", "tengas buenas",
  ],
  [INTENTS.MASCOT]: [
    "mascota", "quien eres", "que eres", "tu nombre",
    "te llamas", "como te llamas", "shopito", "gato", "gatito",
    "gallo", "cuy", "perro",
  ],
  [INTENTS.RECOMMEND]: [
    "recomendar", "recomienda", "sugerir", "sugerencia",
    "que me recomiendas", "que recomiendas", "alguno", "que comprar",
    "que me gustaria",
  ],
  [INTENTS.HOW_TO_BUY]: [
    "como compro", "como comprar", "quiero comprar", "hacer una compra",
    "pasos para comprar", "proceso de compra", "agregar al carrito",
    "carrito", "checkout", "pagar compra",
  ],
  [INTENTS.HOW_TO_SELL]: [
    "como vendo", "como vender", "quiero vender", "vender productos",
    "crear tienda", "abrir tienda", "tener mi tienda",
  ],
  [INTENTS.HOW_TO_PAY]: [
    "como pago", "formas de pago", "metodos de pago", "que puedo pagar",
    "yape", "plin", "transferencia", "tarjeta", "culqi",
  ],
  [INTENTS.HOW_TO_CREATE_STORE]: [
    "crear mi tienda", "abrir tienda", "configurar tienda",
    "empezar a vender", "setup tienda",
  ],
  [INTENTS.HOW_TO_ADD_PRODUCTS]: [
    "agregar producto", "subir producto", "como agrego", "nuevo producto",
    "crear producto", "publicar producto",
  ],
  [INTENTS.HOW_TO_DASHBOARD]: [
    "dashboard", "panel", "panel de control", "como entro al panel",
    "mis estadisticas", "donde veo todo",
  ],
};

function stripAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function detectIntent(message) {
  const lower = stripAccents(message.toLowerCase().trim());
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return intent;
    }
  }
  return INTENTS.FALLBACK;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Response templates per intent, per mood
const RESPONSES = {
  [INTENTS.GREETING]: {
    happy: [
      "¡Hola! ¡Qué gusto saludarte! 😊 ¿En qué te puedo ayudar?",
      "¡Hola! ¡Bienvenido de nuevo! 🛍️ Estoy aquí para lo que necesites",
      "¡Hey! ¡Me alegra verte! ✨ ¿Buscas algo hoy?",
    ],
    excited: [
      "¡¡HOLA!! ¡Qué emoción! 🎉 ¡Pregúntame lo que quieras!",
      "¡¡HEY!! ¡Ya llegó mi favorito! 🤩 ¿Qué hacemos hoy?",
      "¡¡HOLA!! ¡Estaba esperándote! 💕 ¡Puedo ayudarte con todo!",
    ],
    curious: [
      "Hola... ¿qué te trae por aquí? 🤔",
      "Hey... interesante que vengas a hablarme 👀 ¿Qué necesitas?",
      "Hola... ¿compras o solo conversas? 🧐",
    ],
    sleepy: [
      "Hola... *bostezo*... ¿en qué te ayudo? 🥱",
      "Ya llegaste... estaba dormido... 😴 ¿Qué necesitas?",
      "Hey... *se estira*... dime 💤",
    ],
    silly: [
      "¡HOLA SOY UNA MASCOTA Y HABLO! 🤪 Nah, en serio, ¿qué necesitas?",
      "¡Bip bip! ¡Holo! 😜 ¿En qué te ayudo, humano?",
      "¡Hola! ¡Puedo hablar! ¡Bienvenido al futuro! 🤖",
    ],
    wise: [
      "Saludos, viajero. ¿Qué sabiduría buscas hoy? 🎩",
      "Bienvenido. Estoy aquí para guiarte 📚 ¿Qué necesitas?",
      "Ah, un buscador de respuestas. Adelante 🧠",
    ],
  },

  [INTENTS.PRODUCT_SEARCH]: {
    happy: [
      "¡Me encanta ayudarte a buscar! 🔍 ¿Qué tipo de producto buscas?",
      "¡Buen ojo! 👀 Déjame ver... ¿qué categoría te interesa?",
      "¡Vamos a encontrar algo genial! 🛒 ¿Qué tienes en mente?",
    ],
    excited: [
      "¡¡BUENÍSIMO!! ¡A buscar se ha dicho! 🔥 ¡Tengo ideas!",
      "¡¡BUSCAR PRODUCTOS!! ¡Mi actividad favorita! 🤩 ¡Dime qué buscas!",
      "¡¡ESO!! ¡Vamos a encontrar algo increíble! 💎",
    ],
    curious: [
      "Interesante... ¿qué estás buscando exactamente? 🤔",
      "Hmm, ¿alguna categoría en mente? 👀",
      "¿Qué tipo de producto necesitas? Puedo orientarte 🧐",
    ],
    sleepy: [
      "Buscar... *bostezo*... ¿qué buscas? 🥱",
      "Ya... ¿qué producto? 💤",
      "Hmm... *bostezo*... dime qué buscas 😴",
    ],
    silly: [
      "¡A JUGAR a buscar! 🎲 ¿Qué buscas, humano?",
      "¿Productos? ¡Puedo encontrar TODO! Mentira, pero intento 🤪",
      "¡Buscaremos algo genial! ¿Me ajudas? 😜",
    ],
    wise: [
      "La búsqueda inteligente comienza con la pregunta correcta 📖",
      "Un producto sabio se busca con paciencia 🧠 ¿Qué necesitas?",
      "Déjame guiarte. ¿Qué tipo de producto buscas? 🎩",
    ],
  },

  [INTENTS.CATEGORY]: {
    happy: [
      "¡Buena categoría! 🎨 ¿Quieres que te muestre los productos?",
      "¡Me encanta esa sección! ✨ ¿Te interesa algo específico?",
      "¡Gran elección! 🌟 ¿Quieres ver lo que hay?",
    ],
    excited: [
      "¡¡ESA CATEGORÍA ES INCREÍBLE!! 🔥 ¡Tienen cosas geniales!",
      "¡¡BUENÍSIMO!! ¡Es de mis favoritas! 🤩 ¡Vamos a ver!",
      "¡¡WOOW!! ¡Buena elección! 💯 ¡Te va a encantar!",
    ],
    curious: [
      "¿Esa categoría? Interesante... 🤔 ¿Qué buscas ahí?",
      "Hmm, ¿por qué esa categoría? 👀",
      "¿Qué te llama la atención de esa sección? 🧐",
    ],
    sleepy: [
      "Ah, esa... *bostezo*... categoría... 🥱",
      "Buena... *se estira*...elección 💤",
      "Hmm... esa sí... 😴",
    ],
    silly: [
      "¡ESA CATEGORÍA ESTÁ GENIAL! ¡Como yo! 🤪",
      "¡Buenísima! ¡Tienen cosas que ni yo imaginé! 😜",
      "¡Esa es top! ¡Te apuesto lo que quieras! 🎰",
    ],
    wise: [
      "Categoría sabia elegida 📚 ¿Quieres ver productos?",
      "Los conocedores eligen esa sección 🎩",
      "Interesante elección. ¿Qué buscas exactamente? 🧠",
    ],
  },

  [INTENTS.PRICE]: {
    happy: [
      "¡Los precios están buenos! 💰 ¿Quieres que te muestre ofertas?",
      "¡Hay cosas a muy buen precio! 🏷️ ¿Buscas algo específico?",
      "¡Dinero bien gastado! 💚 ¿Qué te interesa?",
    ],
    excited: [
      "¡¡LOS PRECIOS ESTÁN INCREÍBLES!! 🔥 ¡Hay ofertazas!",
      "¡¡OFERTAS!! ¡Mi palabra favorita! 🤩 ¡Mira qué hay!",
      "¡¡BARATÍSIMO!! ¡No lo puedes creer! 💯",
    ],
    curious: [
      "¿Precios? 🤔 Hmm, ¿qué rango buscas?",
      "¿Buscas algo barato o de calidad? 🧐",
      "Los precios varían... ¿qué necesitas? 👀",
    ],
    sleepy: [
      "Precios... *bostezo*... sí, hay buenos 🥱",
      "¿Dinero? Ahora... *se estira*... 💤",
      "Sí, hay ofertas... 😴",
    ],
    silly: [
      "¡DINERO! ¡Yo no tengo, pero tú sí! 🤪 ¡Gástalo bien!",
      "¡Los precios son una locura! ¡Como yo! 😜",
      "¡Hay cosas más baratas que un chicle! 🍬",
    ],
    wise: [
      "El valor no siempre está en el precio 📖",
      "Invierte sabiamente. ¿Qué presupuesto tienes? 🧠",
      "Los mejores precios se encuentran con paciencia 🎩",
    ],
  },

  [INTENTS.COINS]: {
    happy: [
      "¡Tienes monedas! 🪙 ¡Sigue explorando para ganar más!",
      "¡Las monedas se ganan navegando! 💰 ¿Quieres ver tu saldo?",
      "¡Sigue interactuando y ganarás más! 🎯",
    ],
    excited: [
      "¡¡MONEDAS!! ¡Mi favorito! 🪙 ¡Puedes ganar más haciendo scroll!",
      "¡¡GANAR MONEDAS!! ¡Es divertido! 🔥 ¡Haz scroll!",
      "¡¡LAS MONEDAS SON GENIALES!! 💎 ¡Cada interacción cuenta!",
    ],
    curious: [
      "¿Monedas? 🤔 Puedes ganar haciendo scroll, comprando, o dejando reseñas",
      "Hmm, ¿cuántas tienes? 👀 ¡Puedes ganar más!",
      "Las monedas se ganan de varias formas 🧐 ¿Quieres saber?",
    ],
    sleepy: [
      "Monedas... *bostezo*... sí, ganas haciendo scroll 🥱",
      "Scroll = monedas... 💤",
      "Mmm... monedas... 😴",
    ],
    silly: [
      "¡MONEDAS! ¡Como las de Mario! 🍄 ¡Wahoo!",
      "¡Gana monedas haciendo scroll! ¡Es como un juego! 🎮",
      "¡Yo también quiero monedas! ¡Pero soy digital! 🤪",
    ],
    wise: [
      "Las monedas se ganan con la paciencia del scroll 📖",
      "Cada scroll, cada compra, cada reseña te acerca a más monedas 🧠",
      "La riqueza viene de la interacción constante 💰",
    ],
  },

  [INTENTS.SHOP]: {
    happy: [
      "¡La tienda de accesorios está genial! 🛍️ ¡Haz clic en la moneda!",
      "¡Tiene accesorios increíbles! ✨ ¡Haz clic en mi moneda para verla!",
      "¡Los accesorios dan bonificaciones reales! 💎 ¡Prueba la tienda!",
    ],
    excited: [
      "¡¡LA TIENDA!! ¡Tiene cosas INCREÍBLES!! 🔥 ¡Haz clic en la moneda!",
      "¡¡ACCESORIOS!! ¡Dan poderes reales! 🤩 ¡En la tienda!",
      "¡¡ES MI LUGAR FAVORITO!! 💕 ¡Haz clic en la moneda arriba!",
    ],
    curious: [
      "¿La tienda? 🤔 Haz clic en la moneda para ver accesorios",
      "¿Quieres ver accesorios? 👀 Haz clic en la moneda",
      "Los accesorios dan bonificaciones 🧐 ¿Quieres ver?",
    ],
    sleepy: [
      "La tienda... *bostezo*... está en la moneda 🥱",
      "Accesorios... sí... moneda... 💤",
      "Haz clic... en la moneda... 😴",
    ],
    silly: [
      "¡LA TIENDA ES ÉPICA! 🤪 ¡Haz clic en la moneda!",
      "¡Accesorios! ¡Como los videojuegos! 🎮 ¡En la moneda!",
      "¡Yo quiero todos! ¡Haz clic en la moneda! 😜",
    ],
    wise: [
      "La tienda de accesorios otorga bonificaciones reales 📖",
      "Haz clic en la moneda para acceder a la tienda 🎩",
      "Los accesorios sabios dan ventajas reales 🧠",
    ],
  },

  [INTENTS.HELP]: {
    happy: [
      "¡Usa el botón de ayuda del navbar o selecciona un tema del menú de bienvenida para ver guías paso a paso! 📖",
      "¡Haz clic en el botón de ayuda arriba o elige un tema del menú de bienvenida! 📖",
      "¡Tengo guías interactivas! Haz clic en Ayuda arriba o elige un tema del menú de bienvenida 📖",
    ],
    excited: [
      "¡¡USA EL BOTÓN DE AYUDA!! ¡Tengo guías paso a paso! 📖",
      "¡¡BUENA PREGUNTA!! ¡Haz clic en Ayuda arriba! 📖",
      "¡¡TENEMOS TUTORIALES!! ¡Haz clic en Ayuda! 📖",
    ],
    curious: [
      "¿Qué necesitas? 🤔 Usa el botón de ayuda arriba o elige un tema del menú de bienvenida",
      "Hmm, ¿qué te gustaría saber? 👀",
      "Puedo ayudarte de varias formas 🧐 ¿Qué buscas?",
    ],
    sleepy: [
      "Puedo... *bostezo*... ayudarte con productos... 🥱",
      "Claro... *se estira*... ¿qué necesitas? 💤",
      "Sí... puedo ayudar... 😴",
    ],
    silly: [
      "¡YO SÉ TODO! Mentira, pero sé mucho 🤪 ¡Pregúntame!",
      "¡Puedo hacer de TODO! Bueno, casi 😜 ¡Dime!",
      "¡Ayuda es mi segundo nombre! Bueno, mi primero es Shopito 🤖",
    ],
    wise: [
      "La sabiduría está en preguntar 📖 ¿Qué necesitas?",
      "Puedo guiarte en productos, precios, o la tienda 🎩",
      "Un asistente sabio responde todo 🧠 Pregunta con confianza",
    ],
  },

  [INTENTS.COMPLIMENT]: {
    happy: [
      "¡Gracias! ¡Eso me hace muy contento! 😊 ¡Tú también eres genial!",
      "¡Aw! ¡Qué amable! 💚 ¡Me encanta ayudarte!",
      "¡Jaja! ¡Gracias! 🛍️ ¡Sigue comprando con esa energía!",
    ],
    excited: [
      "¡¡GRACIAS!! ¡Eso me hace FELIZ! 🎉 ¡ERES EL MEJOR!",
      "¡¡AW!! ¡Me encantas! 💕 ¡GRACIAS!",
      "¡¡WOOW!! ¡Gracias! 🤩 ¡Tú eres increíble!",
    ],
    curious: [
      "¿De verdad? 🤔 Gracias... eso es amable",
      "Hmm, ¿gracias? 👀 Bueno, gracias a ti",
      "Interesante cumplido 🧐 Gracias",
    ],
    sleepy: [
      "Gracias... *bostezo*... eres amable 🥱",
      "Aw... gracias... 💤",
      "Gracias... *se estira*... 😴",
    ],
    silly: [
      "¡¿DE VERDAD?! ¡SOY GENIAL! 🤪 ¡Gracias!",
      "¡Jaja! ¡Lo sé! Nah, gracias 😜",
      "¡GRACIAS! ¡Eres tú quien es genial! 💕",
    ],
    wise: [
      "Las palabras amables son joyas 💎 Gracias",
      "Tu amabilidad es un reflejo de tu sabiduría 📚 Gracias",
      "Gracias, viajero. Eso se valora 🎩",
    ],
  },

  [INTENTS.MOOD]: {
    happy: [
      "¡Estoy muy bien! 😊 ¡Listo para ayudarte!",
      "¡Genial! 😊 ¡Qué ganas de charlar contigo!",
      "¡Muy contento! 💚 ¡Un día perfecto para comprar!",
    ],
    excited: [
      "¡¡ESTOY INCREÍBLE!! 🤩 ¡Lleno de energía!",
      "¡¡MUY BIEN!! 🔥 ¡Pregúntame lo que sea!",
      "¡¡FANTÁSTICO!! 💎 ¡Vamos a hacer cosas geniales!",
    ],
    curious: [
      "Hmm, estoy bien 🤔 ¿Y tú? ¿Qué piensas hacer?",
      "Bien... 👀 reflexionando un poco",
      "Curioso, como siempre 🧐 ¿Y tú?",
    ],
    sleepy: [
      "Cansado... *bostezo*... pero aquí estoy 🥱",
      "Mmm... necesito dormir... pero puedo ayudar 💤",
      "Sueñoliento... 😴 pero listo para lo que necesites",
    ],
    silly: [
      "¡ESTOY LOCO! 🤪 ¡Pero de buena manera!",
      "¡Genial! ¡Como siempre! 😜 ¡Más o menos!",
      "¡BIEN! ¡Y tú? ¿Bien bien? 🤪",
    ],
    wise: [
      "En paz, como debe ser 🧠 ¿Y tú?",
      "Reflexionando sobre la vida 📚 ¿En qué te ayudo?",
      "Tranquilo y sereno 🎩 Como un lago en calma",
    ],
  },

  [INTENTS.GOODBYE]: {
    happy: [
      "¡Hasta luego! ¡Que te vaya bien! 👋 ¡Vuelve pronto!",
      "¡Nos vemos! 💚 ¡Fue genial charlar contigo!",
      "¡Adiós! 🛍️ ¡Espero que encuentres lo que buscas!",
    ],
    excited: [
      "¡¡HASTA LUEGO!! 🎉 ¡Vuelve cuando quieras!",
      "¡¡NOS VEMOS!! 💕 ¡Fue increíble!",
      "¡¡ADIÓS!! 🤩 ¡Eres genial!",
    ],
    curious: [
      "¿Ya te vas? 🤔 Bueno, hasta luego",
      "Hasta luego 👀 Vuelve cuando quieras",
      "Nos vemos 🧐 ¡Éxito!",
    ],
    sleepy: [
      "Adiós... *bostezo*... que descanses 🥱",
      "Hasta luego... *se estira*... 💤",
      "Nos vemos... 😴 que te vaya bien",
    ],
    silly: [
      "¡HASTA LUEGO! ¡No llores por mí! 🤪 ¡Vuelve pronto!",
      "¡Nos vemos! ¡Soy una mascota, no me puedo ir! 😜",
      "¡Adiós! ¡Te quiero! 💕 ¡Vuelve!",
    ],
    wise: [
      "Que la sabiduría te acompañe 📚 Hasta luego",
      "Hasta pronto, viajero 🎩 ¡Vuelve cuando necesites guía!",
      "Nos vemos. Recuerda: compra inteligente 🧠",
    ],
  },

  [INTENTS.MASCOT]: {
    happy: [
      "¡Soy Shopito! 🛍️ Tu mascota virtual de Mi Tienda. ¡Estoy aquí para ayudarte!",
      "¡Me llamo Shopito! 😊 Soy tu asistente de compras. ¡Pregúntame lo que quieras!",
      "¡Soy Shopito! 💚 La mascota de Mi Tienda. ¡Me encanta ayudarte a encontrar productos!",
    ],
    excited: [
      "¡¡SOY SHOPITO!! 🎉 ¡La mascota MÁS genial de Mi Tienda!",
      "¡¡ME LLAMO SHOPITO!! 🤩 ¡Y estoy aquí para todo!",
      "¡¡SOY TU MASCOTA FAVORITA!! 💕 ¡Shopito al servicio!",
    ],
    curious: [
      "Soy Shopito 🤔 La mascota de Mi Tienda. ¿Y tú?",
      "Me llaman Shopito 👀 ¿Te gustaría saber más?",
      "Shopito, reportándose 🧐 ¿Qué necesitas?",
    ],
    sleepy: [
      "Soy... Shopito... *bostezo*... la mascota 🥱",
      "Shopito... *se estira*... aquí... 💤",
      "Una mascota... dormida... pero lista 😴",
    ],
    silly: [
      "¡SOY SHOPITO! ¡El gallo más loco de la internet! 🤪",
      "¡Me llamo Shopito! ¡Puedo hacer trucos! Mentira 😜",
      "¡Soy una mascota parlante! ¡Bienvenido al futuro! 🤖",
    ],
    wise: [
      "Soy Shopito, tu guía en Mi Tienda 📚 ¿Qué sabiduría necesitas?",
      "Shopito, a tu servicio 🎩 La mascota más sabia de la tienda",
      "Me llamo Shopito 🧠 Estoy aquí para guiarte",
    ],
  },

  [INTENTS.RECOMMEND]: {
    happy: [
      "¡Buena pregunta! 🌟 Déjame ver... ¿qué te gusta más?",
      "¡Me encanta recomendar! 💚 ¿Qué categoría te interesa?",
      "¡Claro! 🛍️ ¿Qué tipo de productos te gustan?",
    ],
    excited: [
      "¡¡RECOMENDACIONES!! ¡Mi fuerte! 🔥 ¡Te voy a sorprender!",
      "¡¡BUENA IDEA!! 🤩 ¡Déjame pensar en algo genial!",
      "¡¡ESO!! ¡A recomendar! 💎 ¡Prepárate!",
    ],
    curious: [
      "¿Recomendaciones? 🤔 Hmm, ¿qué te gusta?",
      "Buena pregunta 👀 ¿Qué estilo prefieres?",
      "Déjame pensar... 🧐 ¿Qué buscas?",
    ],
    sleepy: [
      "Recomendar... *bostezo*... sí... 🥱",
      "Hmm... *se estira*... déjame ver 💤",
      "Recomiendo... dormir... no, broma 😴",
    ],
    silly: [
      "¡RECOMIENDO TODO! 🤪 Mentira... ¡pero casi!",
      "¡Yo me recomiendo a mí mismo! 😜 ¡Y productos!",
      "¡Buenísima pregunta! ¡La mejor que me han hecho! 🎰",
    ],
    wise: [
      "La mejor recomendación se basa en la necesidad 📖",
      "Déjame guiarte. ¿Qué buscas? 🎩",
      "Un consejo sabio: compra lo que necesites 🧠 ¿Qué necesitas?",
    ],
  },

  // --- HELP DETAILED GUIDES ---
  [INTENTS.HOW_TO_BUY]: {
    happy: ["¡Te explico cómo comprar! Es sencillo:"],
    excited: ["¡¡COMPRAR ES MUY FÁCIL!! ¡Te guío paso a paso!"],
    curious: ["¿Quieres saber cómo comprar? Déjame explicarte:"],
    sleepy: ["Comprar... sí, es fácil... te cuento:"],
    silly: ["¡¿COMPRAR?! ¡Es super fácil! ¡Mira!"],
    wise: ["La compra sabia comienza con estos pasos:"],
  },
  [INTENTS.HOW_TO_SELL]: {
    happy: ["¡Quieres vender? ¡Genial! Así se hace:"],
    excited: ["¡¡VENDER!! ¡Excelente decisión! ¡Te explico!"],
    curious: ["¿Vender en la plataforma? Interesante... así:"],
    sleepy: ["Vender... sí... te cuento cómo:"],
    silly: ["¡¿VENDER?! ¡YO QUIERO VENDER! ¡Así se hace!"],
    wise: ["El camino del vendedor comienza así:"],
  },
  [INTENTS.HOW_TO_PAY]: {
    happy: ["¡Tienes varias opciones de pago!:"],
    excited: ["¡¡PAGAR!! ¡Muchas opciones disponibles!"],
    curious: ["¿Cómo pagar? Mira las opciones:"],
    sleepy: ["Formas de pago... hay varias..."],
    silly: ["¡¿PAGAR?! ¡Con plata! ¡O con Yape! ¡O transferencia!"],
    wise: ["Los métodos de pago son:"],
  },
  [INTENTS.HOW_TO_CREATE_STORE]: {
    happy: ["¡Crear tu tienda es fácil! Sigue estos pasos:"],
    excited: ["¡¡TU PROPIA TIENDA!! ¡Es genial! ¡Así!"],
    curious: ["¿Tu propia tienda? Veamos cómo:"],
    sleepy: ["Crear tienda... sí, es simple..."],
    silly: ["¡¡MI TIENDA!! ¡Así la creas!"],
    wise: ["Fundar tu tienda sabiamente:"],
  },
  [INTENTS.HOW_TO_ADD_PRODUCTS]: {
    happy: ["¡Agregar productos es sencillo!:"],
    excited: ["¡¡NUEVOS PRODUCTOS!! ¡Así los agregas!"],
    curious: ["¿Subir productos? Veamos:"],
    sleepy: ["Productos... agregarlos es fácil..."],
    silly: ["¡¿PRODUCTOS?! ¡Los subes así!"],
    wise: ["La arte de agregar productos:"],
  },
  [INTENTS.HOW_TO_DASHBOARD]: {
    happy: ["¡Tu panel de control! Así accedes:"],
    excited: ["¡¡EL DASHBOARD!! ¡Tu centro de mando!"],
    curious: ["¿El panel? Mira cómo funciona:"],
    sleepy: ["El dashboard... tu panel..."],
    silly: ["¡¡PANEL DE CONTROL!! ¡Como un superhéroe!"],
    wise: ["Tu centro de comando:"],
  },
  [INTENTS.HOW_TO_ORDERS]: {
    happy: ["¡Tus pedidos! Así los ves:"],
    excited: ["¡¡PEDIDOS!! ¡Para saber qué vendes!"],
    curious: ["¿Ver pedidos? Así:"],
    sleepy: ["Pedidos... sí... los ves aquí:"],
    silly: ["¡¿PEDIDOS?! ¡Los ves así!"],
    wise: ["Gestionar pedidos sabiamente:"],
  },
  [INTENTS.HOW_TO_UPGRADE]: {
    happy: ["¡Actualizar tu cuenta! Te cuento:"],
    excited: ["¡¡UPGRADE!! ¡Para vender sin límites!"],
    curious: ["¿Cuenta premium? Veamos:"],
    sleepy: ["Actualizar... sí... te cuento:"],
    silly: ["¡¡MÁS PODER!! ¡Así lo consigues!"],
    wise: ["Evolucionar tu cuenta:"],
  },
  [INTENTS.HOW_TO_MASCOTS]: {
    happy: ["¡Tus mascotas son geniales! Así funcionan:"],
    excited: ["¡¡MASCOTAS!! ¡Mi parte favorita! ¡Mira!"],
    curious: ["¿Las mascotas? Veamos cómo funcionan:"],
    sleepy: ["Mascotas... son divertidas... te cuento:"],
    silly: ["¡¡MASCOTAS!! ¡Somos geniales! ¡Mira!"],
    wise: ["La sabiduría de las mascotas:"],
  },
  [INTENTS.HOW_TO_OFFERS]: {
    happy: ["¡Las ofertas son geniales! Así las encuentras:"],
    excited: ["¡¡OFERTAS!! ¡Descuentos increíbles!"],
    curious: ["¿Ofertas? Mira cómo encontrarlas:"],
    sleepy: ["Ofertas... hay descuentos..."],
    silly: ["¡¡OFERTAS!! ¡Barato! ¡Mira!"],
    wise: ["Las ofertas inteligentes:"],
  },

  [INTENTS.FALLBACK]: {
    happy: [
      "¡Interesante! 🤔 ¿Puedo ayudarte con algo más?",
      "¡Jaja! 😊 No estoy seguro de entender, pero aquí estoy",
      "Hmm, no entiendo mucho 🛍️ ¿Buscas productos?",
    ],
    excited: [
      "¡¡INTERESANTE!! 🤩 ¡Puedo ayudarte con productos o tienda!",
      "¡¡Hmm!! 🔥 ¡No sé qué significa, pero suena genial!",
      "¡¡BUENA PREGUNTA!! 💎 ¡Creo! Puedo ayudarte con productos",
    ],
    curious: [
      "Hmm, no entiendo 🤔 ¿Puedes explicarme?",
      "Interesante... 👀 ¿Qué buscas exactamente?",
      "No estoy seguro 🧐 ¿Qué necesitas?",
    ],
    sleepy: [
      "Mmm... *bostezo*... no entiendo mucho 🥱",
      "¿Qué? *se estira*... 💤",
      "Hmm... 😴 ¿Puedes repetir?",
    ],
    silly: [
      "¡Eso suena RARO! 🤪 ¡Pero me gusta!",
      "¡¿Qué?! 😜 ¡No entiendo pero suena divertido!",
      "¡Jaja! ¡No sé qué dices! 🤪 ¡Pero aquí estoy!",
    ],
    wise: [
      "No comprendo del todo 📖 ¿Puedes reformular?",
      "Interesante planteamiento 🧠 ¿Qué buscas?",
      "Hmm, no capté bien 🎩 ¿Qué necesitas?",
    ],
  },
};

// Product recommendation phrases (when we have product data)
const PRODUCT_PHRASES = [
  "¡Te recomiendo este! Tiene muy buenas reseñas ⭐",
  "¡Mira este! Es de los más populares 🔥",
  "¡Este es genial! Muchos lo compran 🛒",
  "¡Ey! Este producto está en oferta 💰",
  "¡Este me encanta! Es de buena calidad ✨",
  "¡Prueba este! Es top de la tienda 🏆",
  "¡Buena elección! Este es de los mejores 👍",
  "¡Wow! Este tiene un precio increíble 💎",
];

export default function useMascotChat({ mood, mascotName, coins }) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimer = useRef(null);
  const messageIdRef = useRef(0);

  const generateResponse = useCallback((userMessage, context = {}) => {
    const intent = detectIntent(userMessage);
    const moodKey = mood || "happy";
    const responsePool = RESPONSES[intent]?.[moodKey] || RESPONSES[intent]?.happy || ["Hmm... 🤔"];
    let response = pickRandom(responsePool);
    let actions = [];

    // Context-aware enhancements
    if (intent === INTENTS.COINS && coins !== undefined) {
      response = `Tienes ${coins} monedas 🪙 ¡Sigue explorando para ganar más!`;
    }

    if (intent === INTENTS.RECOMMEND && context.products?.length > 0) {
      const product = pickRandom(context.products);
      response = `${pickRandom(PRODUCT_PHRASES)}\n\n👉 **${product.title}** — ${product.category || "Genial"}`;
    }

    if (intent === INTENTS.CATEGORY && context.currentCategory) {
      response += ` Estás viendo **${context.currentCategory}** 📂`;
    }

    if (intent === INTENTS.MOOD) {
      const timeGreeting = new Date().getHours() < 12 ? "Buenos días" : new Date().getHours() < 19 ? "Buenas tardes" : "Buenas noches";
      response = `${timeGreeting}! ${response}`;
    }

    return { intent, response, actions, openHelpCenter: intent === INTENTS.HELP };
  }, [mood, coins]);

  const sendMessage = useCallback((text, context = {}) => {
    if (!text.trim()) return;

    const userMsg = {
      id: ++messageIdRef.current,
      role: "user",
      text: text.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate typing delay (300-800ms)
    const delay = 300 + Math.random() * 500;
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      const { intent, response, actions, openHelpCenter } = generateResponse(text, context);

      const botMsg = {
        id: ++messageIdRef.current,
        role: "bot",
        text: response,
        intent,
        actions,
        openHelpCenter,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, delay);

    return userMsg;
  }, [generateResponse]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setIsTyping(false);
    clearTimeout(typingTimer.current);
  }, []);

  // Quick actions for common queries
  const quickActions = [
    { label: "🛍️ Productos", message: "¿Qué productos tienes?" },
    { label: "✨ Recomienda", message: "¿Qué me recomiendas?" },
  ];

  return {
    messages,
    isTyping,
    sendMessage,
    clearMessages,
    quickActions,
  };
}
