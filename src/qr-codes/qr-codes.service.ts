import { BadRequestException, Injectable } from '@nestjs/common';
import { GenerateQrCodeDto } from './dto/generate-qr-code.dto';
import { QrCodeResponseDto } from './dto/qr-code-response.dto';

const QR_VERSION = 20;
const MODULE_COUNT = QR_VERSION * 4 + 17;
const TOTAL_CODEWORDS = 1085;
const ERROR_CORRECTION_CODEWORDS_PER_BLOCK = 26;
const ERROR_CORRECTION_BLOCKS = 16;
const DATA_CODEWORDS = 669;
const MAX_BYTE_LENGTH = DATA_CODEWORDS - 3;

@Injectable()
export class QrCodesService {
  generate(dto: GenerateQrCodeDto): QrCodeResponseDto {
    const url = dto.url.trim();
    const size = dto.size ?? 512;
    const margin = dto.margin ?? 4;
    const bytes = [...Buffer.from(url, 'utf8')];

    if (bytes.length > MAX_BYTE_LENGTH) {
      throw new BadRequestException(
        `URL is too long for QR generation. Maximum UTF-8 byte length is ${MAX_BYTE_LENGTH}.`,
      );
    }

    const modules = this.createQrModules(bytes);
    const svg = this.toSvg(modules, size, margin);

    return {
      url,
      mimeType: 'image/svg+xml',
      size,
      modules: MODULE_COUNT,
      svg,
      dataUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    };
  }

  private createQrModules(dataBytes: number[]): boolean[][] {
    const codewords = this.addErrorCorrection(this.encodeData(dataBytes));
    const modules = this.createEmptyMatrix();
    const reserved = this.createEmptyMatrix();

    this.drawFunctionPatterns(modules, reserved);
    this.drawCodewords(modules, reserved, codewords);
    this.applyMask(modules, reserved);
    this.drawFormatBits(modules, reserved);

    return modules;
  }

  private encodeData(dataBytes: number[]): number[] {
    const bits: number[] = [];

    this.appendBits(bits, 0b0100, 4);
    this.appendBits(bits, dataBytes.length, 16);

    for (const byte of dataBytes) {
      this.appendBits(bits, byte, 8);
    }

    const capacityBits = DATA_CODEWORDS * 8;
    this.appendBits(bits, 0, Math.min(4, capacityBits - bits.length));

    while (bits.length % 8 !== 0) {
      bits.push(0);
    }

    const dataCodewords: number[] = [];
    for (let i = 0; i < bits.length; i += 8) {
      let value = 0;
      for (let j = 0; j < 8; j++) {
        value = (value << 1) | bits[i + j];
      }
      dataCodewords.push(value);
    }

    for (let pad = 0xec; dataCodewords.length < DATA_CODEWORDS; pad ^= 0xfd) {
      dataCodewords.push(pad);
    }

    return dataCodewords;
  }

  private addErrorCorrection(dataCodewords: number[]): number[] {
    const divisor = this.reedSolomonDivisor(
      ERROR_CORRECTION_CODEWORDS_PER_BLOCK,
    );
    const shortBlockCount =
      ERROR_CORRECTION_BLOCKS - (TOTAL_CODEWORDS % ERROR_CORRECTION_BLOCKS);
    const shortBlockLength =
      Math.floor(TOTAL_CODEWORDS / ERROR_CORRECTION_BLOCKS);
    const shortDataBlockLength =
      shortBlockLength - ERROR_CORRECTION_CODEWORDS_PER_BLOCK;
    const blocks: number[][] = [];
    let offset = 0;

    for (let i = 0; i < ERROR_CORRECTION_BLOCKS; i++) {
      const dataLength = shortDataBlockLength + (i < shortBlockCount ? 0 : 1);
      const blockData = dataCodewords.slice(offset, offset + dataLength);
      offset += dataLength;

      const errorCorrection = this.reedSolomonRemainder(blockData, divisor);
      if (i < shortBlockCount) {
        blockData.push(0);
      }

      blocks.push(blockData.concat(errorCorrection));
    }

    const result: number[] = [];
    const maxBlockLength = Math.max(...blocks.map((block) => block.length));

    for (let i = 0; i < maxBlockLength; i++) {
      for (let j = 0; j < blocks.length; j++) {
        if (i !== shortDataBlockLength || j >= shortBlockCount) {
          const codeword = blocks[j][i];
          if (codeword !== undefined) {
            result.push(codeword);
          }
        }
      }
    }

    return result;
  }

