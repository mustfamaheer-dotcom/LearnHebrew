import React, { useMemo } from 'react';

export interface StyledNicknameConfig {
  nicknameColor?: string | null;
  nicknameGlow?: boolean;
  nicknameGlowColor?: string | null;
  nicknameFont?: string | null;
  nicknameBadgeIcon?: string | null;
  nicknameCssClass?: string | null;
}

export interface StyledNicknameProps {
  name: string;
  nicknameItem?: StyledNicknameConfig | null;
  className?: string;
  truncate?: boolean;
}

export type NicknameFillMode = 'solid' | 'gradient' | 'pill';
export type NicknameTextFx = 'none' | 'soft' | 'neon' | 'fire' | 'outline';

export interface NicknameStudioTokens {
  baseClass: string;
  fill?: NicknameFillMode;
  grad2?: string;
  pillbg?: string;
  shimmer?: boolean;
  textfx?: NicknameTextFx;
}

const VALID_FILLS = new Set<string>(['solid', 'gradient', 'pill']);
const VALID_TEXTFX = new Set<string>(['none', 'soft', 'neon', 'fire', 'outline']);

export function parseNicknameStudioTokens(nicknameCssClass?: string | null): NicknameStudioTokens {
  const result: NicknameStudioTokens = { baseClass: '' };
  if (!nicknameCssClass) return result;

  const baseClasses: string[] = [];
  for (const token of nicknameCssClass.trim().split(/\s+/)) {
    if (!token) continue;
    const colonIdx = token.indexOf(':');
    if (colonIdx > 0) {
      const key = token.slice(0, colonIdx);
      const val = token.slice(colonIdx + 1);
      if (key === 'fill' && VALID_FILLS.has(val)) {
        result.fill = val as NicknameFillMode;
        continue;
      }
      if (key === 'grad2' && /^#[0-9a-fA-F]{3,8}$/.test(val)) {
        result.grad2 = val;
        continue;
      }
      if (key === 'pillbg' && /^#[0-9a-fA-F]{3,8}$/.test(val)) {
        result.pillbg = val;
        continue;
      }
      if (key === 'shimmer' && (val === '1' || val === 'true')) {
        result.shimmer = true;
        continue;
      }
      if (key === 'textfx' && VALID_TEXTFX.has(val)) {
        result.textfx = val as NicknameTextFx;
        continue;
      }
    }
    baseClasses.push(token);
  }

  result.baseClass = baseClasses.join(' ');
  return result;
}

export function buildNicknameCssClass(tokens: Partial<NicknameStudioTokens>): string {
  const parts: string[] = [];
  if (tokens.baseClass?.trim()) parts.push(tokens.baseClass.trim());
  if (tokens.fill) parts.push(`fill:${tokens.fill}`);
  if (tokens.grad2) parts.push(`grad2:${tokens.grad2}`);
  if (tokens.pillbg) parts.push(`pillbg:${tokens.pillbg}`);
  if (tokens.shimmer) parts.push('shimmer:1');
  if (tokens.textfx) parts.push(`textfx:${tokens.textfx}`);
  return parts.join(' ');
}

export interface NicknamePresetMeta {
  cssClass: string;
  label: string;
  color: string;
  glow: boolean;
  glowColor?: string;
  font: string;
  badgeIcon: string;
  description: string;
}

