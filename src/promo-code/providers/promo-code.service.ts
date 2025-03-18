import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IPromoCode, PromoCodeModel } from '../entities';
import { VerifyPromoOutput } from '../dtos';
import { MESSAGES, RESULT_STATUS } from '../../shared/constants';
import { BaseApiResponse } from '../../shared/dtos';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class PromotionCodeService {
  constructor(
    // @InjectModel(PromoCode.name)
    // private readonly promoCodeRepo: Model<PromoCode>,
    @InjectModel('PromoCode')
    private readonly promoCodeRepo: Model<IPromoCode>,
  ) { }

  async verifyPromotionCode(
    course: string,
    code: string,
  ): Promise<BaseApiResponse<VerifyPromoOutput>> {
    const promo = await this.promoCodeRepo.findOne({
      course,
      code
    },
    );

    if (!promo) throw new NotFoundException(MESSAGES.PROMOTION_CODE_INVALID);
    if (promo.usageCount >= promo.usageLimit)
      throw new BadRequestException(MESSAGES.PROMOTION_CODE_INVALID);
    if (new Date(promo.expDate) < new Date())
      throw new BadRequestException(MESSAGES.PROMOTION_CODE_EXPIRED);

    return {
      status: RESULT_STATUS.SUCCEED,
      data: {
        valid: true,
        discount: promo.percentOff,
      },
    };
  }
}
