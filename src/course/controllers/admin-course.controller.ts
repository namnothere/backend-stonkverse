import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CourseService } from '../providers';
import { CourseFilterInput, CreateCourseDto, UpdateCourseDto } from '../dtos';
import { ReqContext } from '../../shared/request-context/req-context.decorator';
import { RequestContext } from '../../shared/request-context/request-context.dto';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';

@Controller('admin/course')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseAdminController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  create(@ReqContext() ctx: RequestContext, @Body() input: CreateCourseDto) {
    return this.courseService.create(ctx.user.id, input);
  }

  @Get('filter')
  getCourses(@Query() filter: CourseFilterInput) {
    return this.courseService.getCourses(filter);
  }

  @Get(':id')
  getCourse(@Param('id') id: string) {
    return this.courseService.getCourse(id);
  }

  @Patch(':id')
  update(@Body() updateCourseDto: UpdateCourseDto) {
    return this.courseService.update(updateCourseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.courseService.remove(id);
  }
}
