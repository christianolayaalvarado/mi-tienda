"use client";

import React from "react";

function BoxMascot({ size = 64, animate = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="boxGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      {/* Body */}
      <rect x="20" y="30" width="60" height="50" rx="6" fill="url(#boxGrad)" stroke="#D97706" strokeWidth="2" />
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

function CoinMascot({ size = 64, animate = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="coinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="50" cy="50" r="40" fill="url(#coinGrad)" stroke="#B45309" strokeWidth="3" />
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

function CartMascot({ size = 64, animate = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="cartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
      </defs>
      {/* Cart body */}
      <path d="M25 30 L30 70 L75 70 L80 35 L35 35" fill="url(#cartGrad)" stroke="#16A34A" strokeWidth="2" strokeLinejoin="round" />
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

function CouponMascot({ size = 64, animate = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="couponGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      {/* Coupon body */}
      <rect x="15" y="35" width="70" height="40" rx="5" fill="url(#couponGrad)" stroke="#7C3AED" strokeWidth="2" />
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

function BagMascot({ size = 64, animate = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="bagGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F9A8D4" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      {/* Bag body */}
      <path d="M25 35 L20 85 L80 85 L75 35 Z" fill="url(#bagGrad)" stroke="#DB2777" strokeWidth="2" />
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

function RocketMascot({ size = 64, animate = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="rocketGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      {/* Rocket body */}
      <path d="M50 10 Q65 30 65 55 L35 55 Q35 30 50 10Z" fill="url(#rocketGrad)" stroke="#2563EB" strokeWidth="2" />
      {/* Nose cone */}
      <path d="M50 10 Q55 20 55 30 L45 30 Q45 20 50 10Z" fill="#BFDBFE" />
      {/* Window */}
      <circle cx="50" cy="38" r="8" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
      <circle cx="50" cy="38" r="5" fill="#EFF6FF" />
      {/* Eyes in window */}
      <circle cx="47" cy="37" r="2" fill="#1F2937">
        {animate && <animate attributeName="cx" values="47;48;47;46;47" dur="2.5s" repeatCount="indefinite" />}
      </circle>
      <circle cx="53" cy="37" r="2" fill="#1F2937">
        {animate && <animate attributeName="cx" values="53;54;53;52;53" dur="2.5s" repeatCount="indefinite" />}
      </circle>
      {/* Fins */}
      <path d="M35 45 L22 60 L35 55Z" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1.5" />
      <path d="M65 45 L78 60 L65 55Z" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1.5" />
      {/* Flame */}
      <g>
        <path d="M42 55 L50 80 L58 55" fill="#F97316" opacity="0.9">
          {animate && <animate attributeName="d" values="M42 55 L50 80 L58 55;M44 55 L50 75 L56 55;M42 55 L50 80 L58 55" dur="0.4s" repeatCount="indefinite" />}
        </path>
        <path d="M45 55 L50 72 L55 55" fill="#FCD34D">
          {animate && <animate attributeName="d" values="M45 55 L50 72 L55 55;M46 55 L50 68 L54 55;M45 55 L50 72 L55 55" dur="0.3s" repeatCount="indefinite" />}
        </path>
      </g>
      {/* Smile */}
      <path d="M46 42 Q50 45 54 42" stroke="#1E40AF" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function CrownMascot({ size = 64, animate = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="crownGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      {/* Crown body */}
      <path d="M15 65 L20 30 L35 50 L50 20 L65 50 L80 30 L85 65Z" fill="url(#crownGrad)" stroke="#D97706" strokeWidth="2" />
      {/* Crown base */}
      <rect x="15" y="65" width="70" height="12" rx="3" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
      {/* Gems */}
      <circle cx="35" cy="71" r="3" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />
      <circle cx="50" cy="71" r="3" fill="#3B82F6" stroke="#2563EB" strokeWidth="1" />
      <circle cx="65" cy="71" r="3" fill="#22C55E" stroke="#16A34A" strokeWidth="1" />
      {/* Tips */}
      <circle cx="20" cy="30" r="3" fill="#FDE68A" stroke="#D97706" strokeWidth="1" />
      <circle cx="50" cy="20" r="3" fill="#FDE68A" stroke="#D97706" strokeWidth="1" />
      <circle cx="80" cy="30" r="3" fill="#FDE68A" stroke="#D97706" strokeWidth="1" />
      {/* Face on base */}
      <ellipse cx="40" cy="82" rx="3" ry="3.5" fill="white" />
      <ellipse cx="60" cy="82" rx="3" ry="3.5" fill="white" />
      <circle cx="41" cy="82" r="1.5" fill="#1F2937" />
      <circle cx="61" cy="82" r="1.5" fill="#1F2937" />
      <path d="M44 87 Q50 91 56 87" stroke="#92400E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Shine animation */}
      {animate && (
        <ellipse cx="30" cy="45" rx="4" ry="2" fill="white" opacity="0.5" transform="rotate(-20 30 45)">
          <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite" />
        </ellipse>
      )}
    </svg>
  );
}

function GhostMascot({ size = 64, animate = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="ghostGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E5E7EB" />
          <stop offset="100%" stopColor="#9CA3AF" />
        </linearGradient>
      </defs>
      {/* Ghost body */}
      <path d="M25 50 Q25 15 50 15 Q75 15 75 50 L75 80 Q70 72 65 80 Q60 72 55 80 Q50 72 45 80 Q40 72 35 80 Q30 72 25 80Z" fill="url(#ghostGrad)" stroke="#6B7280" strokeWidth="2" />
      {/* Eyes */}
      <ellipse cx="38" cy="42" rx="6" ry="7" fill="white" />
      <ellipse cx="62" cy="42" rx="6" ry="7" fill="white" />
      <circle cx="40" cy="42" r="3" fill="#1F2937">
        {animate && (
          <>
            <animate attributeName="cy" values="42;41;42;43;42" dur="3s" repeatCount="indefinite" />
            <animate attributeName="r" values="3;1;3" dur="4s" repeatCount="indefinite" />
          </>
        )}
      </circle>
      <circle cx="64" cy="42" r="3" fill="#1F2937">
        {animate && (
          <>
            <animate attributeName="cy" values="42;41;42;43;42" dur="3s" repeatCount="indefinite" />
            <animate attributeName="r" values="3;1;3" dur="4s" repeatCount="indefinite" />
          </>
        )}
      </circle>
      {/* Mouth */}
      <ellipse cx="50" cy="58" rx="5" ry="4" fill="#4B5563" />
      {/* Floating animation */}
      {animate && (
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="2s" repeatCount="indefinite" />
      )}
      {/* Blush */}
      <circle cx="28" cy="50" r="4" fill="#FCA5A5" opacity="0.3" />
      <circle cx="72" cy="50" r="4" fill="#FCA5A5" opacity="0.3" />
    </svg>
  );
}

const MASCOT_COMPONENTS = {
  box: BoxMascot,
  coin: CoinMascot,
  cart: CartMascot,
  coupon: CouponMascot,
  bag: BagMascot,
  rocket: RocketMascot,
  crown: CrownMascot,
  ghost: GhostMascot,
};

export default function MascotAvatar({ type = "box", size = 64, animate = true }) {
  const Component = MASCOT_COMPONENTS[type] || MASCOT_COMPONENTS.box;
  return <Component size={size} animate={animate} />;
}

export { MASCOT_COMPONENTS, BoxMascot, CoinMascot, CartMascot, CouponMascot, BagMascot, RocketMascot, CrownMascot, GhostMascot };
