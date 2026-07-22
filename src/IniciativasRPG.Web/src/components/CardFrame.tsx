import type { ReactNode } from 'react';
import { useTheme } from '../theme';
import type { UiTheme } from '../themes';

type OrnamentKind =
  | 'paw'
  | 'leaf'
  | 'root'
  | 'axe'
  | 'splat'
  | 'note'
  | 'clef'
  | 'cross'
  | 'halo'
  | 'shield'
  | 'swords'
  | 'lotus'
  | 'rings'
  | 'sun'
  | 'arrow'
  | 'pine'
  | 'rose'
  | 'dagger'
  | 'coin'
  | 'flame'
  | 'spark'
  | 'eye'
  | 'rune'
  | 'star'
  | 'book'
  | 'arcane';

type OrnamentPos = 'tl' | 'tr' | 'bl' | 'br';

type FrameDef = {
  border: ReactNode;
  ornaments: Array<{ kind: OrnamentKind; pos: OrnamentPos }>;
};

const s = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  vectorEffect: 'non-scaling-stroke' as const,
};

function Border({ children }: { children: ReactNode }) {
  return (
    <svg
      className="card-frame-border"
      viewBox="0 0 200 280"
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
    >
      {children}
    </svg>
  );
}

function RectEdge({ rx = 3 }: { rx?: number }) {
  return <rect x="3" y="3" width="194" height="274" rx={rx} {...s} />;
}

/** Símbolos minúsculos colados na orla (não no miolo). */
function EdgeLeaf({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d="M0 0 C4 -6 8 -4 0 -12 C-8 -4 -4 -6 0 0Z" fill="currentColor" opacity={0.85} />
    </g>
  );
}

function EdgePaw({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="currentColor" opacity={0.85}>
      <ellipse cx="0" cy="3" rx="4" ry="3.2" />
      <circle cx="-4.5" cy="-2" r="1.8" />
      <circle cx="-1.5" cy="-4" r="1.6" />
      <circle cx="1.5" cy="-4" r="1.6" />
      <circle cx="4.5" cy="-2" r="1.8" />
    </g>
  );
}

function EdgeNote({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="currentColor" opacity={0.9}>
      <ellipse cx="-2" cy="4" rx="2.5" ry="2" />
      <rect x="0" y="-6" width="1.4" height="10" />
    </g>
  );
}

function EdgeCross({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke="currentColor" strokeWidth="1.6" fill="none" opacity={0.9}>
      <path d="M0 -5 V5 M-4 -1 H4" strokeLinecap="round" />
    </g>
  );
}

function EdgeFlame({ x, y }: { x: number; y: number }) {
  return (
    <path
      transform={`translate(${x} ${y})`}
      d="M0 6 C3 2 4 0 3 -4 C1 -1 0 0 -1 -3 C-2 0 -3 2 0 6Z"
      fill="currentColor"
      opacity={0.9}
    />
  );
}

function EdgeDagger({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} fill="currentColor" opacity={0.9}>
      <path d="M0 -7 L2 0 H-2Z" />
      <rect x="-1" y="0" width="2" height="3" />
      <rect x="-3" y="3" width="6" height="1.4" />
    </g>
  );
}

function EdgeCoin({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke="currentColor" strokeWidth="1.3" opacity={0.9}>
      <circle cx="0" cy="0" r="4" />
      <circle cx="0" cy="0" r="1.5" fill="currentColor" stroke="none" />
    </g>
  );
}

function EdgeEye({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={0.9}>
      <path d="M-8 0 C-3 -5 3 -5 8 0 C3 5 -3 5 -8 0Z" fill="currentColor" />
      <circle cx="0" cy="0" r="2.2" fill="var(--wood-deep)" />
      <circle cx="0" cy="0" r="1" fill="currentColor" />
    </g>
  );
}

function EdgeStar({ x, y }: { x: number; y: number }) {
  return (
    <path
      transform={`translate(${x} ${y})`}
      d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2Z"
      fill="currentColor"
      opacity={0.9}
    />
  );
}

