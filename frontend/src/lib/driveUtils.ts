/**
 * Utilities for parsing and transforming Google Drive and video URLs for in-system viewing
 */

export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;
  // Match https://drive.google.com/file/d/{FILE_ID}/...
  const matchD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) return matchD[1];

  // Match https://drive.google.com/open?id={FILE_ID} or id={FILE_ID}
  const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) return matchId[1];

  // Match https://docs.google.com/document/d/{FILE_ID}/...
  const matchDoc = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (matchDoc && matchDoc[1]) return matchDoc[1];

  // Match https://docs.google.com/presentation/d/{FILE_ID}/...
  const matchPres = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (matchPres && matchPres[1]) return matchPres[1];

  return null;
}

export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('drive.google.com') || url.includes('docs.google.com');
}

export function getDriveEmbedUrl(url: string): string | null {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return null;

  if (url.includes('docs.google.com/document')) {
    return `https://docs.google.com/document/d/${fileId}/preview`;
  }
  if (url.includes('docs.google.com/presentation')) {
    return `https://docs.google.com/presentation/d/${fileId}/embed`;
  }
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
  }
  return null;
}

export function getVideoEmbedUrl(url: string): string {
  if (!url) return '';
  const yt = getYouTubeEmbedUrl(url);
  if (yt) return yt;

  const drive = getDriveEmbedUrl(url);
  if (drive) return drive;

  return url;
}

export function detectAttachmentType(url: string): 'drive-pdf' | 'drive-video' | 'youtube' | 'external' {
  if (!url) return 'external';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (isGoogleDriveUrl(url)) {
    const lower = url.toLowerCase();
    if (lower.includes('video') || lower.includes('.mp4') || lower.includes('.mov')) {
      return 'drive-video';
    }
    return 'drive-pdf';
  }
  return 'external';
}

