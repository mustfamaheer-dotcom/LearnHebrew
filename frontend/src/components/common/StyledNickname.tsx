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
    (nicknameColor.includes('gradient(') || nicknameColor.includes('linear-gradient') || nicknameColor.includes('radial-gradient'));

  const textStyle: React.CSSProperties = {};

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
  } else if (nicknameColor && nicknameCssClass) {
    // Allow explicit color override only if not using a gradient CSS class
    if (!isGradientColor) {
      textStyle.color = nicknameColor;
    }
  }

  if (nicknameGlow) {
    const resolvedGlowColor =
      nicknameGlowColor || (!isGradientColor && nicknameColor ? nicknameColor : '#9333ea');
    textStyle.textShadow = `0 0 8px ${resolvedGlowColor}, 0 0 16px ${resolvedGlowColor}66`;
  }

  const textClasses = [
    nicknameFont || '',
    nicknameCssClass || '',
    truncate ? 'truncate' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={`inline-flex items-center gap-1 ${truncate ? 'min-w-0 max-w-full' : ''} ${className}`.trim()}
    >
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
