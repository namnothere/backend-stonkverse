import { Controller, Post, Body } from '@nestjs/common';
import { PromotionCodeService } from '../providers/promo-code.service';
import { VerifyPromoInput } from '../dtos';

@Controller('promo')
export class PromoCodeController {
  constructor(private readonly promoService: PromotionCodeService) {}

  @Post('/verify')
  verifyPromotionCode(@Body() input: VerifyPromoInput) {
    return this.promoService.verifyPromotionCode(input.courseId, input.code);
  }
}
