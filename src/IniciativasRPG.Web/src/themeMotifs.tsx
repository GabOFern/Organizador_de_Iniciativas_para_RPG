import type { ReactNode } from 'react';
import type { UiTheme } from './themes';

type MotifPlacement = {
  id: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size: string;
  rotate?: string;
  opacity?: number;
  svg: ReactNode;
};

function viewBoxSvg(
  vb: string,
  children: ReactNode,
  stroke = false,
): ReactNode {
  return (
    <svg viewBox={vb} aria-hidden focusable="false">
      {stroke ? (
        <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {children}
        </g>
      ) : (
        <g fill="currentColor">{children}</g>
      )}
    </svg>
  );
}

/* —— Motivos individuais —— */

const paw = viewBoxSvg(
  '0 0 64 64',
  <>
    <ellipse cx="32" cy="42" rx="14" ry="12" />
    <circle cx="18" cy="22" r="6" />
    <circle cx="28" cy="14" r="5.5" />
    <circle cx="40" cy="14" r="5.5" />
    <circle cx="48" cy="22" r="6" />
  </>,
);

const roots = viewBoxSvg(
  '0 0 120 80',
  <>
    <path d="M60 0 C58 20 40 28 28 48 C22 58 18 70 12 80" />
    <path d="M60 8 C62 24 78 32 90 50 C96 60 102 70 110 80" />
    <path d="M60 16 C55 30 50 40 42 55" />
    <path d="M60 20 C68 34 74 44 82 58" />
  </>,
  true,
);

const leaf = viewBoxSvg(
  '0 0 48 64',
  <>
    <path d="M24 4 C36 18 42 34 24 60 C6 34 12 18 24 4Z" />
    <path d="M24 12 V52" fill="none" stroke="currentColor" strokeWidth="2" />
  </>,
);

const axe = viewBoxSvg(
  '0 0 64 64',
  <>
    <path d="M28 8 L52 4 L56 20 L40 28 Z" />
    <rect x="30" y="26" width="6" height="34" rx="1" />
  </>,
);

const cracks = viewBoxSvg(
  '0 0 80 80',
  <>
    <path d="M40 0 L36 28 L20 40 L34 48 L28 80" />
    <path d="M36 28 L52 36 L48 52" />
    <path d="M34 48 L50 58" />
  </>,
  true,
);

const splat = viewBoxSvg(
  '0 0 48 48',
  <>
    <circle cx="24" cy="24" r="8" />
    <circle cx="12" cy="16" r="4" />
    <circle cx="34" cy="14" r="3.5" />
    <circle cx="38" cy="28" r="5" />
    <circle cx="14" cy="32" r="3" />
  </>,
);

const musicNote = viewBoxSvg(
  '0 0 40 64',
  <>
    <ellipse cx="14" cy="50" rx="10" ry="8" />
    <rect x="22" y="10" width="4" height="42" />
    <path d="M26 10 C34 14 38 22 38 28 C32 24 28 18 26 14 Z" />
  </>,
);

const clef = viewBoxSvg(
  '0 0 48 80',
  <>
    <path d="M28 72 C12 68 8 52 16 44 C24 36 36 40 34 52 C32 62 20 64 16 58 M28 8 C40 18 40 36 28 48 C22 40 20 28 26 18 C30 12 28 8 28 8 Z" />
  </>,
  true,
);

const luteCurve = viewBoxSvg(
  '0 0 80 40',
  <>
    <path d="M8 28 C20 8 40 4 56 14 C68 22 74 20 76 12" />
    <circle cx="16" cy="28" r="6" />
  </>,
  true,
);

const sunHalo = viewBoxSvg(
  '0 0 64 64',
  <>
    <circle cx="32" cy="32" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="32" cy="32" r="6" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
      const rad = (deg * Math.PI) / 180;
      const x1 = 32 + Math.cos(rad) * 16;
      const y1 = 32 + Math.sin(rad) * 16;
      const x2 = 32 + Math.cos(rad) * 28;
      const y2 = 32 + Math.sin(rad) * 28;
      return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="2" />;
    })}
  </>,
);

const holySymbol = viewBoxSvg(
  '0 0 48 48',
  <>
    <path d="M24 4 V44 M8 20 H40" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
  </>,
);

const crossedSwords = viewBoxSvg(
  '0 0 64 64',
  <>
    <path d="M12 8 L28 40 L24 52 L16 48 L20 40 Z" />
    <path d="M52 8 L36 40 L40 52 L48 48 L44 40 Z" />
    <rect x="22" y="38" width="20" height="4" rx="1" transform="rotate(-20 32 40)" />
  </>,
);

