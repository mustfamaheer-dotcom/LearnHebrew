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

const SIZE_CLASSES: Record<NonNullable<AvatarWithFrameProps['size']>, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
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

  const borderRadius = frameItem?.frameBorderRadius || '50%';
  const showImage = Boolean(resolvedAvatarUrl) && !imgError;

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

  if (frameItem?.frameBorderColor && !frameItem?.frameCssClass) {
    frameOverlayStyle.border = `3px solid ${frameItem.frameBorderColor}`;
  } else if (frameItem?.frameBorderColor) {
    frameOverlayStyle.borderColor = frameItem.frameBorderColor;
  }

  return (
    <div
      className={`relative inline-flex shrink-0 select-none items-center justify-center ${SIZE_CLASSES[size]} ${className}`}
      style={{ borderRadius }}
    >
      {/* Base Avatar (Image or Initials Fallback) */}
      <div
        className={`relative flex h-full w-full items-center justify-center overflow-hidden ${
          showImage ? 'bg-slate-100 dark:bg-slate-800' : `bg-gradient-to-br ${bgGradient} text-white font-semibold`
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

      {/* CSS / Border Frame Overlay */}
      {frameItem && (frameItem.frameCssClass || frameItem.frameBorderColor) && (
        <div
          className={frameOverlayClasses}
          style={frameOverlayStyle}
          aria-hidden="true"
        />
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