export const NICKNAME_PRESETS: NicknamePresetMeta[] = [
  {
    cssClass: 'nickname-emerald-bold',
    label: 'Emerald Bold',
    color: '#059669',
    glow: true,
    glowColor: '#10b981',
    font: 'font-extrabold',
    badgeIcon: '🌿',
    description: 'Bold emerald text with soft green glow',
  },
  {
    cssClass: 'nickname-neon-cyan',
    label: 'Neon Cyan',
    color: '#22d3ee',
    glow: true,
    glowColor: '#06b6d4',
    font: 'font-bold',
    badgeIcon: '⚡',
    description: 'Electric cyan neon text',
  },
  {
    cssClass: 'nickname-frost-ice',
    label: 'Frost Ice',
    color: '#38bdf8',
    glow: true,
    glowColor: '#bae6fd',
    font: 'font-bold tracking-wide',
    badgeIcon: '❄️',
    description: 'Icy crystal glow with crisp letter spacing',
  },
  {
    cssClass: 'nickname-purple-glow',
    label: 'Purple Glow',
    color: '#9333ea',
    glow: true,
    glowColor: '#c084fc',
    font: 'font-bold',
    badgeIcon: '🔮',
    description: 'Mystic violet glow',
  },
  {
    cssClass: 'nickname-ocean-gradient',
    label: 'Ocean Gradient',
    color: 'linear-gradient(90deg, #0284c7, #06b6d4, #3b82f6)',
    glow: false,
    font: 'font-bold',
    badgeIcon: '🌊',
    description: 'Animated ocean wave gradient',
  },
  {
    cssClass: 'nickname-crimson-fire',
    label: 'Crimson Fire',
    color: 'linear-gradient(90deg, #dc2626, #f97316, #fbbf24)',
    glow: true,
    glowColor: '#ef4444',
    font: 'font-extrabold italic',
    badgeIcon: '🔥',
    description: 'Animated fiery italic gradient',
  },
  {
    cssClass: 'nickname-aurora-wave',
    label: 'Aurora Wave',
    color: 'linear-gradient(90deg, #10b981, #06b6d4, #8b5cf6, #ec4899)',
    glow: false,
    font: 'font-extrabold',
    badgeIcon: '✨',
    description: 'Animated northern lights gradient',
  },
  {
    cssClass: 'nickname-cyber-glitch',
    label: 'Cyber Glitch',
    color: '#22d3ee',
    glow: false,
    font: 'font-mono font-extrabold uppercase tracking-wider',
    badgeIcon: '👾',
    description: 'Monospace uppercase cybernetic glitch effect',
  },
  {
    cssClass: 'nickname-sakura-tag',
    label: 'Sakura Ribbon',
    color: '#be185d',
    glow: false,
    font: 'font-bold',
    badgeIcon: '🌸',
    description: 'Soft cherry-blossom pill badge',
  },
  {
    cssClass: 'nickname-dark-velvet',
    label: 'Dark Velvet',
    color: '#f8fafc',
    glow: false,
    font: 'font-bold tracking-wide',
    badgeIcon: '🖤',
    description: 'Sleek obsidian badge with rose-gold border',
  },
  {
    cssClass: 'nickname-royal-banner',
    label: 'Royal Banner',
    color: '#fef3c7',
    glow: false,
    font: 'font-serif font-bold',
    badgeIcon: '👑',
    description: 'Gold-trimmed royal purple serif ribbon',
  },
  {
    cssClass: 'nickname-gold-legendary',
    label: 'Gold Legendary',
    color: 'linear-gradient(90deg, #d97706, #fde047, #f59e0b)',
    glow: true,
    glowColor: '#fbbf24',
    font: 'font-extrabold',
    badgeIcon: '🏆',
    description: 'Shimmering golden championship gradient',
  },
  {
    cssClass: 'nickname-rainbow-legendary',
    label: 'Rainbow Legendary',
    color: 'linear-gradient(90deg, #f43f5e, #f59e0b, #10b981, #3b82f6, #a855f7)',
    glow: false,
    font: 'font-extrabold',
    badgeIcon: '🌈',
    description: 'Prismatic animated rainbow gradient',
  },
];

const PILL_BADGE_CLASSES = new Set([
  'nickname-royal-banner',
  'nickname-dark-velvet',
  'nickname-sakura-tag',
]);

