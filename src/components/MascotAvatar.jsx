"use client";

import React from "react";
import MascotAnimationController from "@/components/mascot/MascotAnimationController";

function BoxMascot({ size = 64, animate = true, uid = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id={`boxGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <rect x="20" y="30" width="60" height="50" rx="6" fill={`url(#boxGrad${uid})`} stroke="#D97706" strokeWidth="2" />
      <path d="M20 30 L50 15 L80 30" fill="#FCD34D" stroke="#D97706" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="38" cy="50" rx="6" ry="7" fill="white" />
      <ellipse cx="62" cy="50" rx="6" ry="7" fill="white" />
      <circle cx="39" cy="50" r="3" fill="#1F2937">
        {animate && <animate attributeName="cx" values="39;41;39;37;39" dur="3s" repeatCount="indefinite" />}
      </circle>
      <circle cx="63" cy="50" r="3" fill="#1F2937">
        {animate && <animate attributeName="cx" values="63;65;63;61;63" dur="3s" repeatCount="indefinite" />}
      </circle>
      <path d="M38 62 Q50 72 62 62" stroke="#92400E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="58" r="4" fill="#FCD34D" opacity="0.6" />
      <circle cx="70" cy="58" r="4" fill="#FCD34D" opacity="0.6" />
      <path d="M50 42 l2 5 5 0.5 -4 3.5 1 5 -4 -2.5 -4 2.5 1 -5 -4 -3.5 5 -0.5z" fill="#FDE68A" />
      <g>
        <rect x="8" y="45" width="14" height="6" rx="3" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5">
          {animate && <animateTransform attributeName="transform" type="rotate" values="0 14 48;-15 14 48;0 14 48" dur="2s" repeatCount="indefinite" />}
        </rect>
        <rect x="78" y="45" width="14" height="6" rx="3" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5">
          {animate && <animateTransform attributeName="transform" type="rotate" values="0 86 48;15 86 48;0 86 48" dur="2s" repeatCount="indefinite" begin="0.3s" />}
        </rect>
      </g>
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
      <circle cx="50" cy="50" r="40" fill={`url(#coinGrad${uid})`} stroke="#B45309" strokeWidth="3" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="#D97706" strokeWidth="1.5" strokeDasharray="4 3" />
      <ellipse cx="38" cy="44" rx="5" ry="6" fill="white" />
      <ellipse cx="62" cy="44" rx="5" ry="6" fill="white" />
      <circle cx="39" cy="44" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cy" values="44;43;44;45;44" dur="2.5s" repeatCount="indefinite" />}
      </circle>
      <circle cx="63" cy="44" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cy" values="44;43;44;45;44" dur="2.5s" repeatCount="indefinite" />}
      </circle>
      <path d="M35 55 Q50 68 65 55" stroke="#92400E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="35" cy="32" rx="8" ry="4" fill="white" opacity="0.4" transform="rotate(-30 35 32)" />
      <g>
        <circle cx="10" cy="50" r="5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5">
          {animate && <animate attributeName="cy" values="50;44;50" dur="1.8s" repeatCount="indefinite" />}
        </circle>
        <circle cx="90" cy="50" r="5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5">
          {animate && <animate attributeName="cy" values="50;44;50" dur="1.8s" repeatCount="indefinite" begin="0.3s" />}
        </circle>
      </g>
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
      <path d="M25 30 L30 70 L75 70 L80 35 L35 35" fill={`url(#cartGrad${uid})`} stroke="#16A34A" strokeWidth="2" strokeLinejoin="round" />
      <path d="M15 28 L25 30" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="45" cy="48" rx="5" ry="6" fill="white" />
      <ellipse cx="65" cy="48" rx="5" ry="6" fill="white" />
      <circle cx="46" cy="48" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cx" values="46;47;46;45;46" dur="3s" repeatCount="indefinite" />}
      </circle>
      <circle cx="66" cy="48" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cx" values="66;67;66;65;66" dur="3s" repeatCount="indefinite" />}
      </circle>
      <path d="M44 57 Q55 65 66 57" stroke="#15803D" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="38" cy="78" r="6" fill="#16A34A" stroke="#15803D" strokeWidth="2">
        {animate && <animateTransform attributeName="transform" type="rotate" values="0 38 78;360 38 78" dur="2s" repeatCount="indefinite" />}
      </circle>
      <circle cx="68" cy="78" r="6" fill="#16A34A" stroke="#15803D" strokeWidth="2">
        {animate && <animateTransform attributeName="transform" type="rotate" values="0 68 78;360 68 78" dur="2s" repeatCount="indefinite" />}
      </circle>
      <circle cx="38" cy="78" r="2" fill="#86EFAC" />
      <circle cx="68" cy="78" r="2" fill="#86EFAC" />
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
      <rect x="15" y="35" width="70" height="40" rx="5" fill={`url(#couponGrad${uid})`} stroke="#7C3AED" strokeWidth="2" />
      <circle cx="15" cy="55" r="5" fill="#F3E8FF" stroke="#7C3AED" strokeWidth="1.5" />
      <circle cx="85" cy="55" r="5" fill="#F3E8FF" stroke="#7C3AED" strokeWidth="1.5" />
      <line x1="22" y1="55" x2="78" y2="55" stroke="#7C3AED" strokeWidth="1" strokeDasharray="5 3" />
      <rect x="35" y="15" width="30" height="18" rx="3" fill="#7C3AED" stroke="#5B21B6" strokeWidth="1.5" />
      <rect x="28" y="31" width="44" height="5" rx="2" fill="#7C3AED" stroke="#5B21B6" strokeWidth="1.5" />
      <rect x="35" y="26" width="30" height="4" fill="#C084FC" />
      <ellipse cx="38" cy="50" rx="4" ry="5" fill="white" />
      <ellipse cx="62" cy="50" rx="4" ry="5" fill="white" />
      <circle cx="39" cy="50" r="2" fill="#1F2937">
        {animate && <animate attributeName="cx" values="39;40;39;38;39" dur="2.8s" repeatCount="indefinite" />}
      </circle>
      <circle cx="63" cy="50" r="2" fill="#1F2937">
        {animate && <animate attributeName="cx" values="63;64;63;62;63" dur="2.8s" repeatCount="indefinite" />}
      </circle>
      <path d="M42 60 Q50 66 58 60" stroke="#5B21B6" strokeWidth="2" fill="none" strokeLinecap="round" />
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
      <path d="M25 35 L20 85 L80 85 L75 35 Z" fill={`url(#bagGrad${uid})`} stroke="#DB2777" strokeWidth="2" />
      <path d="M35 35 Q35 18 50 18 Q65 18 65 35" fill="none" stroke="#DB2777" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="40" cy="52" rx="5" ry="6" fill="white" />
      <ellipse cx="60" cy="52" rx="5" ry="6" fill="white" />
      <circle cx="41" cy="52" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cy" values="52;51;52;53;52" dur="3s" repeatCount="indefinite" />}
      </circle>
      <circle cx="61" cy="52" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cy" values="52;51;52;53;52" dur="3s" repeatCount="indefinite" />}
      </circle>
      <circle cx="32" cy="58" r="4" fill="#F9A8D4" opacity="0.5" />
      <circle cx="68" cy="58" r="4" fill="#F9A8D4" opacity="0.5" />
      <path d="M40 64 Q50 72 60 64" stroke="#9D174D" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M48 42 C48 40 44 38 44 41 C44 44 48 47 48 47 C48 47 52 44 52 41 C52 38 48 40 48 42Z" fill="#FDE68A" />
    </svg>
  );
}

// === PREMIUM MASCOTS: rendered from local PNG files via IMAGE_MASCOTS ===

const MASCOT_COMPONENTS = {
  box: BoxMascot,
  coin: CoinMascot,
  cart: CartMascot,
  coupon: CouponMascot,
  bag: BagMascot,
};

const IMAGE_MASCOTS = {
  box_c: { front: "/mascots/box_c/caja_front.png", side: "/mascots/box_c/caja_side.png", rear: "/mascots/box_c/caja_rear.png" },
  coin_a: { front: "/mascots/coin_a/moneda_front.png", side: "/mascots/coin_a/moneda_side.png", rear: "/mascots/coin_a/moneda_rear.png" },
  cart_a: { front: "/mascots/cart_a/carritoazul_front.png", side: "/mascots/cart_a/carritoazul_side.png", rear: "/mascots/cart_a/carritoazul_rear.png" },
  cart_b: { front: "/mascots/cart_b/carritorojo_front.png", side: "/mascots/cart_b/carritorojo_side.png", rear: "/mascots/cart_b/carritorojo_rear.png" },
  coupon_c: { front: "/mascots/coupon_c/cupon_front.png", side: "/mascots/coupon_c/cupon_side.png", rear: "/mascots/coupon_c/cupon_rear.png" },
  bag_b: { front: "/mascots/bag_b/bolsa_front.png", side: "/mascots/bag_b/bolsa_side.png", rear: "/mascots/bag_b/bolsa_rear.png" },
  rocket_b: { front: "/mascots/rocket_b/Cohete_front.png", side: "/mascots/rocket_b/Cohete_side.png", rear: "/mascots/rocket_b/Cohete_rear.png" },
  dog_c: { front: "/mascots/dog_c/dog_front.png", side: "/mascots/dog_c/dog_side.png", rear: "/mascots/dog_c/dog_rear.png" },
  cat_b: { front: "/mascots/cat_b/cat_front.png", side: "/mascots/cat_b/cat_side.png", rear: "/mascots/cat_b/cat_rear.png" },
  chicken_b: { front: "/mascots/chicken_b/pollo_front.png", side: "/mascots/chicken_b/pollo_side.png", rear: "/mascots/chicken_b/pollo_rear.png" },
  rooster_b: { front: "/mascots/rooster_b/Gallo_front.png", side: "/mascots/rooster_b/Gallo_side.png", rear: "/mascots/rooster_b/Gallo_rear.png" },
  cuy_c: { front: "/mascots/cuy_c/cuy_front.png", side: "/mascots/cuy_c/cuy_side.png", rear: "/mascots/cuy_c/cuy_rear.png" },
};

function PremiumMascotImg({ type, src, size }) {
  const [failed, setFailed] = React.useState(false);
  const uid = React.useId();

  if (failed) {
    return <BoxMascot size={size} animate uid={uid} />;
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={src}
        alt={`Mascota ${type}`}
        draggable={false}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export default function MascotAvatar({ type = "box", size = 64, animate = true, view = "front" }) {
  const uid = React.useId();

const SvgComponent = MASCOT_COMPONENTS[type];

if (SvgComponent) {
  return (
    <MascotAnimationController>
      <SvgComponent
        size={size}
        animate={animate}
        uid={uid}
      />
    </MascotAnimationController>
  );
}

  const images = IMAGE_MASCOTS[type];
  if (images) {
    const src = images[view] || images.front;
    if (src) {
  return (
    <MascotAnimationController>
      <PremiumMascotImg
        type={type}
        src={src}
        size={size}
      />
    </MascotAnimationController>
  );
}
  }

  return (
  <MascotAnimationController>
    <BoxMascot
      size={size}
      animate={animate}
      uid={uid}
    />
  </MascotAnimationController>
);
}

export { MASCOT_COMPONENTS, IMAGE_MASCOTS, BoxMascot, CoinMascot, CartMascot, CouponMascot, BagMascot };
