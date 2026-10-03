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

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  list(@Query('status') status?: any) {
    return this.activitiesService.list(status ? { status } : undefined);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.activitiesService.get(id);
  }

  @Get(':id/detail')
  detail(@Param('id') id: string) {
    return this.activitiesService.detail(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.activitiesService.create(body);
  }

  @Patch(':id/transition')
  transition(@Param('id') id: string, @Body() body: { action: 'start' | 'finish' | 'cancel' }) {
    return this.activitiesService.transition(id, body.action);
  }
}