const shield = viewBoxSvg(
  '0 0 48 56',
  <>
    <path d="M24 4 L44 12 V28 C44 42 32 52 24 54 C16 52 4 42 4 28 V12 Z" />
  </>,
);

const rivets = viewBoxSvg(
  '0 0 64 24',
  <>
    <circle cx="8" cy="12" r="5" />
    <circle cx="32" cy="12" r="5" />
    <circle cx="56" cy="12" r="5" />
  </>,
);

const lotus = viewBoxSvg(
  '0 0 64 48',
  <>
    <path d="M32 44 C20 36 14 24 18 14 C24 22 28 30 32 44 Z" />
    <path d="M32 44 C44 36 50 24 46 14 C40 22 36 30 32 44 Z" />
    <path d="M32 44 C28 28 32 12 32 4 C36 12 36 28 32 44 Z" />
  </>,
);

const rings = viewBoxSvg(
  '0 0 64 64',
  <>
    <circle cx="32" cy="32" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="32" cy="32" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </>,
);

const sunburst = viewBoxSvg(
  '0 0 64 64',
  <>
    <circle cx="32" cy="32" r="8" />
    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
      const rad = (deg * Math.PI) / 180;
      return (
        <line
          key={deg}
          x1={32 + Math.cos(rad) * 12}
          y1={32 + Math.sin(rad) * 12}
          x2={32 + Math.cos(rad) * 30}
          y2={32 + Math.sin(rad) * 30}
          stroke="currentColor"
          strokeWidth="2"
        />
      );
    })}
  </>,
);

const paladinShield = viewBoxSvg(
  '0 0 48 56',
  <>
    <path d="M24 4 L44 12 V28 C44 42 32 52 24 54 C16 52 4 42 4 28 V12 Z" />
    <path d="M24 16 V42 M14 28 H34" fill="none" stroke="var(--wood-deep)" strokeWidth="3" />
  </>,
);

const arrow = viewBoxSvg(
  '0 0 80 24',
  <>
    <path d="M4 12 H60" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M56 4 L76 12 L56 20 Z" />
    <path d="M4 4 L12 12 L4 20" fill="none" stroke="currentColor" strokeWidth="2" />
  </>,
);

const tracks = viewBoxSvg(
  '0 0 80 40',
  <>
    <ellipse cx="16" cy="12" rx="7" ry="5" />
    <ellipse cx="36" cy="28" rx="7" ry="5" />
    <ellipse cx="56" cy="12" rx="7" ry="5" />
    <ellipse cx="72" cy="28" rx="6" ry="4" />
  </>,
);

const pine = viewBoxSvg(
  '0 0 40 64',
  <>
    <path d="M20 4 L32 24 H26 L36 40 H28 L38 56 H2 L14 40 H6 L16 24 H10 Z" />
  </>,
);

const rose = viewBoxSvg(
  '0 0 48 56',
  <>
    <circle cx="24" cy="22" r="10" />
    <circle cx="18" cy="18" r="6" />
    <circle cx="30" cy="18" r="6" />
    <circle cx="24" cy="26" r="5" />
    <path d="M24 32 C22 42 18 50 14 54 M24 32 C26 42 30 50 34 54" fill="none" stroke="currentColor" strokeWidth="2" />
  </>,
);

const bone = viewBoxSvg(
  '0 0 64 24',
  <>
    <circle cx="8" cy="8" r="6" />
    <circle cx="8" cy="16" r="6" />
    <rect x="10" y="8" width="44" height="8" rx="2" />
    <circle cx="56" cy="8" r="6" />
    <circle cx="56" cy="16" r="6" />
  </>,
);

const coins = viewBoxSvg(
  '0 0 56 40',
  <>
    <circle cx="18" cy="22" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="34" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="34" cy="16" r="6" />
  </>,
);

const dagger = viewBoxSvg(
  '0 0 24 64',
  <>
    <path d="M12 2 L18 28 H6 Z" />
    <rect x="9" y="28" width="6" height="8" />
    <rect x="4" y="36" width="16" height="4" rx="1" />
    <rect x="10" y="40" width="4" height="18" />
  </>,
);

const flame = viewBoxSvg(
  '0 0 40 56',
  <>
    <path d="M20 4 C28 18 36 24 34 38 C32 48 26 52 20 52 C14 52 8 48 6 38 C4 24 12 18 20 4 Z" />
    <path d="M20 28 C24 34 26 38 24 44 C22 46 18 46 16 42 C14 36 16 32 20 28 Z" fill="var(--wood-deep)" />
  </>,
);

