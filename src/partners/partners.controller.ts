import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import { PaginationQueryDto } from 'src/events/dto/pagination.dto';
import { PartnerQueryDto } from './dto/partner-pagination.dto';

@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  //! create a new Partner
  @Post()
  create(@Body() createPartnerDto: CreatePartnerDto) {
    return this.partnersService.create(createPartnerDto);
  }

  //! get all partners + Language
  @Get()
  findAll(
    @I18n() i18n: I18nContext,
    @Query() paginationQuery: PaginationQueryDto,
    @Query() partnerQuery: PartnerQueryDto,
  ) {
    return this.partnersService.findAll(
      i18n.lang,
      paginationQuery, // for offset and limit
      partnerQuery, // for filter with name
    );
  }

  //! get partner by Id + Language
  @Get(':id')
  findOne(@Param('id') id: string, @I18n() i18n: I18nContext) {
    return this.partnersService.findOne(id, i18n.lang);
  }

  //! Update partner by Id
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePartnerDto: UpdatePartnerDto) {
    return this.partnersService.update(id, updatePartnerDto);
  }

  //! Delete partner by Id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.partnersService.remove(id);
  }
}
