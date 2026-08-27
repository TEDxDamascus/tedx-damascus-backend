import { BadRequestException } from '@nestjs/common';
import { QrCodesService } from './qr-codes.service';

describe('QrCodesService', () => {
  let service: QrCodesService;

  beforeEach(() => {
    service = new QrCodesService();
  });

  it('generates an SVG data URL for a page URL', () => {
    const result = service.generate({
      url: 'https://tedxdamascus.com/blogs/a-new-tedx-damascus-story',
      size: 256,
      margin: 4,
    });

    expect(result.mimeType).toBe('image/svg+xml');
    expect(result.modules).toBe(97);
    expect(result.size).toBe(256);
    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('<path fill="#000"');
    expect(result.dataUrl).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it('rejects URLs that exceed the QR byte capacity', () => {
    expect(() =>
      service.generate({
        url: `https://example.com/${'a'.repeat(700)}`,
      }),
    ).toThrow(BadRequestException);
  });
});
