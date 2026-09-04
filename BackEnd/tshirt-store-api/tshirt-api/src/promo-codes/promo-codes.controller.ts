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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { ListPromoCodesQueryDto } from './dto/list-promo-codes-query.dto';
import { PreviewPromoCodeDto } from './dto/preview-promo-code.dto';
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
  findAll(@Query() query: ListPromoCodesQueryDto) {
    return this.promoCodesService.findAll(query);
  }

  @Post('preview')
  @Roles('client')
  @ApiOperation({ summary: 'Preview a promo code against the active cart' })
  preview(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PreviewPromoCodeDto,
  ) {
    return this.promoCodesService.previewForCart(user.id, dto);
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
