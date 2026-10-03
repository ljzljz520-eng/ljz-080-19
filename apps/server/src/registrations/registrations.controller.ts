import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { RegistrationsService } from './registrations.service';

@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly service: RegistrationsService) {}

  @Get()
  list(@Query('activityId') activityId?: string, @Query('elderId') elderId?: string) {
    if (activityId) return this.service.listByActivity(activityId);
    if (elderId) return this.service.listByElder(elderId);
    return [];
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.service.cancel(id, body?.reason);
  }

  @Post(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() body: { volunteerId: string; duty: any; note?: string },
  ) {
    return this.service.assign(id, body);
  }

  @Delete('assignments/:assignmentId')
  unassign(@Param('assignmentId') assignmentId: string) {
    return this.service.unassign(assignmentId);
  }
}
