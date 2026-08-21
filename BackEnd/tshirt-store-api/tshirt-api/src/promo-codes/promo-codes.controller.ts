import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';
import { PromoCodesService } from './promo-codes.service';

@ApiTags('Promo Codes')
@Controller('promo-codes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('manager')
@ApiBearerAuth()
export class PromoCodesController {
  constructor(private promoCodesService: PromoCodesService) {}

  @Get()
  @ApiOperation({ summary: 'List promo codes (manager only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.promoCodesService.findAll(Number(page), Number(limit));
  }

  @Post()
  @ApiOperation({ summary: 'Create a promo code (manager only)' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePromoCodeDto,
  ) {
    return this.promoCodesService.create(user.id, dto);
  }

  @Patch(':promoCodeId')
  @ApiOperation({ summary: 'Update or disable a promo code (manager only)' })
  update(
    @Param('promoCodeId', ParseIntPipe) promoCodeId: number,
    @Body() dto: UpdatePromoCodeDto,
  ) {
    return this.promoCodesService.update(promoCodeId, dto);
  }
}
