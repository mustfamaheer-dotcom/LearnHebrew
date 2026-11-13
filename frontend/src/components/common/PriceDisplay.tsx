import React from 'react';

interface PriceDisplayProps {
  price: number | string;
  originalPrice?: number | string | null;
  onSale?: boolean;
  currency?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isLightOnDark?: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  originalPrice,
  onSale,
  currency = 'USD',
  size = 'md',
  className = '',
  isLightOnDark = false,
}) => {
  const numPrice = Number(price) || 0;
  const numOriginal = originalPrice !== undefined && originalPrice !== null ? Number(originalPrice) : null;
  const hasSale = Boolean(onSale || (numOriginal && numOriginal > numPrice));

  const symbol = currency === 'ILS' ? '₪' : '$';

  const sizeClasses = {
    sm: { main: 'text-sm font-bold', orig: 'text-xs', badge: 'text-[10px] px-1.5 py-0.5' },
    md: { main: 'text-lg font-black', orig: 'text-xs', badge: 'text-[10px] px-2 py-0.5' },
    lg: { main: 'text-2xl sm:text-3xl font-black', orig: 'text-sm', badge: 'text-xs px-2.5 py-0.5' },
    xl: { main: 'text-3xl sm:text-4xl font-extrabold', orig: 'text-base', badge: 'text-xs px-2.5 py-1' },
  }[size];

  const discountPercent = hasSale && numOriginal && numOriginal > numPrice
    ? Math.round(((numOriginal - numPrice) / numOriginal) * 100)
    : null;

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      {hasSale && (
        <div className="flex items-center gap-1.5 mb-1">
          {numOriginal && (
            <span
              className={`line-through font-bold decoration-rose-500 decoration-2 ${sizeClasses.orig} ${
                isLightOnDark ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {symbol}{numOriginal.toFixed(0)}
            </span>
          )}
          <span
            className={`font-black uppercase tracking-wider rounded-full bg-rose-500 text-white shadow-xs animate-pulse ${sizeClasses.badge}`}
          >
            {discountPercent ? `Save ${discountPercent}%` : 'SALE'}
          </span>
        </div>
      )}

      <div className="flex items-baseline gap-1">
        <span
          className={`${sizeClasses.main} ${
            hasSale
              ? 'text-rose-600 dark:text-rose-400'
              : isLightOnDark
              ? 'text-white'
              : 'text-slate-900 dark:text-white'
          }`}
        >
          {symbol}{numPrice.toFixed(0)}
        </span>
        <span className={`text-xs font-semibold ${isLightOnDark ? 'text-slate-300' : 'text-slate-500'}`}>
          {currency}
        </span>
      </div>
    </div>
  );
};
