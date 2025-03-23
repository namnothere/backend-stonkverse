import { PartialType } from '@nestjs/mapped-types';
import { CreateSettingInput } from './create-setting-input.dto';

export class UpdateSettingInput extends PartialType(CreateSettingInput) {}
