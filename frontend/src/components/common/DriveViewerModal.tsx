import React, { useState } from 'react';
import { X, ExternalLink, Maximize2, Minimize2, FileText, PlayCircle } from 'lucide-react';
import { getDriveEmbedUrl, isGoogleDriveUrl, detectAttachmentType } from '../../lib/driveUtils';

interface DriveViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  subtitle?: string;
}

export const DriveViewerModal: React.FC<DriveViewerModalProps> = ({
  isOpen,
  onClose,
  url,
  title,
  subtitle,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  if (!isOpen || !url) return null;

  const embedUrl = isGoogleDriveUrl(url) ? getDriveEmbedUrl(url) : url;
  const isVideo =
    url.includes('video') ||
    url.includes('youtube') ||
    url.includes('youtu.be') ||
    url.includes('.mp4') ||
    url.includes('.mov') ||
    detectAttachmentType(url) === 'drive-video' ||
    detectAttachmentType(url) === 'youtube';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div
        className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isMaximized
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-5xl h-[88vh]'
        }`}
      >
        {/* Header Bar with Sharp Contrast and Vibrant Brand Accents */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs ${
                isVideo
                  ? 'bg-brand-olive-100 dark:bg-brand-olive-950/80 text-brand-olive-950 dark:text-brand-olive-200 border-brand-olive-300 dark:border-brand-olive-700'
                  : 'bg-brand-teal-100 dark:bg-brand-teal-950/80 text-brand-teal-950 dark:text-brand-teal-200 border-brand-teal-300 dark:border-brand-teal-800'
              }`}
            >
              {isVideo ? <PlayCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate tracking-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Open Original in New Tab */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-slate-800 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white bg-slate-100/90 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors font-bold text-xs flex items-center gap-1.5 border border-slate-200/70 dark:border-slate-700 shadow-2xs"
              title="Open external link"
            >
              <ExternalLink className="w-4 h-4 text-brand-teal-700 dark:text-brand-teal-400" />
              <span className="hidden sm:inline">Drive Link</span>
            </a>

            {/* Toggle Fullscreen / Maximize */}
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 sm:p-2.5 rounded-xl text-slate-700 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white bg-slate-100/90 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200/70 dark:border-slate-700 transition-colors"
              title={isMaximized ? 'Restore size' : 'Maximize viewer'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-slate-700 dark:text-slate-200" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-xl text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 bg-slate-100/90 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/70 dark:border-slate-700 transition-colors ml-1"
              title="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF / Document Embed Body */}
        <div className="flex-1 w-full h-full bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen"
              title={title}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <FileText className="w-12 h-12 text-slate-400 mb-3" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Unable to preview document directly.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 px-4 py-2 bg-brand-teal-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Google Drive</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
