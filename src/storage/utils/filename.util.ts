const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export function getBasename(filename: string): string {
  if (!filename || !filename.includes('.')) return filename || 'image';
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.slice(0, lastDot) : filename;
}


export function getExtensionFromMime(mime: string): string {
  if (!mime) return '';
  return MIME_TO_EXTENSION[mime.toLowerCase()] ?? '';
}

export function getDisplayName(basename: string, mime: string): string {
  const ext = getExtensionFromMime(mime);
  return ext ? `${basename}.${ext}` : basename;
}
