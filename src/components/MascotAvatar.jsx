"use client";

import React from "react";

function BoxMascot({ size = 64, animate = true, uid = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id={`boxGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      {/* Body */}
      <rect x="20" y="30" width="60" height="50" rx="6" fill={`url(#boxGrad${uid})`} stroke="#D97706" strokeWidth="2" />
      {/* Flap */}
      <path d="M20 30 L50 15 L80 30" fill="#FCD34D" stroke="#D97706" strokeWidth="2" strokeLinejoin="round" />
      {/* Eyes */}
      <ellipse cx="38" cy="50" rx="6" ry="7" fill="white" />
      <ellipse cx="62" cy="50" rx="6" ry="7" fill="white" />
      <circle cx="39" cy="50" r="3" fill="#1F2937">
        {animate && <animate attributeName="cx" values="39;41;39;37;39" dur="3s" repeatCount="indefinite" />}
      </circle>
      <circle cx="63" cy="50" r="3" fill="#1F2937">
        {animate && <animate attributeName="cx" values="63;65;63;61;63" dur="3s" repeatCount="indefinite" />}
      </circle>
      {/* Smile */}
      <path d="M38 62 Q50 72 62 62" stroke="#92400E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Cheeks */}
      <circle cx="30" cy="58" r="4" fill="#FCD34D" opacity="0.6" />
      <circle cx="70" cy="58" r="4" fill="#FCD34D" opacity="0.6" />
      {/* Star on belly */}
      <path d="M50 42 l2 5 5 0.5 -4 3.5 1 5 -4 -2.5 -4 2.5 1 -5 -4 -3.5 5 -0.5z" fill="#FDE68A" />
      {/* Arms */}
      <g>
        <rect x="8" y="45" width="14" height="6" rx="3" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5">
          {animate && <animateTransform attributeName="transform" type="rotate" values="0 14 48;-15 14 48;0 14 48" dur="2s" repeatCount="indefinite" />}
        </rect>
        <rect x="78" y="45" width="14" height="6" rx="3" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5">
          {animate && <animateTransform attributeName="transform" type="rotate" values="0 86 48;15 86 48;0 86 48" dur="2s" repeatCount="indefinite" begin="0.3s" />}
        </rect>
      </g>
      {/* Legs */}
      <rect x="32" y="80" width="8" height="10" rx="4" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5">
        {animate && <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="1.5s" repeatCount="indefinite" />}
      </rect>
      <rect x="60" y="80" width="8" height="10" rx="4" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5">
        {animate && <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="1.5s" repeatCount="indefinite" begin="0.2s" />}
      </rect>
    </svg>
  );
}

function CoinMascot({ size = 64, animate = true, uid = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id={`coinGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="50" cy="50" r="40" fill={`url(#coinGrad${uid})`} stroke="#B45309" strokeWidth="3" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="#D97706" strokeWidth="1.5" strokeDasharray="4 3" />
      {/* Eyes */}
      <ellipse cx="38" cy="44" rx="5" ry="6" fill="white" />
      <ellipse cx="62" cy="44" rx="5" ry="6" fill="white" />
      <circle cx="39" cy="44" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cy" values="44;43;44;45;44" dur="2.5s" repeatCount="indefinite" />}
      </circle>
      <circle cx="63" cy="44" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cy" values="44;43;44;45;44" dur="2.5s" repeatCount="indefinite" />}
      </circle>
      {/* Big smile */}
      <path d="M35 55 Q50 68 65 55" stroke="#92400E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Shine */}
      <ellipse cx="35" cy="32" rx="8" ry="4" fill="white" opacity="0.4" transform="rotate(-30 35 32)" />
      {/* Arms */}
      <g>
        <circle cx="10" cy="50" r="5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5">
          {animate && <animate attributeName="cy" values="50;44;50" dur="1.8s" repeatCount="indefinite" />}
        </circle>
        <circle cx="90" cy="50" r="5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5">
          {animate && <animate attributeName="cy" values="50;44;50" dur="1.8s" repeatCount="indefinite" begin="0.3s" />}
        </circle>
      </g>
      {/* Legs */}
      <rect x="36" y="86" width="7" height="8" rx="3.5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5">
        {animate && <animateTransform attributeName="transform" type="translate" values="0 0;0 -2;0 0" dur="1.2s" repeatCount="indefinite" />}
      </rect>
      <rect x="57" y="86" width="7" height="8" rx="3.5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5">
        {animate && <animateTransform attributeName="transform" type="translate" values="0 0;0 -2;0 0" dur="1.2s" repeatCount="indefinite" begin="0.15s" />}
      </rect>
    </svg>
  );
}

function CartMascot({ size = 64, animate = true, uid = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id={`cartGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
      </defs>
      {/* Cart body */}
      <path d="M25 30 L30 70 L75 70 L80 35 L35 35" fill={`url(#cartGrad${uid})`} stroke="#16A34A" strokeWidth="2" strokeLinejoin="round" />
      {/* Handle */}
      <path d="M15 28 L25 30" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
      {/* Eyes */}
      <ellipse cx="45" cy="48" rx="5" ry="6" fill="white" />
      <ellipse cx="65" cy="48" rx="5" ry="6" fill="white" />
      <circle cx="46" cy="48" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cx" values="46;47;46;45;46" dur="3s" repeatCount="indefinite" />}
      </circle>
      <circle cx="66" cy="48" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cx" values="66;67;66;65;66" dur="3s" repeatCount="indefinite" />}
      </circle>
      {/* Smile */}
      <path d="M44 57 Q55 65 66 57" stroke="#15803D" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Wheels */}
      <circle cx="38" cy="78" r="6" fill="#16A34A" stroke="#15803D" strokeWidth="2">
        {animate && <animateTransform attributeName="transform" type="rotate" values="0 38 78;360 38 78" dur="2s" repeatCount="indefinite" />}
      </circle>
      <circle cx="68" cy="78" r="6" fill="#16A34A" stroke="#15803D" strokeWidth="2">
        {animate && <animateTransform attributeName="transform" type="rotate" values="0 68 78;360 68 78" dur="2s" repeatCount="indefinite" />}
      </circle>
      <circle cx="38" cy="78" r="2" fill="#86EFAC" />
      <circle cx="68" cy="78" r="2" fill="#86EFAC" />
      {/* Arms */}
      <g>
        <rect x="5" y="42" width="18" height="5" rx="2.5" fill="#4ADE80" stroke="#16A34A" strokeWidth="1.5">
          {animate && <animateTransform attributeName="transform" type="rotate" values="0 14 44;-20 14 44;0 14 44" dur="1.5s" repeatCount="indefinite" />}
        </rect>
        <rect x="77" y="42" width="18" height="5" rx="2.5" fill="#4ADE80" stroke="#16A34A" strokeWidth="1.5">
          {animate && <animateTransform attributeName="transform" type="rotate" values="0 86 44;20 86 44;0 86 44" dur="1.5s" repeatCount="indefinite" begin="0.2s" />}
        </rect>
      </g>
    </svg>
  );
}

function CouponMascot({ size = 64, animate = true, uid = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id={`couponGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      {/* Coupon body */}
      <rect x="15" y="35" width="70" height="40" rx="5" fill={`url(#couponGrad${uid})`} stroke="#7C3AED" strokeWidth="2" />
      {/* Scissors cut line */}
      <circle cx="15" cy="55" r="5" fill="#F3E8FF" stroke="#7C3AED" strokeWidth="1.5" />
      <circle cx="85" cy="55" r="5" fill="#F3E8FF" stroke="#7C3AED" strokeWidth="1.5" />
      {/* Dashed line */}
      <line x1="22" y1="55" x2="78" y2="55" stroke="#7C3AED" strokeWidth="1" strokeDasharray="5 3" />
      {/* Top hat */}
      <rect x="35" y="15" width="30" height="18" rx="3" fill="#7C3AED" stroke="#5B21B6" strokeWidth="1.5" />
      <rect x="28" y="31" width="44" height="5" rx="2" fill="#7C3AED" stroke="#5B21B6" strokeWidth="1.5" />
      {/* Hat band */}
      <rect x="35" y="26" width="30" height="4" fill="#C084FC" />
      {/* Eyes */}
      <ellipse cx="38" cy="50" rx="4" ry="5" fill="white" />
      <ellipse cx="62" cy="50" rx="4" ry="5" fill="white" />
      <circle cx="39" cy="50" r="2" fill="#1F2937">
        {animate && <animate attributeName="cx" values="39;40;39;38;39" dur="2.8s" repeatCount="indefinite" />}
      </circle>
      <circle cx="63" cy="50" r="2" fill="#1F2937">
        {animate && <animate attributeName="cx" values="63;64;63;62;63" dur="2.8s" repeatCount="indefinite" />}
      </circle>
      {/* Wink */}
      <path d="M42 60 Q50 66 58 60" stroke="#5B21B6" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Percent symbol */}
      <text x="50" y="44" textAnchor="middle" fill="#EDE9FE" fontSize="10" fontWeight="bold">%</text>
    </svg>
  );
}

function BagMascot({ size = 64, animate = true, uid = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id={`bagGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F9A8D4" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      {/* Bag body */}
      <path d="M25 35 L20 85 L80 85 L75 35 Z" fill={`url(#bagGrad${uid})`} stroke="#DB2777" strokeWidth="2" />
      {/* Handles */}
      <path d="M35 35 Q35 18 50 18 Q65 18 65 35" fill="none" stroke="#DB2777" strokeWidth="3" strokeLinecap="round" />
      {/* Eyes */}
      <ellipse cx="40" cy="52" rx="5" ry="6" fill="white" />
      <ellipse cx="60" cy="52" rx="5" ry="6" fill="white" />
      <circle cx="41" cy="52" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cy" values="52;51;52;53;52" dur="3s" repeatCount="indefinite" />}
      </circle>
      <circle cx="61" cy="52" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cy" values="52;51;52;53;52" dur="3s" repeatCount="indefinite" />}
      </circle>
      {/* Blush */}
      <circle cx="32" cy="58" r="4" fill="#F9A8D4" opacity="0.5" />
      <circle cx="68" cy="58" r="4" fill="#F9A8D4" opacity="0.5" />
      {/* Smile */}
      <path d="M40 64 Q50 72 60 64" stroke="#9D174D" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Heart */}
      <path d="M48 42 C48 40 44 38 44 41 C44 44 48 47 48 47 C48 47 52 44 52 41 C52 38 48 40 48 42Z" fill="#FDE68A" />
    </svg>
  );
}

const MASCOT_COMPONENTS = {
  box: BoxMascot,
  coin: CoinMascot,
  cart: CartMascot,
  coupon: CouponMascot,
  bag: BagMascot,
};

const IMAGE_MASCOTS = {
  bag_b: { front: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604821/mascots/bag_b_front.png", side: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604823/mascots/bag_b_side.png", rear: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604822/mascots/bag_b_rear.png" },
  box_c: { front: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604824/mascots/box_c_front.png", side: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604826/mascots/box_c_side.png", rear: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604825/mascots/box_c_rear.png" },
  cart_a: { front: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604826/mascots/cart_a_front.png", side: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604828/mascots/cart_a_side.png", rear: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604827/mascots/cart_a_rear.png" },
  cart_b: { front: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604829/mascots/cart_b_front.png", side: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604831/mascots/cart_b_side.png", rear: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604830/mascots/cart_b_rear.png" },
  cat_b: { front: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604832/mascots/cat_b_front.png", side: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604834/mascots/cat_b_side.png", rear: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604833/mascots/cat_b_rear.png" },
  rocket_b: { front: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604835/mascots/rocket_b_front.png", side: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604837/mascots/rocket_b_side.png", rear: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604836/mascots/rocket_b_rear.png" },
  coupon_c: { front: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604838/mascots/coupon_c_front.png", side: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604840/mascots/coupon_c_side.png", rear: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604839/mascots/coupon_c_rear.png" },
  cuy_c: { front: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604841/mascots/cuy_c_front.png", side: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604844/mascots/cuy_c_side.png", rear: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604843/mascots/cuy_c_rear.png" },
  dog_c: { front: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604844/mascots/dog_c_front.png", side: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604846/mascots/dog_c_side.png", rear: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604845/mascots/dog_c_rear.png" },
  chicken_b: { front: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604847/mascots/chicken_b_front.png", side: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604848/mascots/chicken_b_side.png", rear: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604847/mascots/chicken_b_rear.png" },
  coin_a: { front: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604849/mascots/coin_a_front.png", side: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604850/mascots/coin_a_side.png", rear: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782604850/mascots/coin_a_rear.png" },
  rooster_b: { front: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782606489/mascots/rooster_b_front.png", side: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782606492/mascots/rooster_b_side.png", rear: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1782606491/mascots/rooster_b_rear.png" },
};

export default function MascotAvatar({ type = "box", size = 64, animate = true, view = "front" }) {
  const uid = React.useId();
  const SvgComponent = MASCOT_COMPONENTS[type];
  if (SvgComponent) {
    return <SvgComponent size={size} animate={animate} uid={uid} />;
  }

  const images = IMAGE_MASCOTS[type];
  if (images) {
    const src = images[view] || images.front;
    if (src) {
      return (
        <img
          src={src}
          alt={`Mascota ${type}`}
          width={size}
          height={size}
          className="object-contain transition-opacity duration-300"
          style={{ width: size, height: size }}
        />
      );
    }
  }

  return <BoxMascot size={size} animate={animate} uid={uid} />;
}

export { MASCOT_COMPONENTS, IMAGE_MASCOTS, BoxMascot, CoinMascot, CartMascot, CouponMascot, BagMascot };
