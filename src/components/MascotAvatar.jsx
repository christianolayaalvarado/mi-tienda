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

// === PREMIUM MASCOTS ===

function BoxCPremium({ size = 64, animate = true, uid = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id={`boxcGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect x="20" y="30" width="60" height="50" rx="6" fill={`url(#boxcGrad${uid})`} stroke="#6D28D9" strokeWidth="2" />
      <path d="M20 30 L50 15 L80 30" fill="#DDD6FE" stroke="#6D28D9" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="38" cy="48" rx="6" ry="7" fill="white" />
      <ellipse cx="62" cy="48" rx="6" ry="7" fill="white" />
      <circle cx="39" cy="49" r="3" fill="#1F2937">
        {animate && <animate attributeName="cy" values="49;50;49;48;49" dur="3s" repeatCount="indefinite" />}
      </circle>
      <circle cx="63" cy="49" r="3" fill="#1F2937">
        {animate && <animate attributeName="cy" values="49;50;49;48;49" dur="3s" repeatCount="indefinite" />}
      </circle>
      <path d="M38 62 Q50 68 62 62" stroke="#5B21B6" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="56" r="4" fill="#DDD6FE" opacity="0.5" />
      <circle cx="70" cy="56" r="4" fill="#DDD6FE" opacity="0.5" />
      <g>
        <rect x="8" y="44" width="14" height="6" rx="3" fill="#8B5CF6" stroke="#6D28D9" strokeWidth="1.5">
          {animate && <animateTransform attributeName="transform" type="rotate" values="0 14 47;-15 14 47;0 14 47" dur="2s" repeatCount="indefinite" />}
        </rect>
        <rect x="78" y="44" width="14" height="6" rx="3" fill="#8B5CF6" stroke="#6D28D9" strokeWidth="1.5">
          {animate && <animateTransform attributeName="transform" type="rotate" values="0 86 47;15 86 47;0 86 47" dur="2s" repeatCount="indefinite" begin="0.3s" />}
        </rect>
      </g>
      <rect x="32" y="80" width="8" height="10" rx="4" fill="#8B5CF6" stroke="#6D28D9" strokeWidth="1.5" />
      <rect x="60" y="80" width="8" height="10" rx="4" fill="#8B5CF6" stroke="#6D28D9" strokeWidth="1.5" />
    </svg>
  );
}

function CoinAPremium({ size = 64, animate = true, uid = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id={`coinaGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="40" fill={`url(#coinaGrad${uid})`} stroke="#A16207" strokeWidth="3" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="#CA8A04" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="50" y="42" textAnchor="middle" fill="#A16207" fontSize="16" fontWeight="bold">$</text>
      <ellipse cx="40" cy="55" rx="5" ry="6" fill="white" />
      <ellipse cx="60" cy="55" rx="5" ry="6" fill="white" />
      <circle cx="41" cy="55" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cx" values="41;42;41;40;41" dur="2.5s" repeatCount="indefinite" />}
      </circle>
      <circle cx="61" cy="55" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cx" values="61;62;61;60;61" dur="2.5s" repeatCount="indefinite" />}
      </circle>
      <path d="M42 64 Q50 72 58 64" stroke="#A16207" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="35" cy="38" rx="7" ry="3" fill="white" opacity="0.35" transform="rotate(-30 35 38)" />
      <g>
        <circle cx="10" cy="50" r="5" fill="#FACC15" stroke="#A16207" strokeWidth="1.5">
          {animate && <animate attributeName="cy" values="50;44;50" dur="1.8s" repeatCount="indefinite" />}
        </circle>
        <circle cx="90" cy="50" r="5" fill="#FACC15" stroke="#A16207" strokeWidth="1.5">
          {animate && <animate attributeName="cy" values="50;44;50" dur="1.8s" repeatCount="indefinite" begin="0.3s" />}
        </circle>
      </g>
      <rect x="36" y="86" width="7" height="8" rx="3.5" fill="#FACC15" stroke="#A16207" strokeWidth="1.5" />
      <rect x="57" y="86" width="7" height="8" rx="3.5" fill="#FACC15" stroke="#A16207" strokeWidth="1.5" />
    </svg>
  );
}

function CartAPremium({ size = 64, animate = true, uid = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id={`cartaGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <path d="M25 30 L30 70 L75 70 L80 35 L35 35" fill={`url(#cartaGrad${uid})`} stroke="#2563EB" strokeWidth="2" strokeLinejoin="round" />
      <path d="M15 28 L25 30" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="45" cy="48" rx="5" ry="6" fill="white" />
      <ellipse cx="65" cy="48" rx="5" ry="6" fill="white" />
      <circle cx="46" cy="48" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cx" values="46;47;46;45;46" dur="3s" repeatCount="indefinite" />}
      </circle>
      <circle cx="66" cy="48" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cx" values="66;67;66;65;66" dur="3s" repeatCount="indefinite" />}
      </circle>
      <path d="M44 57 Q55 65 66 57" stroke="#1D4ED8" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="38" cy="78" r="6" fill="#2563EB" stroke="#1D4ED8" strokeWidth="2" />
      <circle cx="68" cy="78" r="6" fill="#2563EB" stroke="#1D4ED8" strokeWidth="2" />
      <circle cx="38" cy="78" r="2" fill="#BFDBFE" />
      <circle cx="68" cy="78" r="2" fill="#BFDBFE" />
      <g>
        <rect x="5" y="42" width="18" height="5" rx="2.5" fill="#93C5FD" stroke="#2563EB" strokeWidth="1.5">
          {animate && <animateTransform attributeName="transform" type="rotate" values="0 14 44;-20 14 44;0 14 44" dur="1.5s" repeatCount="indefinite" />}
        </rect>
        <rect x="77" y="42" width="18" height="5" rx="2.5" fill="#93C5FD" stroke="#2563EB" strokeWidth="1.5">
          {animate && <animateTransform attributeName="transform" type="rotate" values="0 86 44;20 86 44;0 86 44" dur="1.5s" repeatCount="indefinite" begin="0.2s" />}
        </rect>
      </g>
    </svg>
  );
}

function CartBPremium({ size = 64, animate = true, uid = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id={`cartbGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FCA5A5" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
      </defs>
      <path d="M25 30 L30 70 L75 70 L80 35 L35 35" fill={`url(#cartbGrad${uid})`} stroke="#DC2626" strokeWidth="2" strokeLinejoin="round" />
      <path d="M15 28 L25 30" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="45" cy="48" rx="5" ry="6" fill="white" />
      <ellipse cx="65" cy="48" rx="5" ry="6" fill="white" />
      <circle cx="46" cy="48" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cx" values="46;47;46;45;46" dur="3s" repeatCount="indefinite" />}
      </circle>
      <circle cx="66" cy="48" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cx" values="66;67;66;65;66" dur="3s" repeatCount="indefinite" />}
      </circle>
      <path d="M44 57 Q55 65 66 57" stroke="#B91C1C" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="38" cy="78" r="6" fill="#DC2626" stroke="#B91C1C" strokeWidth="2" />
      <circle cx="68" cy="78" r="6" fill="#DC2626" stroke="#B91C1C" strokeWidth="2" />
      <circle cx="38" cy="78" r="2" fill="#FECACA" />
      <circle cx="68" cy="78" r="2" fill="#FECACA" />
      <g>
        <rect x="5" y="42" width="18" height="5" rx="2.5" fill="#FCA5A5" stroke="#DC2626" strokeWidth="1.5">
          {animate && <animateTransform attributeName="transform" type="rotate" values="0 14 44;-20 14 44;0 14 44" dur="1.5s" repeatCount="indefinite" />}
        </rect>
        <rect x="77" y="42" width="18" height="5" rx="2.5" fill="#FCA5A5" stroke="#DC2626" strokeWidth="1.5">
          {animate && <animateTransform attributeName="transform" type="rotate" values="0 86 44;20 86 44;0 86 44" dur="1.5s" repeatCount="indefinite" begin="0.2s" />}
        </rect>
      </g>
    </svg>
  );
}

function CouponCPremium({ size = 64, animate = true, uid = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id={`couponcGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
      </defs>
      <rect x="15" y="35" width="70" height="40" rx="5" fill={`url(#couponcGrad${uid})`} stroke="#16A34A" strokeWidth="2" />
      <circle cx="15" cy="55" r="5" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.5" />
      <circle cx="85" cy="55" r="5" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.5" />
      <line x1="22" y1="55" x2="78" y2="55" stroke="#16A34A" strokeWidth="1" strokeDasharray="5 3" />
      <text x="50" y="50" textAnchor="middle" fill="#15803D" fontSize="11" fontWeight="bold">GRATIS</text>
      <ellipse cx="40" cy="40" rx="4" ry="5" fill="white" />
      <ellipse cx="60" cy="40" rx="4" ry="5" fill="white" />
      <circle cx="41" cy="40" r="2" fill="#1F2937">
        {animate && <animate attributeName="cx" values="41;42;41;40;41" dur="2.8s" repeatCount="indefinite" />}
      </circle>
      <circle cx="61" cy="40" r="2" fill="#1F2937">
        {animate && <animate attributeName="cx" values="61;62;61;60;61" dur="2.8s" repeatCount="indefinite" />}
      </circle>
      <path d="M44 32 Q50 28 56 32" stroke="#15803D" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function BagBPremium({ size = 64, animate = true, uid = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id={`bagbGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <path d="M25 35 L20 85 L80 85 L75 35 Z" fill={`url(#bagbGrad${uid})`} stroke="#B45309" strokeWidth="2" />
      <path d="M35 35 Q35 18 50 18 Q65 18 65 35" fill="none" stroke="#B45309" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="40" cy="50" rx="5" ry="6" fill="white" />
      <ellipse cx="60" cy="50" rx="5" ry="6" fill="white" />
      <circle cx="41" cy="51" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cy" values="51;52;51;50;51" dur="3s" repeatCount="indefinite" />}
      </circle>
      <circle cx="61" cy="51" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cy" values="51;52;51;50;51" dur="3s" repeatCount="indefinite" />}
      </circle>
      <path d="M42 62 Q50 58 58 62" stroke="#92400E" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="56" r="4" fill="#FDE68A" opacity="0.4" />
      <circle cx="68" cy="56" r="4" fill="#FDE68A" opacity="0.4" />
      <path d="M46 40 L48 36 L50 40" stroke="#B45309" strokeWidth="1.5" fill="none" />
      <path d="M50 40 L52 36 L54 40" stroke="#B45309" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function RocketBPremium({ size = 64, animate = true, uid = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id={`rocketGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FCA5A5" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="45" rx="18" ry="30" fill={`url(#rocketGrad${uid})`} stroke="#B91C1C" strokeWidth="2" />
      <ellipse cx="50" cy="20" rx="8" ry="10" fill="#FCA5A5" stroke="#B91C1C" strokeWidth="2" />
      <path d="M32 55 L22 70 L38 60" fill="#F87171" stroke="#B91C1C" strokeWidth="1.5" />
      <path d="M68 55 L78 70 L62 60" fill="#F87171" stroke="#B91C1C" strokeWidth="1.5" />
      <ellipse cx="50" cy="60" rx="6" ry="3" fill="#FEF2F2" stroke="#B91C1C" strokeWidth="1.5" />
      <ellipse cx="44" cy="42" rx="4" ry="5" fill="white" />
      <ellipse cx="56" cy="42" rx="4" ry="5" fill="white" />
      <circle cx="45" cy="42" r="2" fill="#1F2937">
        {animate && <animate attributeName="cy" values="42;41;42;43;42" dur="2.5s" repeatCount="indefinite" />}
      </circle>
      <circle cx="57" cy="42" r="2" fill="#1F2937">
        {animate && <animate attributeName="cy" values="42;41;42;43;42" dur="2.5s" repeatCount="indefinite" />}
      </circle>
      <path d="M46 50 Q50 54 54 50" stroke="#991B1B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {animate && (
        <g>
          <ellipse cx="50" cy="82" rx="4" ry="6" fill="#FBBF24" opacity="0.8">
            <animate attributeName="ry" values="6;10;6" dur="0.4s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="47" cy="80" rx="2" ry="4" fill="#F97316" opacity="0.6">
            <animate attributeName="ry" values="4;7;4" dur="0.3s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="53" cy="80" rx="2" ry="4" fill="#F97316" opacity="0.6">
            <animate attributeName="ry" values="4;7;4" dur="0.35s" repeatCount="indefinite" />
          </ellipse>
        </g>
      )}
    </svg>
  );
}

function DogCPremium({ size = 64, animate = true, uid = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id={`dogGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="55" rx="25" ry="22" fill={`url(#dogGrad${uid})`} stroke="#A16207" strokeWidth="2" />
      <ellipse cx="30" cy="30" rx="12" ry="10" fill="#FDE68A" stroke="#A16207" strokeWidth="2" />
      <ellipse cx="70" cy="30" rx="12" ry="10" fill="#FDE68A" stroke="#A16207" strokeWidth="2" />
      <ellipse cx="42" cy="52" rx="5" ry="6" fill="white" />
      <ellipse cx="58" cy="52" rx="5" ry="6" fill="white" />
      <circle cx="43" cy="53" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cy" values="53;52;53;54;53" dur="3s" repeatCount="indefinite" />}
      </circle>
      <circle cx="59" cy="53" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cy" values="53;52;53;54;53" dur="3s" repeatCount="indefinite" />}
      </circle>
      <ellipse cx="50" cy="62" rx="4" ry="3" fill="#92400E" />
      <path d="M46 67 Q50 72 54 67" stroke="#92400E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="34" cy="60" r="4" fill="#FDE68A" opacity="0.5" />
      <circle cx="66" cy="60" r="4" fill="#FDE68A" opacity="0.5" />
      <ellipse cx="50" cy="82" rx="8" ry="5" fill="#FDE68A" stroke="#A16207" strokeWidth="1.5" />
    </svg>
  );
}

function CatBPremium({ size = 64, animate = true, uid = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id={`catGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D1D5DB" />
          <stop offset="100%" stopColor="#9CA3AF" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="58" rx="24" ry="22" fill={`url(#catGrad${uid})`} stroke="#6B7280" strokeWidth="2" />
      <path d="M26 38 L30 15 L42 35" fill="#D1D5DB" stroke="#6B7280" strokeWidth="2" strokeLinejoin="round" />
      <path d="M58 35 L70 15 L74 38" fill="#D1D5DB" stroke="#6B7280" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="40" cy="55" rx="5" ry="6" fill="#FEF9C3" />
      <ellipse cx="60" cy="55" rx="5" ry="6" fill="#FEF9C3" />
      <ellipse cx="41" cy="55" rx="2" ry="4" fill="#1F2937">
        {animate && <animate attributeName="ry" values="4;3;4;5;4" dur="3s" repeatCount="indefinite" />}
      </ellipse>
      <ellipse cx="61" cy="55" rx="2" ry="4" fill="#1F2937">
        {animate && <animate attributeName="ry" values="4;3;4;5;4" dur="3s" repeatCount="indefinite" />}
      </ellipse>
      <path d="M50 62 L47 66 L50 65 L53 66 Z" fill="#F9A8D4" />
      <path d="M44 68 Q50 73 56 68" stroke="#6B7280" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <line x1="28" y1="58" x2="15" y2="55" stroke="#9CA3AF" strokeWidth="1" />
      <line x1="28" y1="62" x2="15" y2="63" stroke="#9CA3AF" strokeWidth="1" />
      <line x1="72" y1="58" x2="85" y2="55" stroke="#9CA3AF" strokeWidth="1" />
      <line x1="72" y1="62" x2="85" y2="63" stroke="#9CA3AF" strokeWidth="1" />
    </svg>
  );
}

function ChickenBPremium({ size = 64, animate = true, uid = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id={`chickGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="100%" stopColor="#FDE68A" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="55" rx="22" ry="24" fill={`url(#chickGrad${uid})`} stroke="#CA8A04" strokeWidth="2" />
      <path d="M42 28 Q50 18 58 28" fill="#EF4444" stroke="#DC2626" strokeWidth="2" />
      <path d="M46 30 Q50 22 54 30" fill="#F87171" />
      <ellipse cx="42" cy="48" rx="5" ry="6" fill="white" />
      <ellipse cx="58" cy="48" rx="5" ry="6" fill="white" />
      <circle cx="43" cy="48" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cx" values="43;44;43;42;43" dur="2.5s" repeatCount="indefinite" />}
      </circle>
      <circle cx="59" cy="48" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cx" values="59;60;59;58;59" dur="2.5s" repeatCount="indefinite" />}
      </circle>
      <path d="M46 56 L50 62 L54 56" fill="#F97316" stroke="#EA580C" strokeWidth="1.5" />
      <path d="M32 52 Q25 50 28 58" fill="#FDE68A" stroke="#CA8A04" strokeWidth="1.5" />
      <path d="M68 52 Q75 50 72 58" fill="#FDE68A" stroke="#CA8A04" strokeWidth="1.5" />
      <rect x="42" y="78" width="5" height="8" rx="2" fill="#F97316" stroke="#EA580C" strokeWidth="1" />
      <rect x="53" y="78" width="5" height="8" rx="2" fill="#F97316" stroke="#EA580C" strokeWidth="1" />
    </svg>
  );
}

function RoosterBPremium({ size = 64, animate = true, uid = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id={`roosterGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="55" rx="22" ry="24" fill={`url(#roosterGrad${uid})`} stroke="#A16207" strokeWidth="2" />
      <path d="M40 25 Q50 10 60 25" fill="#EF4444" stroke="#DC2626" strokeWidth="2" />
      <path d="M44 27 Q50 15 56 27" fill="#F87171" />
      <ellipse cx="42" cy="48" rx="5" ry="6" fill="white" />
      <ellipse cx="58" cy="48" rx="5" ry="6" fill="white" />
      <circle cx="43" cy="48" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cx" values="43;44;43;42;43" dur="2.5s" repeatCount="indefinite" />}
      </circle>
      <circle cx="59" cy="48" r="2.5" fill="#1F2937">
        {animate && <animate attributeName="cx" values="59;60;59;58;59" dur="2.5s" repeatCount="indefinite" />}
      </circle>
      <path d="M46 56 L50 62 L54 56" fill="#F97316" stroke="#EA580C" strokeWidth="1.5" />
      <ellipse cx="30" cy="55" rx="10" ry="14" fill="#FDE047" stroke="#A16207" strokeWidth="1.5" transform="rotate(-15 30 55)" />
      <ellipse cx="70" cy="55" rx="10" ry="14" fill="#FDE047" stroke="#A16207" strokeWidth="1.5" transform="rotate(15 70 55)" />
      <path d="M45 78 Q50 90 55 78" fill="#EF4444" stroke="#DC2626" strokeWidth="1.5" />
      <rect x="42" y="80" width="5" height="8" rx="2" fill="#F97316" stroke="#EA580C" strokeWidth="1" />
      <rect x="53" y="80" width="5" height="8" rx="2" fill="#F97316" stroke="#EA580C" strokeWidth="1" />
    </svg>
  );
}

function CuyCPremium({ size = 64, animate = true, uid = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id={`cuyGrad${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4A574" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="58" rx="28" ry="22" fill={`url(#cuyGrad${uid})`} stroke="#78350F" strokeWidth="2" />
      <ellipse cx="50" cy="40" rx="16" ry="14" fill="#D4A574" stroke="#78350F" strokeWidth="2" />
      <ellipse cx="38" cy="38" rx="4" ry="5" fill="white" />
      <ellipse cx="62" cy="38" rx="4" ry="5" fill="white" />
      <circle cx="39" cy="38" r="2" fill="#1F2937">
        {animate && <animate attributeName="cy" values="38;37;38;39;38" dur="2.5s" repeatCount="indefinite" />}
      </circle>
      <circle cx="63" cy="38" r="2" fill="#1F2937">
        {animate && <animate attributeName="cy" values="38;37;38;39;38" dur="2.5s" repeatCount="indefinite" />}
      </circle>
      <ellipse cx="50" cy="46" rx="3" ry="2" fill="#78350F" />
      <path d="M46 48 Q50 52 54 48" stroke="#78350F" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="36" cy="44" r="4" fill="#F9A8D4" opacity="0.4" />
      <circle cx="64" cy="44" r="4" fill="#F9A8D4" opacity="0.4" />
      <circle cx="25" cy="52" r="4" fill="#D4A574" stroke="#78350F" strokeWidth="1" />
      <circle cx="75" cy="52" r="4" fill="#D4A574" stroke="#78350F" strokeWidth="1" />
      <rect x="35" y="76" width="6" height="6" rx="3" fill="#78350F" />
      <rect x="59" y="76" width="6" height="6" rx="3" fill="#78350F" />
    </svg>
  );
}

const MASCOT_COMPONENTS = {
  box: BoxMascot,
  coin: CoinMascot,
  cart: CartMascot,
  coupon: CouponMascot,
  bag: BagMascot,
  box_c: BoxCPremium,
  coin_a: CoinAPremium,
  cart_a: CartAPremium,
  cart_b: CartBPremium,
  coupon_c: CouponCPremium,
  bag_b: BagBPremium,
  rocket_b: RocketBPremium,
  dog_c: DogCPremium,
  cat_b: CatBPremium,
  chicken_b: ChickenBPremium,
  rooster_b: RoosterBPremium,
  cuy_c: CuyCPremium,
};

export default function MascotAvatar({ type = "box", size = 64, animate = true, view = "front" }) {
  const uid = React.useId();
  const SvgComponent = MASCOT_COMPONENTS[type];
  if (SvgComponent) {
    return <SvgComponent size={size} animate={animate} uid={uid} />;
  }
  return <BoxMascot size={size} animate={animate} uid={uid} />;
}

export { MASCOT_COMPONENTS, BoxMascot, CoinMascot, CartMascot, CouponMascot, BagMascot };