const sparks = viewBoxSvg(
  '0 0 64 64',
  <>
    <path d="M12 12 L16 20 L12 28 L8 20 Z" />
    <path d="M40 8 L44 14 L40 20 L36 14 Z" />
    <path d="M52 36 L56 42 L52 48 L48 42 Z" />
    <path d="M24 40 L28 48 L24 56 L20 48 Z" />
  </>,
);

const eldritchEye = viewBoxSvg(
  '0 0 64 40',
  <>
    <path d="M4 20 C16 4 48 4 60 20 C48 36 16 36 4 20 Z" />
    <circle cx="32" cy="20" r="8" fill="var(--wood-deep)" />
    <circle cx="32" cy="20" r="3" />
  </>,
);

const runes = viewBoxSvg(
  '0 0 64 48',
  <>
    <path d="M8 8 V40 M8 24 H20" fill="none" stroke="currentColor" strokeWidth="3" />
    <path d="M32 8 L44 24 L32 40 M44 24 H52" fill="none" stroke="currentColor" strokeWidth="3" />
    <path d="M58 8 V40" fill="none" stroke="currentColor" strokeWidth="3" />
  </>,
);

const veil = viewBoxSvg(
  '0 0 80 60',
  <>
    <path d="M4 8 C20 20 28 36 24 56" />
    <path d="M28 4 C40 18 48 34 44 56" />
    <path d="M52 8 C64 22 72 36 68 56" />
  </>,
  true,
);

const stars = viewBoxSvg(
  '0 0 64 64',
  <>
    <path d="M16 8 L18 14 L24 16 L18 18 L16 24 L14 18 L8 16 L14 14 Z" />
    <path d="M44 28 L46 34 L52 36 L46 38 L44 44 L42 38 L36 36 L42 34 Z" />
    <path d="M32 40 L33 44 L37 45 L33 46 L32 50 L31 46 L27 45 L31 44 Z" />
  </>,
);

const arcaneCircle = viewBoxSvg(
  '0 0 64 64',
  <>
    <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="32" cy="32" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M32 4 V14 M32 50 V60 M4 32 H14 M50 32 H60" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M12 12 L20 20 M44 20 L52 12 M12 52 L20 44 M44 44 L52 52" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </>,
);

const book = viewBoxSvg(
  '0 0 56 48',
  <>
    <path d="M28 8 C20 6 8 8 8 8 V40 C16 38 24 40 28 42 C32 40 40 38 48 40 V8 C48 8 36 6 28 8 Z" />
    <path d="M28 8 V42" fill="none" stroke="var(--wood-deep)" strokeWidth="2" />
  </>,
);

function place(
  id: string,
  svg: ReactNode,
  pos: Omit<MotifPlacement, 'id' | 'svg'>,
): MotifPlacement {
  return { id, svg, ...pos };
}

