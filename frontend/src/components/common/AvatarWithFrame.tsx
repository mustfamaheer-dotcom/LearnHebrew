import React, { useEffect, useId, useMemo, useState } from 'react';
import { getAvatarUrl } from '../../utils/avatar';

export interface AvatarFrameConfig {
  frameImageUrl?: string | null;
  frameAnimated?: boolean;
  frameCssClass?: string | null;
  frameBorderColor?: string | null;
  frameBorderRadius?: string | null;
}

export interface AvatarWithFrameProps {
  avatarUrl?: string | null;
  studentName: string;
  frameItem?: AvatarFrameConfig | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export type FrameRingStyle = 'solid' | 'double' | 'dashed' | 'dotted' | 'gradient' | 'conic';
export type FrameThickness = 2 | 3 | 4 | 5 | 6;
export type FrameGlowLevel = 'none' | 'soft' | 'strong' | 'neon';
export type FrameShape = 'circle' | 'squircle' | 'rounded' | 'hex';
export type FrameOrnament =
  | 'none'
  | 'crown'
  | 'fire'
  | 'sparkle'
  | 'star'
  | 'diamond'
  | 'sakura'
  | 'snow'
  | 'halo'
  | 'bolt'
  | 'vip'
  | 'hud';

export interface FrameStudioTokens {
  baseClass: string;
  ring?: FrameRingStyle;
  thick?: FrameThickness;
  glow?: FrameGlowLevel;
  grad2?: string;
  shape?: FrameShape;
  ornament?: FrameOrnament;
}

const VALID_RINGS = new Set<string>(['solid', 'double', 'dashed', 'dotted', 'gradient', 'conic']);
const VALID_THICKS = new Set<number>([2, 3, 4, 5, 6]);
const VALID_GLOWS = new Set<string>(['none', 'soft', 'strong', 'neon']);
const VALID_SHAPES = new Set<string>(['circle', 'squircle', 'rounded', 'hex']);
const VALID_ORNAMENTS = new Set<string>([
  'none',
  'crown',
  'fire',
  'sparkle',
  'star',
  'diamond',
  'sakura',
  'snow',
  'halo',
  'bolt',
  'vip',
  'hud',
]);

export function parseFrameStudioTokens(frameCssClass?: string | null): FrameStudioTokens {
  const result: FrameStudioTokens = { baseClass: '' };
  if (!frameCssClass) return result;

  const baseClasses: string[] = [];
  for (const token of frameCssClass.trim().split(/\s+/)) {
    if (!token) continue;
    const colonIdx = token.indexOf(':');
    if (colonIdx > 0) {
      const key = token.slice(0, colonIdx);
      const val = token.slice(colonIdx + 1);
      if (key === 'ring' && VALID_RINGS.has(val)) {
        result.ring = val as FrameRingStyle;
        continue;
      }
      if (key === 'thick') {
        const num = Number(val);
        if (VALID_THICKS.has(num)) {
          result.thick = num as FrameThickness;
          continue;
        }
      }
      if (key === 'glow' && VALID_GLOWS.has(val)) {
        result.glow = val as FrameGlowLevel;
        continue;
      }
      if (key === 'grad2' && /^#[0-9a-fA-F]{3,8}$/.test(val)) {
        result.grad2 = val;
        continue;
      }
      if (key === 'shape' && VALID_SHAPES.has(val)) {
        result.shape = val as FrameShape;
        continue;
      }
      if (key === 'ornament' && VALID_ORNAMENTS.has(val)) {
        result.ornament = val as FrameOrnament;
        continue;
      }
    }
    baseClasses.push(token);
  }

  result.baseClass = baseClasses.join(' ');
  return result;
}

export function buildFrameCssClass(tokens: Partial<FrameStudioTokens>): string {
  const parts: string[] = [];
  if (tokens.baseClass?.trim()) parts.push(tokens.baseClass.trim());
  if (tokens.ring) parts.push(`ring:${tokens.ring}`);
  if (tokens.thick) parts.push(`thick:${tokens.thick}`);
  if (tokens.glow) parts.push(`glow:${tokens.glow}`);
  if (tokens.grad2) parts.push(`grad2:${tokens.grad2}`);
  if (tokens.shape) parts.push(`shape:${tokens.shape}`);
  if (tokens.ornament) parts.push(`ornament:${tokens.ornament}`);
  return parts.join(' ');
}

export interface FramePresetMeta {
  cssClass: string;
  label: string;
  borderColor: string;
  borderRadius: string;
  animated: boolean;
  description: string;
}

export const FRAME_PRESETS: FramePresetMeta[] = [
  {
    cssClass: 'frame-bronze-classic',
    label: 'Bronze Classic',
    borderColor: '#d97706',
    borderRadius: '50%',
    animated: false,
    description: 'Antique double-bevel bronze ring',
  },
  {
    cssClass: 'frame-silver-frost',
    label: 'Silver Frost',
    borderColor: '#e2e8f0',
    borderRadius: '50%',
    animated: false,
    description: 'Frosted ice crystal ring with snowflake accents',
  },
  {
    cssClass: 'frame-emerald-pulse',
    label: 'Emerald Pulse',
    borderColor: '#10b981',
    borderRadius: '50%',
    animated: true,
    description: 'Glowing emerald radar pulse',
  },
  {
    cssClass: 'frame-neon-cyan',
    label: 'Neon Cyan',
    borderColor: '#22d3ee',
    borderRadius: '50%',
    animated: true,
    description: 'Dashed cybernetic ring with corner HUD brackets',
  },
  {
    cssClass: 'frame-cyber-hex',
    label: 'Cyber Hex Shield',
    borderColor: '#06b6d4',
    borderRadius: '24%',
    animated: true,
    description: 'Futuristic squircle tech shield with HUD corners',
  },
  {
    cssClass: 'frame-royal-purple',
    label: 'Royal Purple',
    borderColor: '#9333ea',
    borderRadius: '50%',
    animated: true,
    description: 'Amethyst double ring with royal sparkle gems',
  },
  {
    cssClass: 'frame-sakura-blossom',
    label: 'Sakura Blossom',
    borderColor: '#f472b6',
    borderRadius: '50%',
    animated: true,
    description: 'Soft rose ring with floating sakura petals',
  },
  {
    cssClass: 'frame-crimson-flame',
    label: 'Crimson Flame',
    borderColor: '#ef4444',
    borderRadius: '50%',
    animated: true,
    description: 'Fiery flicker ring with rising ember accents',
  },
  {
    cssClass: 'frame-starlight-galaxy',
    label: 'Starlight Galaxy',
    borderColor: '#6366f1',
    borderRadius: '50%',
    animated: true,
    description: 'Cosmic indigo ring with twinkling starlight dots',
  },
  {
    cssClass: 'frame-gold-glow',
    label: 'Gold Glow',
    borderColor: '#ffd700',
    borderRadius: '50%',
    animated: true,
    description: 'Golden laurel halo with top crown',
  },
  {
    cssClass: 'frame-royal-crown',
    label: 'Royal Crown',
    borderColor: '#f59e0b',
    borderRadius: '50%',
    animated: true,
    description: 'Ornate gold & violet ring crowned with a royal crest',
  },
  {
    cssClass: 'frame-angel-halo',
    label: 'Angel Halo',
    borderColor: '#fef08a',
    borderRadius: '50%',
    animated: true,
    description: 'Radiant celestial ring with floating golden halo',
  },
  {
    cssClass: 'frame-aurora-borealis',
    label: 'Aurora Borealis',
    borderColor: '#10b981',
    borderRadius: '50%',
    animated: true,
    description: 'Spinning conic-gradient northern lights ring',
  },
  {
    cssClass: 'frame-cyber-neon',
    label: 'Cyber Neon',
    borderColor: '#ec4899',
    borderRadius: '24%',
    animated: true,
    description: 'Spinning dual-tone cyan & magenta squircle ring',
  },
  {
    cssClass: 'frame-rainbow-legendary',
    label: 'Rainbow Legendary',
    borderColor: '#a855f7',
    borderRadius: '50%',
    animated: true,
    description: 'Spinning prismatic rainbow ring with orbiting stars',
  },
];

const SIZE_CLASSES: Record<NonNullable<AvatarWithFrameProps['size']>, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

const ORNAMENT_SCALE: Record<NonNullable<AvatarWithFrameProps['size']>, string> = {
  sm: 'text-[9px]',
  md: 'text-[11px]',
  lg: 'text-sm',
  xl: 'text-base',
};

const INITIALS_BG_PALETTE = [
  'from-indigo-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-sky-500 to-blue-600',
  'from-violet-500 to-fuchsia-600',
];

const HEX_CLIP_PATH = 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)';

