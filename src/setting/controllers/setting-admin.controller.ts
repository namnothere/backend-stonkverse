import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SettingAdminService } from '../providers/setting-admin.service';
import { CreateSettingInput, SettingFilterInput, UpdateSettingInput } from '../dtos';

@Controller('admin/setting')
export class SettingAdminController {
  constructor(private readonly settingService: SettingAdminService) {}

  @Post()
  create(@Body() createSettingDto: CreateSettingInput) {
    return this.settingService.create(createSettingDto);
  }

  @Get()
  getSettings(@Body() filter: SettingFilterInput) {
    return this.settingService.getSettings(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.settingService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSettingInput: UpdateSettingInput) {
    return this.settingService.update(id, updateSettingInput);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.settingService.remove(id);
  }
}
