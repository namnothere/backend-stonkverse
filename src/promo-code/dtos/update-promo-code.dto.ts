import { PartialType } from '@nestjs/mapped-types';
import { CreatePromoCodeInput } from './create-promo-code.dto';

export class UpdatePromoCodeInput extends PartialType(CreatePromoCodeInput) {}
