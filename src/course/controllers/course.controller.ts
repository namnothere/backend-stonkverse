import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CourseService } from '../providers';
import { CourseFilterInput } from '../dtos';
import { JwtAuthGuard } from '../../auth/guards';

@Controller('course')
@UseGuards(JwtAuthGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}
  @Get('filter')
  getCourses(@Query() filter: CourseFilterInput) {
    return this.courseService.getCourses(filter);
  }

  @Get(':id')
  getCourse(@Param('id') id: string) {
    return this.courseService.getCourse(id);
  }
}
