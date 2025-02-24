import { Controller, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cat } from './models';
import { Model } from 'mongoose';

@Controller('cat')
export class CatController {
  constructor(
    @InjectModel(Cat.name) private readonly catModel: Model<Cat>,
  ) {}
  @Get('')
  findAll() {
    return this.catModel.find();
  }

  @Get('create')
  create() {
    const cat = new this.catModel({
      name: 'test',
      age: 1,
      breed: 'test',
    });
    return cat.save();
  }
}