export const themeMotifs: Partial<Record<UiTheme, MotifPlacement[]>> = {
  Barbarian: [
    place('axe-tl', axe, { top: '6%', left: '3%', size: '7rem', rotate: '-18deg', opacity: 0.12 }),
    place('cracks-br', cracks, { bottom: '8%', right: '4%', size: '9rem', opacity: 0.1 }),
    place('splat-tr', splat, { top: '18%', right: '8%', size: '4rem', opacity: 0.11 }),
    place('axe-bl', axe, { bottom: '12%', left: '10%', size: '5rem', rotate: '25deg', opacity: 0.08 }),
  ],
  Bard: [
    place('note-tl', musicNote, { top: '8%', left: '5%', size: '4.5rem', opacity: 0.12 }),
    place('clef-tr', clef, { top: '10%', right: '6%', size: '6rem', opacity: 0.11 }),
    place('lute-b', luteCurve, { bottom: '10%', left: '20%', size: '10rem', opacity: 0.1 }),
    place('note-br', musicNote, { bottom: '16%', right: '12%', size: '3.5rem', rotate: '12deg', opacity: 0.09 }),
  ],
  Cleric: [
    place('halo-tr', sunHalo, { top: '6%', right: '5%', size: '8rem', opacity: 0.12 }),
    place('holy-tl', holySymbol, { top: '14%', left: '4%', size: '5rem', opacity: 0.11 }),
    place('halo-bl', sunHalo, { bottom: '8%', left: '8%', size: '5.5rem', opacity: 0.08 }),
  ],
  Druid: [
    place('paw-tl', paw, { top: '7%', left: '4%', size: '5.5rem', rotate: '-12deg', opacity: 0.13 }),
    place('roots-b', roots, { bottom: '0', left: '10%', size: '14rem', opacity: 0.12 }),
    place('leaf-tr', leaf, { top: '12%', right: '6%', size: '4.5rem', rotate: '18deg', opacity: 0.12 }),
    place('paw-br', paw, { bottom: '18%', right: '8%', size: '4rem', rotate: '20deg', opacity: 0.1 }),
    place('leaf-ml', leaf, { top: '40%', left: '2%', size: '3.5rem', rotate: '-30deg', opacity: 0.08 }),
  ],
  Fighter: [
    place('swords-tr', crossedSwords, { top: '6%', right: '4%', size: '7rem', opacity: 0.13 }),
    place('shield-tl', shield, { top: '12%', left: '4%', size: '5.5rem', opacity: 0.11 }),
    place('rivets-b', rivets, { bottom: '10%', left: '25%', size: '9rem', opacity: 0.1 }),
    place('swords-bl', crossedSwords, { bottom: '14%', right: '10%', size: '5rem', rotate: '15deg', opacity: 0.08 }),
  ],
  Monk: [
    place('lotus-tr', lotus, { top: '8%', right: '6%', size: '7rem', opacity: 0.12 }),
    place('rings-tl', rings, { top: '10%', left: '5%', size: '6.5rem', opacity: 0.1 }),
    place('rings-br', rings, { bottom: '10%', right: '8%', size: '5rem', opacity: 0.09 }),
    place('lotus-bl', lotus, { bottom: '12%', left: '8%', size: '4.5rem', opacity: 0.08 }),
  ],
  Paladin: [
    place('sun-tr', sunburst, { top: '5%', right: '5%', size: '8rem', opacity: 0.13 }),
    place('shield-tl', paladinShield, { top: '14%', left: '4%', size: '5.5rem', opacity: 0.12 }),
    place('sun-bl', sunburst, { bottom: '8%', left: '12%', size: '5rem', opacity: 0.08 }),
  ],
  Ranger: [
    place('arrow-tr', arrow, { top: '10%', right: '4%', size: '9rem', rotate: '-8deg', opacity: 0.12 }),
    place('tracks-tl', tracks, { top: '16%', left: '4%', size: '8rem', opacity: 0.11 }),
    place('pine-br', pine, { bottom: '8%', right: '8%', size: '5.5rem', opacity: 0.12 }),
    place('arrow-bl', arrow, { bottom: '18%', left: '6%', size: '7rem', rotate: '12deg', opacity: 0.08 }),
  ],
  Rogue: [
    place('rose-tr', rose, { top: '6%', right: '5%', size: '5.5rem', opacity: 0.13 }),
    place('bone-tl', bone, { top: '14%', left: '4%', size: '7rem', rotate: '-15deg', opacity: 0.11 }),
    place('coins-br', coins, { bottom: '12%', right: '8%', size: '5rem', opacity: 0.12 }),
    place('dagger-bl', dagger, { bottom: '10%', left: '6%', size: '5rem', rotate: '10deg', opacity: 0.1 }),
    place('rose-ml', rose, { top: '42%', left: '2%', size: '3.5rem', rotate: '-20deg', opacity: 0.08 }),
  ],
  Sorcerer: [
    place('flame-tr', flame, { top: '6%', right: '6%', size: '6rem', opacity: 0.13 }),
    place('sparks-tl', sparks, { top: '12%', left: '4%', size: '6rem', opacity: 0.11 }),
    place('flame-bl', flame, { bottom: '10%', left: '8%', size: '4.5rem', rotate: '-12deg', opacity: 0.1 }),
    place('sparks-br', sparks, { bottom: '14%', right: '10%', size: '5rem', opacity: 0.09 }),
  ],
  Warlock: [
    place('eye-tr', eldritchEye, { top: '7%', right: '5%', size: '8rem', opacity: 0.14 }),
    place('runes-tl', runes, { top: '16%', left: '4%', size: '6rem', opacity: 0.12 }),
    place('veil-b', veil, { bottom: '6%', left: '15%', size: '12rem', opacity: 0.1 }),
    place('eye-bl', eldritchEye, { bottom: '16%', right: '8%', size: '5rem', opacity: 0.09 }),
  ],
  Wizard: [
    place('circle-tr', arcaneCircle, { top: '5%', right: '4%', size: '8rem', opacity: 0.12 }),
    place('stars-tl', stars, { top: '12%', left: '5%', size: '6rem', opacity: 0.12 }),
    place('book-br', book, { bottom: '10%', right: '8%', size: '5.5rem', rotate: '8deg', opacity: 0.11 }),
    place('stars-bl', stars, { bottom: '14%', left: '10%', size: '4.5rem', opacity: 0.09 }),
  ],
};