function getInitials(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function getBgGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return INITIALS_BG_PALETTE[Math.abs(hash) % INITIALS_BG_PALETTE.length];
}

const CONIC_FRAME_CLASSES = new Set([
  'frame-rainbow-legendary',
  'frame-aurora-borealis',
  'frame-cyber-neon',
]);

const SQUIRCLE_DEFAULT_CLASSES = new Set(['frame-cyber-hex', 'frame-cyber-neon']);

const PRESET_DEFAULT_ORNAMENT: Record<string, FrameOrnament> = {
  'frame-gold-glow': 'crown',
  'frame-royal-crown': 'vip',
  'frame-angel-halo': 'halo',
  'frame-crimson-flame': 'fire',
  'frame-neon-cyan': 'hud',
  'frame-cyber-hex': 'hud',
  'frame-starlight-galaxy': 'star',
  'frame-rainbow-legendary': 'star',
  'frame-sakura-blossom': 'sakura',
  'frame-silver-frost': 'snow',
  'frame-royal-purple': 'diamond',
};

const FrameOrnaments: React.FC<{
  ornament?: FrameOrnament;
  size: NonNullable<AvatarWithFrameProps['size']>;
}> = ({ ornament, size }) => {
  if (!ornament || ornament === 'none') return null;
  const textScale = ORNAMENT_SCALE[size];
  const isCompact = size === 'sm';

  if (ornament === 'crown' || ornament === 'vip') {
    return (
      <>
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute -top-2.5 left-1/2 z-30 -translate-x-1/2 leading-none drop-shadow ${textScale} store-float-gentle`}
        >
          👑
        </span>
        {!isCompact && ornament === 'vip' && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-1 left-1/2 z-30 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-1.5 py-[1px] text-[7px] font-black uppercase tracking-wider text-purple-950 shadow"
          >
            VIP
          </span>
        )}
      </>
    );
  }

  if (ornament === 'halo') {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 rounded-full border-2 border-yellow-200 bg-yellow-300/20 shadow-[0_0_10px_rgba(253,224,71,0.95)] store-float-gentle ${
          isCompact ? '-top-2 h-1.5 w-5' : '-top-3 h-2 w-8'
        }`}
      />
    );
  }

  if (ornament === 'fire') {
    return (
      <>
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute -top-2 -right-1 z-30 leading-none drop-shadow ${textScale} store-float-gentle`}
        >
          🔥
        </span>
        {!isCompact && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute -bottom-1 -left-1 z-30 leading-none drop-shadow ${textScale} store-twinkle`}
          >
            🔥
          </span>
        )}
      </>
    );
  }

  if (ornament === 'hud') {
    const cornerSize = isCompact ? 'h-2 w-2' : 'h-2.5 w-2.5';
    return (
      <div aria-hidden="true" className="pointer-events-none absolute -inset-1 z-30">
        <span className={`absolute top-0 left-0 ${cornerSize} border-t-2 border-l-2 border-cyan-300`} />
        <span className={`absolute top-0 right-0 ${cornerSize} border-t-2 border-r-2 border-cyan-300`} />
        <span className={`absolute bottom-0 left-0 ${cornerSize} border-b-2 border-l-2 border-cyan-300`} />
        <span className={`absolute bottom-0 right-0 ${cornerSize} border-b-2 border-r-2 border-cyan-300`} />
      </div>
    );
  }

  if (ornament === 'star') {
    return (
      <>
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute -top-1.5 -right-1 z-30 text-amber-300 drop-shadow-[0_0_6px_rgba(253,224,71,0.9)] ${textScale} store-twinkle`}
        >
          ✦
        </span>
        {!isCompact && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute -bottom-1 -left-1.5 z-30 text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.9)] ${textScale} store-twinkle`}
            style={{ animationDelay: '0.7s' }}
          >
            ✦
          </span>
        )}
      </>
    );
  }

  if (ornament === 'sparkle') {
    return (
      <>
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute -top-1.5 -right-1 z-30 leading-none drop-shadow ${textScale} store-twinkle`}
        >
          ✨
        </span>
        {!isCompact && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute -bottom-1 -left-1 z-30 leading-none drop-shadow ${textScale} store-float-gentle`}
          >
            ✨
          </span>
        )}
      </>
    );
  }

  if (ornament === 'sakura') {
    return (
      <>
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute -top-1.5 -right-1 z-30 leading-none drop-shadow ${textScale} store-float-gentle`}
        >
          🌸
        </span>
        {!isCompact && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute -bottom-1 -left-1 z-30 leading-none drop-shadow ${textScale} store-twinkle`}
          >
            🌸
          </span>
        )}
      </>
    );
  }

  const singleEmojiMap: Partial<Record<FrameOrnament, string>> = {
    snow: '❄️',
    diamond: '💎',
    bolt: '⚡',
  };
  const emoji = singleEmojiMap[ornament];
  if (!emoji) return null;

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute -top-1.5 -right-1 z-30 leading-none drop-shadow ${textScale} store-twinkle`}
    >
      {emoji}
    </span>
  );
};

export const AvatarWithFrame: React.FC<AvatarWithFrameProps> = ({
  avatarUrl,
  studentName,
  frameItem,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const svgGradId = useId().replace(/:/g, '');

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  const resolvedAvatarUrl = useMemo(() => getAvatarUrl(avatarUrl), [avatarUrl]);
  const initials = useMemo(() => getInitials(studentName), [studentName]);
  const bgGradient = useMemo(() => getBgGradient(studentName || ''), [studentName]);

  const tokens = useMemo(
    () => parseFrameStudioTokens(frameItem?.frameCssClass),
    [frameItem?.frameCssClass]
  );

  const primaryPresetClass = tokens.baseClass.split(' ')[0] || '';
  const isHexShape = tokens.shape === 'hex';

  const shapeRadius = useMemo(() => {
    if (tokens.shape === 'circle') return '50%';
    if (tokens.shape === 'squircle') return '24%';
    if (tokens.shape === 'rounded') return '14px';
    if (tokens.shape === 'hex') return '0px';
    if (frameItem?.frameBorderRadius) return frameItem.frameBorderRadius;
    return SQUIRCLE_DEFAULT_CLASSES.has(primaryPresetClass) ? '24%' : '50%';
  }, [tokens.shape, frameItem?.frameBorderRadius, primaryPresetClass]);

  const showImage = Boolean(resolvedAvatarUrl) && !imgError;

  const isPresetConic = CONIC_FRAME_CLASSES.has(primaryPresetClass);
  const isTokenGradientOrConic = tokens.ring === 'gradient' || tokens.ring === 'conic';

  const c1 = frameItem?.frameBorderColor || '#ffd700';
  const c2 = tokens.grad2 || '#ff6b00';
  const thickness = tokens.thick ?? 3;

  const glowFilterOrShadow = useMemo(() => {
    if (tokens.glow === 'none') return 'none';
    if (tokens.glow === 'soft') return `0 0 10px ${c1}88`;
    if (tokens.glow === 'strong') return `0 0 16px ${c1}cc, 0 0 28px ${c2}66`;
    if (tokens.glow === 'neon') return `0 0 12px ${c1}, 0 0 24px ${c1}cc, 0 0 38px ${c2}99`;
    return undefined;
  }, [tokens.glow, c1, c2]);

  const resolvedOrnament: FrameOrnament | undefined =
    tokens.ornament ?? PRESET_DEFAULT_ORNAMENT[primaryPresetClass];

  const frameOverlayClasses = [
    'pointer-events-none absolute -inset-[3px] z-10',
    tokens.baseClass,
    frameItem?.frameAnimated ? 'animated frame-animated' : '',
    tokens.ring === 'conic' && frameItem?.frameAnimated ? 'store-spin-slow' : '',
    isTokenGradientOrConic ? 'store-ring-mask' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const frameOverlayStyle: React.CSSProperties = {
    borderRadius: shapeRadius,
  };

  if (isTokenGradientOrConic) {
    frameOverlayStyle.border = 'none';
    frameOverlayStyle.outline = 'none';
    frameOverlayStyle.padding = `${thickness}px`;
    frameOverlayStyle.background =
      tokens.ring === 'conic'
        ? `conic-gradient(from 0deg, ${c1}, ${c2}, ${c1})`
        : `linear-gradient(135deg, ${c1}, ${c2})`;
  } else if (!isPresetConic) {
    if (tokens.ring) {
      frameOverlayStyle.borderStyle = tokens.ring;
      frameOverlayStyle.borderWidth = `${thickness}px`;
      frameOverlayStyle.borderColor = c1;
    } else {
      if (tokens.thick) {
        frameOverlayStyle.borderWidth = `${thickness}px`;
      }
      if (frameItem?.frameBorderColor && !tokens.baseClass) {
        frameOverlayStyle.border = `${thickness}px solid ${c1}`;
      } else if (frameItem?.frameBorderColor) {
        frameOverlayStyle.borderColor = c1;
      }
    }
  }

  if (glowFilterOrShadow !== undefined) {
    frameOverlayStyle.boxShadow = glowFilterOrShadow;
  }

  return (
    <div
      className={`relative inline-flex shrink-0 select-none items-center justify-center ${SIZE_CLASSES[size]} ${className}`}
      style={{ borderRadius: shapeRadius }}
    >
      {/* Base Avatar (Image or Initials Fallback) */}
      <div
        className={`relative flex h-full w-full items-center justify-center overflow-hidden ${
          showImage
            ? 'bg-slate-100 dark:bg-slate-800'
            : `bg-gradient-to-br ${bgGradient} font-semibold text-white`
        }`}
        style={
          isHexShape
            ? { clipPath: HEX_CLIP_PATH }
            : { borderRadius: shapeRadius }
        }
      >
        {showImage ? (
          <img
            src={resolvedAvatarUrl}
            alt={studentName}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span aria-label={studentName}>{initials}</span>
        )}
      </div>

      {/* Hexagon SVG Frame Overlay */}
      {frameItem && isHexShape && (
        <svg
          viewBox="0 0 100 100"
          aria-hidden="true"
          className={`pointer-events-none absolute -inset-[4px] z-10 h-[calc(100%+8px)] w-[calc(100%+8px)] ${
            frameItem.frameAnimated ? 'animate-pulse' : ''
          }`}
          style={{
            filter:
              tokens.glow && tokens.glow !== 'none'
                ? `drop-shadow(0 0 ${tokens.glow === 'neon' ? '8px' : '5px'} ${c1})`
                : undefined,
          }}
        >
          <defs>
            <linearGradient id={svgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={isTokenGradientOrConic ? c2 : c1} />
            </linearGradient>
          </defs>
          <polygon
            points="50,3 93,26 93,74 50,97 7,74 7,26"
            fill="none"
            stroke={`url(#${svgGradId})`}
            strokeWidth={thickness * 1.4}
            strokeLinejoin="round"
            strokeDasharray={
              tokens.ring === 'dashed'
                ? '10 5'
                : tokens.ring === 'dotted'
                ? '3 5'
                : undefined
            }
          />
        </svg>
      )}

      {/* Standard CSS / Gradient / Conic Frame Overlay */}
      {frameItem && !isHexShape && (tokens.baseClass || frameItem.frameBorderColor || tokens.ring) && (
        <div
          className={frameOverlayClasses}
          style={frameOverlayStyle}
          aria-hidden="true"
        />
      )}

      {/* Ornate / Badge / Corner Ornaments */}
      {frameItem && (
        <FrameOrnaments ornament={resolvedOrnament} size={size} />
      )}

      {/* Optional Frame Image Overlay */}
      {frameItem?.frameImageUrl && (
        <img
          src={getAvatarUrl(frameItem.frameImageUrl) || frameItem.frameImageUrl}
          alt=""
          aria-hidden="true"
          className={`pointer-events-none absolute -inset-1.5 z-20 h-[calc(100%+12px)] w-[calc(100%+12px)] max-w-none object-contain ${
            frameItem.frameAnimated ? 'animate-pulse' : ''
          }`}
        />
      )}
    </div>
  );
};

export default AvatarWithFrame;