function EdgeAxe({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="currentColor" opacity={0.9}>
      <path d="M-5 -4 L5 -6 L6 0 L0 3Z" />
      <rect x="-1" y="2" width="2" height="7" />
    </g>
  );
}

function EdgeSword({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} fill="currentColor" opacity={0.9}>
      <path d="M0 -8 L2 2 H-2Z" />
      <rect x="-3" y="2" width="6" height="1.5" />
      <rect x="-0.8" y="3.5" width="1.6" height="5" />
    </g>
  );
}

function EdgeArrow({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={0.9}>
      <path d="M-8 0 H5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M3 -3.5 L9 0 L3 3.5Z" fill="currentColor" />
    </g>
  );
}

function EdgeRune({ x, y }: { x: number; y: number }) {
  return (
    <path
      transform={`translate(${x} ${y})`}
      d="M-3 -5 V5 M-3 0 H2 M4 -5 L7 0 L4 5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      opacity={0.9}
    />
  );
}

function OrnamentIcon({ kind }: { kind: OrnamentKind }) {
  const common = {
    viewBox: '0 0 32 32',
    className: 'card-frame-ornament-svg',
    'aria-hidden': true as const,
    focusable: false as const,
  };

  switch (kind) {
    case 'paw':
      return (
        <svg {...common}>
          <ellipse cx="16" cy="22" rx="7" ry="6" fill="currentColor" />
          <circle cx="8" cy="12" r="3" fill="currentColor" />
          <circle cx="14" cy="8" r="2.8" fill="currentColor" />
          <circle cx="20" cy="8" r="2.8" fill="currentColor" />
          <circle cx="25" cy="12" r="3" fill="currentColor" />
        </svg>
      );
    case 'leaf':
      return (
        <svg {...common}>
          <path d="M16 4 C24 12 26 20 16 28 C6 20 8 12 16 4Z" fill="currentColor" />
          <path d="M16 10 V24" fill="none" stroke="var(--wood-deep)" strokeWidth="1.5" />
        </svg>
      );
    case 'root':
      return (
        <svg {...common}>
          <path
            d="M16 2 C15 10 8 14 4 28 M16 6 C18 14 24 16 28 28 M16 10 C14 18 12 22 10 28"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          />
        </svg>
      );
    case 'axe':
      return (
        <svg {...common}>
          <path d="M8 4 L24 2 L26 12 L14 16Z" fill="currentColor" />
          <rect x="13" y="14" width="4" height="14" fill="currentColor" />
        </svg>
      );
    case 'splat':
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="5" fill="currentColor" />
          <circle cx="8" cy="10" r="2.5" fill="currentColor" />
          <circle cx="24" cy="12" r="2" fill="currentColor" />
          <circle cx="22" cy="22" r="3" fill="currentColor" />
        </svg>
      );
    case 'note':
      return (
        <svg {...common}>
          <ellipse cx="10" cy="24" rx="5" ry="4" fill="currentColor" />
          <rect x="14" y="6" width="2.5" height="18" fill="currentColor" />
          <path d="M16.5 6 C22 8 24 12 24 15 C20 13 18 10 16.5 8Z" fill="currentColor" />
        </svg>
      );
    case 'clef':
      return (
        <svg {...common}>
          <path
            d="M18 28 C10 26 8 18 12 14 C16 10 22 12 21 18 C20 23 14 24 12 20 M18 4 C24 8 24 16 18 22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          />
        </svg>
      );
    case 'cross':
      return (
        <svg {...common}>
          <path
            d="M16 4 V28 M8 12 H24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'halo':
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="16" cy="16" r="3.5" fill="currentColor" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...common}>
          <path d="M16 4 L28 8 V16 C28 24 20 28 16 30 C12 28 4 24 4 16 V8Z" fill="currentColor" />
        </svg>
      );
    case 'swords':
      return (
        <svg {...common}>
          <path
            d="M6 4 L14 18 L12 26 L8 24 L10 18Z M26 4 L18 18 L20 26 L24 24 L22 18Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'lotus':
      return (
        <svg {...common}>
          <path
            d="M16 28 C10 22 8 14 10 8 C12 14 14 20 16 28Z M16 28 C22 22 24 14 22 8 C20 14 18 20 16 28Z M16 28 C14 18 16 8 16 4 C18 8 18 18 16 28Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'rings':
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="4.5" fill="currentColor" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => {
            const r = (d * Math.PI) / 180;
            return (
              <line
                key={d}
                x1={16 + Math.cos(r) * 7}
                y1={16 + Math.sin(r) * 7}
                x2={16 + Math.cos(r) * 13}
                y2={16 + Math.sin(r) * 13}
                stroke="currentColor"
                strokeWidth="1.6"
              />
            );
          })}
        </svg>
      );
    case 'arrow':
      return (
        <svg {...common}>
          <path d="M4 16 H20" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M18 10 L28 16 L18 22Z" fill="currentColor" />
          <path d="M4 10 L8 16 L4 22" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'pine':
      return (
        <svg {...common}>
          <path d="M16 2 L24 12 H20 L26 20 H21 L28 28 H4 L11 20 H6 L12 12 H8Z" fill="currentColor" />
        </svg>
      );
    case 'rose':
      return (
        <svg {...common}>
          <circle cx="16" cy="12" r="6" fill="currentColor" />
          <circle cx="12" cy="10" r="3.5" fill="currentColor" />
          <circle cx="20" cy="10" r="3.5" fill="currentColor" />
          <path
            d="M16 16 C15 22 12 26 10 28 M16 16 C17 22 20 26 22 28"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
    case 'dagger':
      return (
        <svg {...common}>
          <path d="M16 2 L20 14 H12Z" fill="currentColor" />
          <rect x="14" y="14" width="4" height="4" fill="currentColor" />
          <rect x="10" y="18" width="12" height="2.5" fill="currentColor" />
          <rect x="14.5" y="20" width="3" height="10" fill="currentColor" />
        </svg>
      );
    case 'coin':
      return (
        <svg {...common}>
          <circle cx="14" cy="18" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="20" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="20" cy="12" r="3" fill="currentColor" />
        </svg>
      );
    case 'flame':
      return (
        <svg {...common}>
          <path
            d="M16 2 C22 10 26 14 25 22 C24 28 20 30 16 30 C12 30 8 28 7 22 C6 14 10 10 16 2Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'spark':
      return (
        <svg {...common}>
          <path
            d="M8 8 L10 14 L8 20 L6 14Z M20 4 L22 9 L20 14 L18 9Z M24 18 L26 22 L24 26 L22 22Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'eye':
      return (
        <svg {...common}>
          <path d="M2 16 C8 8 24 8 30 16 C24 24 8 24 2 16Z" fill="currentColor" />
          <circle cx="16" cy="16" r="4.5" fill="var(--wood-deep)" />
          <circle cx="16" cy="16" r="2" fill="currentColor" />
        </svg>
      );
    case 'rune':
      return (
        <svg {...common}>
          <path
            d="M8 6 V26 M8 16 H16 M20 6 L26 16 L20 26 M26 16 H30"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          />
        </svg>
      );
    case 'star':
      return (
        <svg {...common}>
          <path d="M16 3 L18.5 11 L26.5 13 L18.5 15 L16 23 L13.5 15 L5.5 13 L13.5 11Z" fill="currentColor" />
        </svg>
      );
    case 'arcane':
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16" cy="16" r="7" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path
            d="M16 4 V8 M16 24 V28 M4 16 H8 M24 16 H28"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
    case 'book':
      return (
        <svg {...common}>
          <path
            d="M16 6 C12 5 6 6 6 6 V24 C10 23 14 24 16 26 C18 24 22 23 26 24 V6 C26 6 20 5 16 6Z"
            fill="currentColor"
          />
        </svg>
      );
  }
}

/**
 * Orla no perímetro + símbolos de classe na própria borda + ícones nos cantos.
 * Nada atravessa o miolo do card.
 */
const frames: Record<Exclude<UiTheme, 'Default'>, FrameDef> = {
  Barbarian: {
    border: (
      <Border>
        <path
          {...s}
          d="M3 16 L12 3 L40 7 L70 3 L100 8 L130 3 L160 8 L188 4 L197 18 L197 70 L193 120 L197 170 L192 220 L197 260 L185 277 L140 273 L100 277 L60 273 L15 277 L3 258 L7 200 L3 140 L8 80 Z"
        />
        <EdgeAxe x={100} y={10} />
        <EdgeAxe x={8} y={140} />
        <EdgeAxe x={192} y={140} />
      </Border>
    ),
    ornaments: [
      { kind: 'axe', pos: 'tl' },
      { kind: 'splat', pos: 'br' },
    ],
  },
  Bard: {
    border: (
      <Border>
        <path
          {...s}
          d="M3 14 C28 3 50 18 75 6 C100 0 125 16 150 5 C175 0 190 12 197 16 L197 264 C175 276 150 262 125 274 C100 280 75 264 50 275 C28 280 12 268 3 264 Z"
        />
        <EdgeNote x={50} y={8} />
        <EdgeNote x={150} y={8} />
        <EdgeNote x={100} y={272} />
      </Border>
    ),
    ornaments: [
      { kind: 'note', pos: 'tl' },
      { kind: 'clef', pos: 'tr' },
    ],
  },
  Cleric: {
    border: (
      <Border>
        <RectEdge rx={5} />
        <EdgeCross x={100} y={10} />
        <EdgeCross x={10} y={140} />
        <EdgeCross x={190} y={140} />
      </Border>
    ),
    ornaments: [
      { kind: 'cross', pos: 'tl' },
      { kind: 'halo', pos: 'tr' },
    ],
  },
  Druid: {
    border: (
      <Border>
        <path
          {...s}
          d="M3 20 C14 4 32 12 48 4 C64 0 78 12 94 5 C110 0 124 12 140 4 C156 0 172 12 186 6 C194 4 197 14 197 24 L197 256 C194 270 176 276 160 272 C144 278 128 268 112 275 C96 278 80 268 64 275 C48 278 28 270 14 274 C6 276 3 266 3 256 Z"
        />
        <EdgePaw x={40} y={10} />
        <EdgeLeaf x={100} y={8} rot={10} />
        <EdgePaw x={160} y={10} />
        <EdgeLeaf x={8} y={140} rot={-90} />
        <EdgeLeaf x={192} y={140} rot={90} />
        <EdgePaw x={100} y={270} />
      </Border>
    ),
    ornaments: [
      { kind: 'paw', pos: 'tl' },
      { kind: 'leaf', pos: 'tr' },
      { kind: 'root', pos: 'bl' },
    ],
  },
  Fighter: {
    border: (
      <Border>
        <RectEdge rx={2} />
        {[16, 100, 184].map((x) => (
          <circle key={`t${x}`} cx={x} cy={3} r={2.4} fill="currentColor" />
        ))}
        {[16, 100, 184].map((x) => (
          <circle key={`b${x}`} cx={x} cy={277} r={2.4} fill="currentColor" />
        ))}
        {[40, 140, 240].map((y) => (
          <circle key={`l${y}`} cx={3} cy={y} r={2.4} fill="currentColor" />
        ))}
        {[40, 140, 240].map((y) => (
          <circle key={`r${y}`} cx={197} cy={y} r={2.4} fill="currentColor" />
        ))}
        <EdgeSword x={100} y={12} />
        <EdgeSword x={12} y={140} rot={-90} />
        <EdgeSword x={188} y={140} rot={90} />
      </Border>
    ),
    ornaments: [
      { kind: 'shield', pos: 'tl' },
      { kind: 'swords', pos: 'tr' },
    ],
  },
  Monk: {
    border: (
      <Border>
        <rect x="3" y="3" width="194" height="274" rx="18" {...s} />
        <circle cx="100" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.3" opacity={0.85} />
        <circle cx="100" cy="268" r="5" fill="none" stroke="currentColor" strokeWidth="1.3" opacity={0.85} />
      </Border>
    ),
    ornaments: [
      { kind: 'lotus', pos: 'tl' },
      { kind: 'rings', pos: 'br' },
    ],
  },
  Paladin: {
    border: (
      <Border>
        <RectEdge rx={4} />
        <EdgeCross x={100} y={11} />
        <path
          d="M92 268 L100 255 L108 268 Z"
          fill="currentColor"
          opacity={0.85}
        />
      </Border>
    ),
    ornaments: [
      { kind: 'shield', pos: 'tl' },
      { kind: 'sun', pos: 'tr' },
    ],
  },
  Ranger: {
    border: (
      <Border>
        <path
          {...s}
          d="M3 22 C20 4 44 14 68 5 C92 0 116 14 140 5 C164 0 184 12 197 22 L197 258 C184 274 164 266 140 275 C116 280 92 266 68 275 C44 280 20 270 3 258 Z"
        />
        <EdgeArrow x={100} y={10} />
        <EdgeArrow x={100} y={270} />
        <EdgeLeaf x={8} y={100} rot={-80} />
        <EdgeLeaf x={192} y={180} rot={100} />
      </Border>
    ),
    ornaments: [
      { kind: 'arrow', pos: 'tl' },
      { kind: 'pine', pos: 'tr' },
    ],
  },
  Rogue: {
    border: (
      <Border>
        <RectEdge rx={2} />
        <EdgeDagger x={100} y={12} />
        <EdgeCoin x={12} y={140} />
        <EdgeCoin x={188} y={140} />
        <EdgeDagger x={100} y={268} rot={180} />
      </Border>
    ),
    ornaments: [
      { kind: 'rose', pos: 'tl' },
      { kind: 'dagger', pos: 'tr' },
      { kind: 'coin', pos: 'br' },
    ],
  },
  Sorcerer: {
    border: (
      <Border>
        <path
          {...s}
          d="M3 18 C28 4 50 14 75 6 C100 0 125 14 150 5 C175 0 190 10 197 18 L197 277 L3 277 Z"
        />
        <EdgeFlame x={40} y={10} />
        <EdgeFlame x={100} y={6} />
        <EdgeFlame x={160} y={10} />
        <EdgeStar x={12} y={80} />
        <EdgeStar x={188} y={80} />
      </Border>
    ),
    ornaments: [
      { kind: 'flame', pos: 'tl' },
      { kind: 'spark', pos: 'tr' },
      { kind: 'book', pos: 'br' },
    ],
  },
  Warlock: {
    border: (
      <Border>
        <path
          {...s}
          d="M3 24 C24 4 60 14 100 5 C140 14 176 4 197 24 L197 256 C176 276 140 268 100 275 C60 268 24 276 3 256 Z"
        />
        <EdgeEye x={100} y={12} />
        <EdgeRune x={12} y={140} />
        <EdgeRune x={188} y={140} />
      </Border>
    ),
    ornaments: [
      { kind: 'eye', pos: 'tl' },
      { kind: 'rune', pos: 'tr' },
    ],
  },
  Wizard: {
    border: (
      <Border>
        <RectEdge rx={2} />
        <EdgeStar x={100} y={10} />
        <EdgeStar x={12} y={140} />
        <EdgeStar x={188} y={140} />
        <EdgeStar x={100} y={270} />
        <path
          {...s}
          strokeWidth={1.1}
          opacity={0.55}
          d="M3 14 H16 M3 3 V16 M184 3 H197 V16 M3 264 V277 H16 M184 277 H197 V264"
        />
      </Border>
    ),
    ornaments: [
      { kind: 'star', pos: 'tl' },
      { kind: 'arcane', pos: 'tr' },
      { kind: 'book', pos: 'br' },
    ],
  },
};

export function CardFrame() {
  const { theme } = useTheme();
  if (theme === 'Default') return null;

  const frame = frames[theme];
  return (
    <div className="card-frame" aria-hidden="true">
      {frame.border}
      <div className="card-frame-ornaments">
        {frame.ornaments.map((o) => (
          <span key={`${o.pos}-${o.kind}`} className={`card-frame-ornament is-${o.pos}`}>
            <OrnamentIcon kind={o.kind} />
          </span>
        ))}
      </div>
    </div>
  );
}
