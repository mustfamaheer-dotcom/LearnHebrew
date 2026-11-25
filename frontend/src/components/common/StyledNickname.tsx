import React from 'react';

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
    nicknameCssClass,
  } = nicknameItem;

  const isGradientColor =
    typeof nicknameColor === 'string' &&
    (nicknameColor.includes('gradient(') ||
      nicknameColor.includes('linear-gradient') ||
      nicknameColor.includes('radial-gradient'));

  const isPillBadge = Boolean(nicknameCssClass && PILL_BADGE_CLASSES.has(nicknameCssClass));

  const textStyle: React.CSSProperties = {};

  if (!isPillBadge) {
    if (nicknameColor && !nicknameCssClass) {
      if (isGradientColor) {
        textStyle.backgroundImage = nicknameColor;
        textStyle.WebkitBackgroundClip = 'text';
        textStyle.backgroundClip = 'text';
        textStyle.WebkitTextFillColor = 'transparent';
        textStyle.color = 'transparent';
      } else {
        textStyle.color = nicknameColor;
      }
    } else if (nicknameColor && nicknameCssClass && !isGradientColor) {
      textStyle.color = nicknameColor;
    }

    if (nicknameGlow) {
      const resolvedGlowColor =
        nicknameGlowColor || (!isGradientColor && nicknameColor ? nicknameColor : '#9333ea');
      textStyle.textShadow = `0 0 8px ${resolvedGlowColor}, 0 0 16px ${resolvedGlowColor}66`;
    }
  }

  const textClasses = [
    nicknameFont || '',
    !isPillBadge ? nicknameCssClass || '' : '',
    truncate ? 'truncate' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const wrapperClasses = [
    'inline-flex items-center gap-1',
    isPillBadge ? nicknameCssClass || '' : '',
    truncate ? 'min-w-0 max-w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={wrapperClasses}>
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
