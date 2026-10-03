import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto';

@Controller('api/activities')
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.service.list(status);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  create(@Body() dto: CreateActivityDto) {
    return this.service.create(dto);
  }

  @Patch(':id/status')
  setStatus(
    @Param('id') id: string,
    @Body('status') status: 'open' | 'ongoing' | 'finished',
  ) {
    return this.service.setStatus(id, status);
  }
}
