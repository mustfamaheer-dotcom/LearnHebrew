import React, { useEffect, useMemo, useState } from 'react';
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

const FrameOrnaments: React.FC<{
  cssClass?: string | null;
  size: NonNullable<AvatarWithFrameProps['size']>;
}> = ({ cssClass, size }) => {
  if (!cssClass) return null;
  const textScale = ORNAMENT_SCALE[size];
  const isCompact = size === 'sm';

  if (cssClass === 'frame-gold-glow' || cssClass === 'frame-royal-crown') {
    return (
      <>
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute -top-2.5 left-1/2 z-30 -translate-x-1/2 leading-none drop-shadow ${textScale} store-float-gentle`}
        >
          👑
        </span>
        {!isCompact && cssClass === 'frame-royal-crown' && (
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

  if (cssClass === 'frame-angel-halo') {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 rounded-full border-2 border-yellow-200 bg-yellow-300/20 shadow-[0_0_10px_rgba(253,224,71,0.95)] store-float-gentle ${
          isCompact ? '-top-2 h-1.5 w-5' : '-top-3 h-2 w-8'
        }`}
      />
    );
  }

  if (cssClass === 'frame-crimson-flame') {
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

  if (cssClass === 'frame-neon-cyan' || cssClass === 'frame-cyber-hex') {
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

  if (cssClass === 'frame-starlight-galaxy' || cssClass === 'frame-rainbow-legendary') {
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

  if (cssClass === 'frame-sakura-blossom') {
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

  if (cssClass === 'frame-silver-frost') {
    return (
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -top-1.5 -right-1 z-30 leading-none drop-shadow ${textScale} store-twinkle`}
      >
        ❄️
      </span>
    );
  }

  if (cssClass === 'frame-royal-purple') {
    return (
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -top-1.5 -right-1 z-30 text-purple-300 drop-shadow-[0_0_6px_rgba(192,132,252,0.9)] ${textScale} store-twinkle`}
      >
        💎
      </span>
    );
  }

  return null;
};

export const AvatarWithFrame: React.FC<AvatarWithFrameProps> = ({
  avatarUrl,
  studentName,
  frameItem,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  const resolvedAvatarUrl = useMemo(() => getAvatarUrl(avatarUrl), [avatarUrl]);
  const initials = useMemo(() => getInitials(studentName), [studentName]);
  const bgGradient = useMemo(() => getBgGradient(studentName || ''), [studentName]);

  const defaultRadius =
    frameItem?.frameCssClass && SQUIRCLE_DEFAULT_CLASSES.has(frameItem.frameCssClass)
      ? '24%'
      : '50%';
  const borderRadius = frameItem?.frameBorderRadius || defaultRadius;
  const showImage = Boolean(resolvedAvatarUrl) && !imgError;

  const isConicFrame = Boolean(
    frameItem?.frameCssClass && CONIC_FRAME_CLASSES.has(frameItem.frameCssClass)
  );

  const frameOverlayClasses = [
    'pointer-events-none absolute -inset-[3px] z-10',
    frameItem?.frameCssClass || '',
    frameItem?.frameAnimated ? 'animated frame-animated' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const frameOverlayStyle: React.CSSProperties = {
    borderRadius,
  };

  if (!isConicFrame) {
    if (frameItem?.frameBorderColor && !frameItem?.frameCssClass) {
      frameOverlayStyle.border = `3px solid ${frameItem.frameBorderColor}`;
    } else if (frameItem?.frameBorderColor) {
      frameOverlayStyle.borderColor = frameItem.frameBorderColor;
    }
  }

  return (
    <div
      className={`relative inline-flex shrink-0 select-none items-center justify-center ${SIZE_CLASSES[size]} ${className}`}
      style={{ borderRadius }}
    >
      {/* Base Avatar (Image or Initials Fallback) */}
      <div
        className={`relative flex h-full w-full items-center justify-center overflow-hidden ${
          showImage
            ? 'bg-slate-100 dark:bg-slate-800'
            : `bg-gradient-to-br ${bgGradient} font-semibold text-white`
        }`}
        style={{ borderRadius }}
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

      {/* CSS / Border / Conic-Gradient Frame Overlay */}
      {frameItem && (frameItem.frameCssClass || frameItem.frameBorderColor) && (
        <div
          className={frameOverlayClasses}
          style={frameOverlayStyle}
          aria-hidden="true"
        />
      )}

      {/* Ornate / Badge / Corner Ornaments */}
      {frameItem?.frameCssClass && (
        <FrameOrnaments cssClass={frameItem.frameCssClass} size={size} />
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
