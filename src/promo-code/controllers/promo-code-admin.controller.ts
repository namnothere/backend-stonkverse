import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PromotionCodeAdminService } from '../providers/promo-code-admin.service';
import { CreatePromoCodeInput, UpdatePromoCodeInput } from '../dtos';
import { JwtAuthAdminGuard } from '../../auth';
import { ReqContext } from '../../shared/request-context/req-context.decorator';
import { RequestContext } from '../../shared/request-context/request-context.dto';

// @UseGuards(JwtAuthAdminGuard)
@Controller('admin/promotion')
export class PromoCodeAdminController {
  constructor(private readonly promoService: PromotionCodeAdminService) {}

  @Post()
  createPromo(
    @ReqContext() ctx: RequestContext,
    @Body() input: CreatePromoCodeInput,
  ) {
    return this.promoService.createPromo(input);
  }

  @Get(':id')
  getPromo(@Param('id') id: string) {
    return this.promoService.getPromo(id);
  }

  @Get('course/:id')
  getPromoByCourse(@Param('id') id: string) {
    return this.promoService.getPromotionsByCourse(id);
  }

  @Get()
  getPromos() {
    return this.promoService.getPromos();
  }

  @Patch(':id')
  updatePromo(@Param('id') id: string, @Body() input: UpdatePromoCodeInput) {
    return this.promoService.updatePromo(id, input);
  }

  @Delete(':id')
  deletePromo(@Param('id') id: string) {
    return this.promoService.deletePromo(id);
  }
}
