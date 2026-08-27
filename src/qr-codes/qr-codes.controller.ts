import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { GenerateQrCodeDto } from './dto/generate-qr-code.dto';
import { QrCodeResponseDto } from './dto/qr-code-response.dto';
import { QrCodesService } from './qr-codes.service';

@Public()
@ApiTags('qr-codes')
@Controller('qr-codes')
export class QrCodesController {
  constructor(private readonly qrCodesService: QrCodesService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate a QR code for a page URL',
    description:
      'Send the current browser page URL and receive an SVG QR code plus a data URL for direct image rendering.',
  })
  @ApiBody({ type: GenerateQrCodeDto })
  @ApiOkResponse({ type: QrCodeResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid URL or URL is too long.' })
  generate(@Body() dto: GenerateQrCodeDto): QrCodeResponseDto {
    return this.qrCodesService.generate(dto);
  }
}