  private drawFunctionPatterns(
    modules: boolean[][],
    reserved: boolean[][],
  ): void {
    this.drawFinderPattern(modules, reserved, 3, 3);
    this.drawFinderPattern(modules, reserved, MODULE_COUNT - 4, 3);
    this.drawFinderPattern(modules, reserved, 3, MODULE_COUNT - 4);

    for (let i = 0; i < MODULE_COUNT; i++) {
      if (!reserved[6][i]) {
        this.setFunctionModule(modules, reserved, i, 6, i % 2 === 0);
      }
      if (!reserved[i][6]) {
        this.setFunctionModule(modules, reserved, 6, i, i % 2 === 0);
      }
    }

    const alignmentPositions = [6, 34, 62, 90];
    for (const x of alignmentPositions) {
      for (const y of alignmentPositions) {
        const overlapsFinder =
          (x === 6 && y === 6) ||
          (x === 6 && y === MODULE_COUNT - 7) ||
          (x === MODULE_COUNT - 7 && y === 6);

        if (!overlapsFinder) {
          this.drawAlignmentPattern(modules, reserved, x, y);
        }
      }
    }

    this.drawFormatBits(modules, reserved);
    this.drawVersionBits(modules, reserved);
  }

  private drawFinderPattern(
    modules: boolean[][],
    reserved: boolean[][],
    centerX: number,
    centerY: number,
  ): void {
    for (let y = centerY - 4; y <= centerY + 4; y++) {
      for (let x = centerX - 4; x <= centerX + 4; x++) {
        if (x < 0 || y < 0 || x >= MODULE_COUNT || y >= MODULE_COUNT) {
          continue;
        }

        const distance = Math.max(Math.abs(x - centerX), Math.abs(y - centerY));
        this.setFunctionModule(
          modules,
          reserved,
          x,
          y,
          distance !== 2 && distance !== 4,
        );
      }
    }
  }

  private drawAlignmentPattern(
    modules: boolean[][],
    reserved: boolean[][],
    centerX: number,
    centerY: number,
  ): void {
    for (let y = centerY - 2; y <= centerY + 2; y++) {
      for (let x = centerX - 2; x <= centerX + 2; x++) {
        const distance = Math.max(Math.abs(x - centerX), Math.abs(y - centerY));
        this.setFunctionModule(modules, reserved, x, y, distance !== 1);
      }
    }
  }

  private drawFormatBits(
    modules: boolean[][],
    reserved: boolean[][],
  ): void {
    const bits = this.formatBits(0, 0);

    for (let i = 0; i <= 5; i++) {
      this.setFunctionModule(modules, reserved, 8, i, this.getBit(bits, i));
    }

    this.setFunctionModule(modules, reserved, 8, 7, this.getBit(bits, 6));
    this.setFunctionModule(modules, reserved, 8, 8, this.getBit(bits, 7));
    this.setFunctionModule(modules, reserved, 7, 8, this.getBit(bits, 8));

    for (let i = 9; i < 15; i++) {
      this.setFunctionModule(
        modules,
        reserved,
        14 - i,
        8,
        this.getBit(bits, i),
      );
    }

    for (let i = 0; i < 8; i++) {
      this.setFunctionModule(
        modules,
        reserved,
        MODULE_COUNT - 1 - i,
        8,
        this.getBit(bits, i),
      );
    }

    for (let i = 8; i < 15; i++) {
      this.setFunctionModule(
        modules,
        reserved,
        8,
        MODULE_COUNT - 15 + i,
        this.getBit(bits, i),
      );
    }

    this.setFunctionModule(modules, reserved, 8, MODULE_COUNT - 8, true);
  }

  private drawVersionBits(
    modules: boolean[][],
    reserved: boolean[][],
  ): void {
    let remainder = QR_VERSION;
    for (let i = 0; i < 12; i++) {
      remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25);
    }

    const bits = (QR_VERSION << 12) | remainder;