export const StyledNickname: React.FC<StyledNicknameProps> = ({
  name,
  nicknameItem,
  className = '',
  truncate = false,
}) => {
  const tokens = useMemo(
    () => parseNicknameStudioTokens(nicknameItem?.nicknameCssClass),
    [nicknameItem?.nicknameCssClass]
  );

  if (!nicknameItem) {
    return (
      <span className={`${truncate ? 'truncate' : ''} ${className}`.trim()}>
        {name}
      </span>
    );
  }

  const {
    nicknameColor,
    nicknameGlow,
    nicknameGlowColor,
    nicknameFont,
    nicknameBadgeIcon,
  } = nicknameItem;

  const isGradientColorString =
    typeof nicknameColor === 'string' &&
    (nicknameColor.includes('gradient(') ||
      nicknameColor.includes('linear-gradient') ||
      nicknameColor.includes('radial-gradient'));

  const primaryPresetClass = tokens.baseClass.split(' ')[0] || '';
  const isPresetPill = PILL_BADGE_CLASSES.has(primaryPresetClass);
  const isCustomPill = tokens.fill === 'pill';
  const isPill = isCustomPill || (isPresetPill && tokens.fill !== 'solid' && tokens.fill !== 'gradient');
  const isCustomGradient = tokens.fill === 'gradient';

  const textStyle: React.CSSProperties = {};
  const wrapperStyle: React.CSSProperties = {};

  if (isCustomPill) {
    wrapperStyle.backgroundColor = tokens.pillbg || '#1e1b4b';
    wrapperStyle.borderColor = nicknameColor || '#fbbf24';
    wrapperStyle.borderWidth = '1.5px';
    wrapperStyle.borderStyle = 'solid';
    textStyle.color = nicknameColor || '#ffffff';
  } else if (isCustomGradient) {
    const c1 = !isGradientColorString && nicknameColor ? nicknameColor : '#f59e0b';
    const c2 = tokens.grad2 || '#ec4899';
    textStyle.backgroundImage = tokens.shimmer
      ? `linear-gradient(90deg, ${c1}, ${c2}, ${c1})`
      : `linear-gradient(90deg, ${c1}, ${c2})`;
    textStyle.WebkitBackgroundClip = 'text';
    textStyle.backgroundClip = 'text';
    textStyle.WebkitTextFillColor = 'transparent';
    textStyle.color = 'transparent';
  } else if (!isPill) {
    if (nicknameColor && (!tokens.baseClass || tokens.fill === 'solid')) {
      if (isGradientColorString) {
        textStyle.backgroundImage = nicknameColor;
        textStyle.WebkitBackgroundClip = 'text';
        textStyle.backgroundClip = 'text';
        textStyle.WebkitTextFillColor = 'transparent';
        textStyle.color = 'transparent';
      } else {
        textStyle.color = nicknameColor;
      }
    } else if (nicknameColor && tokens.baseClass && !isGradientColorString) {
      textStyle.color = nicknameColor;
    }
  }

  // Text FX / Glow handling
  const resolvedGlowColor =
    nicknameGlowColor || (!isGradientColorString && nicknameColor ? nicknameColor : '#9333ea');

  if (tokens.textfx === 'none') {
    textStyle.textShadow = 'none';
  } else if (tokens.textfx === 'soft') {
    if (isCustomGradient || isGradientColorString) {
      textStyle.filter = `drop-shadow(0 0 4px ${resolvedGlowColor}88)`;
    } else {
      textStyle.textShadow = `0 1px 6px ${resolvedGlowColor}88`;
    }
  } else if (tokens.textfx === 'neon') {
    if (isCustomGradient || isGradientColorString) {
      textStyle.filter = `drop-shadow(0 0 6px ${resolvedGlowColor})`;
    } else {
      textStyle.textShadow = `0 0 8px ${resolvedGlowColor}, 0 0 18px ${resolvedGlowColor}aa`;
    }
  } else if (tokens.textfx === 'fire') {
    if (isCustomGradient || isGradientColorString) {
      textStyle.filter = 'drop-shadow(0 0 6px #f97316)';
    } else {
      textStyle.textShadow = '0 0 6px #fbbf24, 0 -2px 12px #f97316, 0 -4px 18px #ef4444';
    }
  } else if (tokens.textfx === 'outline') {
    textStyle.WebkitTextStroke = `0.6px ${resolvedGlowColor}`;
  } else if (nicknameGlow && !isPill) {
    if (isCustomGradient || isGradientColorString) {
      textStyle.filter = `drop-shadow(0 0 6px ${resolvedGlowColor}99)`;
    } else {
      textStyle.textShadow = `0 0 8px ${resolvedGlowColor}, 0 0 16px ${resolvedGlowColor}66`;
    }
  }

  const textClasses = [
    nicknameFont || '',
    !isPill && !isCustomGradient ? tokens.baseClass : '',
    tokens.shimmer ? 'store-text-shimmer-anim' : '',
    truncate ? 'truncate' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const wrapperClasses = [
    'inline-flex items-center gap-1',
    isCustomPill ? 'px-2.5 py-0.5 rounded-full shadow-sm' : '',
    !isCustomPill && isPill ? tokens.baseClass : '',
    truncate ? 'min-w-0 max-w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={wrapperClasses} style={wrapperStyle}>
      {nicknameBadgeIcon && (
        <span className="shrink-0 leading-none" aria-hidden="true">
          {nicknameBadgeIcon}
        </span>
      )}
      <span className={textClasses} style={textStyle}>
        {name}
      </span>
    </span>
  );
};

export default StyledNickname;
