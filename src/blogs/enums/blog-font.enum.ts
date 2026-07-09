export enum BlogFont {
  HELVETICA_NEUE = 'helvetica_neue',
  CAIRO = 'cairo',
  MONTSERRAT = 'montserrat',
  POPPINS = 'poppins',
  TAJAWAL = 'tajawal',
}

export const BLOG_FONT_DEFAULT = BlogFont.CAIRO;

export const BLOG_FONT_LABELS: Record<BlogFont, string> = {
  [BlogFont.HELVETICA_NEUE]: 'Helvetica Neue',
  [BlogFont.CAIRO]: 'Cairo',
  [BlogFont.MONTSERRAT]: 'Montserrat',
  [BlogFont.POPPINS]: 'Poppins',
  [BlogFont.TAJAWAL]: 'Tajawal',
};