    for (let i = 0; i < 18; i++) {
      const bit = this.getBit(bits, i);
      const x = MODULE_COUNT - 11 + (i % 3);
      const y = Math.floor(i / 3);

      this.setFunctionModule(modules, reserved, x, y, bit);
      this.setFunctionModule(modules, reserved, y, x, bit);
    }
  }

  private drawCodewords(
    modules: boolean[][],
    reserved: boolean[][],
    codewords: number[],
  ): void {
    let bitIndex = 0;

    for (let right = MODULE_COUNT - 1; right >= 1; right -= 2) {
      if (right === 6) {
        right = 5;
      }

      for (let vertical = 0; vertical < MODULE_COUNT; vertical++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? MODULE_COUNT - 1 - vertical : vertical;

          if (reserved[y][x]) {
            continue;
          }

          const byte = codewords[Math.floor(bitIndex / 8)] ?? 0;
          modules[y][x] = ((byte >>> (7 - (bitIndex % 8))) & 1) === 1;
          bitIndex++;
        }
      }
    }
  }

  private applyMask(modules: boolean[][], reserved: boolean[][]): void {
    for (let y = 0; y < MODULE_COUNT; y++) {
      for (let x = 0; x < MODULE_COUNT; x++) {
        if (!reserved[y][x] && (x + y) % 2 === 0) {
          modules[y][x] = !modules[y][x];
        }
      }
    }
  }

  private toSvg(modules: boolean[][], size: number, margin: number): string {
    const viewBoxSize = MODULE_COUNT + margin * 2;
    const pathParts: string[] = [];

    for (let y = 0; y < MODULE_COUNT; y++) {
      let x = 0;
      while (x < MODULE_COUNT) {
        if (!modules[y][x]) {
          x++;
          continue;
        }

        const start = x;
        while (x < MODULE_COUNT && modules[y][x]) {
          x++;
        }

        pathParts.push(`M${start + margin} ${y + margin}h${x - start}v1H${start + margin}z`);
      }
    }

    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" shape-rendering="crispEdges">`,
      '<path fill="#fff" d="M0 0h100%v100%H0z"/>',
      `<path fill="#000" d="${pathParts.join('')}"/>`,
      '</svg>',
    ].join('');
  }

  private appendBits(bits: number[], value: number, length: number): void {
    for (let i = length - 1; i >= 0; i--) {
      bits.push((value >>> i) & 1);
    }
  }

  private createEmptyMatrix(): boolean[][] {
    return Array.from({ length: MODULE_COUNT }, () =>
      Array<boolean>(MODULE_COUNT).fill(false),
    );
  }

  private setFunctionModule(
    modules: boolean[][],
    reserved: boolean[][],
    x: number,
    y: number,
    isDark: boolean,
  ): void {
    modules[y][x] = isDark;
    reserved[y][x] = true;
  }

  private formatBits(errorCorrectionLevelBits: number, mask: number): number {
    const data = (errorCorrectionLevelBits << 3) | mask;
    let remainder = data;

    for (let i = 0; i < 10; i++) {
      remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
    }

    return ((data << 10) | remainder) ^ 0x5412;
  }

  private reedSolomonDivisor(degree: number): number[] {
    const result = Array<number>(degree).fill(0);
    result[degree - 1] = 1;

    let root = 1;
    for (let i = 0; i < degree; i++) {
      for (let j = 0; j < degree; j++) {
        result[j] = this.galoisMultiply(result[j], root);
        if (j + 1 < degree) {
          result[j] ^= result[j + 1];
        }
      }
      root = this.galoisMultiply(root, 0x02);
    }

    return result;
  }

  private reedSolomonRemainder(data: number[], divisor: number[]): number[] {
    const result = Array<number>(divisor.length).fill(0);

    for (const byte of data) {
      const factor = byte ^ (result.shift() ?? 0);
      result.push(0);

      for (let i = 0; i < result.length; i++) {
        result[i] ^= this.galoisMultiply(divisor[i], factor);
      }
    }

    return result;
  }

  private galoisMultiply(x: number, y: number): number {
    let product = 0;

    for (let i = 7; i >= 0; i--) {
      product = (product << 1) ^ ((product >>> 7) * 0x11d);
      product ^= ((y >>> i) & 1) * x;
    }

    return product;
  }

  private getBit(value: number, index: number): boolean {
    return ((value >>> index) & 1) !== 0;
  }
}
