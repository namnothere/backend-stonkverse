import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IPromoCode, PromoCodeModel } from '../entities';
import { CreatePromoCodeInput, UpdatePromoCodeInput } from '../dtos';
import { MESSAGES } from '../../shared/constants';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class PromotionCodeAdminService {
  constructor(
    // @InjectModel(PromoCode.name)
    // private readonly promoCodeRepo: Model<PromoCode>,
    // @InjectModel(PromoCode.name)
    // private readonly promoCodeRepo: Model<IPromoCode>,
    @InjectModel('PromoCode') private readonly promoCodeRepo: Model<IPromoCode>,
  ) {}

  // async createPromo(input: CreatePromoCodeInput, adminId: string) {
  //   const promo = this.promoCodeRepo.create({ ...input, createdBy: { id: adminId } });
  //   return this.promoCodeRepo.save(promo);
  // }

  async createPromo(input: CreatePromoCodeInput) {
    const existingPromo = await this.promoCodeRepo.findOne({
      code: input.code,
    });
    if (existingPromo) {
      throw new BadRequestException(MESSAGES.PROMOTION_CODE_EXISTS);
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (new Date(input.expDate) < tomorrow) {
      throw new BadRequestException(MESSAGES.PROMOTION_CODE_INVALID);
    }

    const promo = new this.promoCodeRepo({ ...input });
    return promo.save();
  }

  async getPromo(id: string) {
    const promo = await this.promoCodeRepo.findOne({ _id: id });
    if (!promo) throw new NotFoundException(MESSAGES.PROMOTION_CODE_INVALID);
    return promo;
  }

  async getPromotionsByCourse(courseId: string) {
    const promos = await this.promoCodeRepo.find({ course: courseId });
    // console.log("promos:", promos)
    if (!promos) {
      if (!promos) throw new NotFoundException(MESSAGES.COMMENT_NOT_FOUND);
    }
    return promos;
  }

  async getPromos() {
    const promos = await this.promoCodeRepo
      .find({ expDate: { $gt: new Date() } })
      .exec();
    if (!promos || promos.length === 0) {
      throw new NotFoundException(MESSAGES.PROMOTION_CODE_INVALID);
    }
    return promos;
  }

  async updatePromo(id: string, input: UpdatePromoCodeInput) {
    const promo = await this.promoCodeRepo
      .findByIdAndUpdate(id, input, { new: true })
      .exec();
    if (!promo) {
      throw new NotFoundException(MESSAGES.PROMOTION_CODE_INVALID);
    }
    return promo;
  }

  async deletePromo(id: string) {
    const promo = await this.promoCodeRepo.findByIdAndDelete(id).exec();
    if (!promo) {
      throw new NotFoundException(MESSAGES.PROMOTION_CODE_INVALID);
    }
    return promo;
  }

  // async updatePromo(id: string, input: UpdatePromoCodeInput) {
  //   const promo = await this.getPromo(id);
  //   Object.assign(promo, input);
  //   return this.promoCodeRepo.save(promo);
  // }

  // async deletePromo(id: string) {
  //   const promo = await this.getPromo(id);
  //   return this.promoCodeRepo.remove(promo);
  // }
}
