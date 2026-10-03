import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateRegistrationDto } from './dto';
import { RegistrationsService } from './registrations.service';

@Controller('api')
export class RegistrationsController {
  constructor(private readonly service: RegistrationsService) {}

  @Post('registrations')
  create(@Body() dto: CreateRegistrationDto) {
    return this.service.create(dto);
  }

  @Get('registrations')
  list(
    @Query('activityId') activityId?: string,
    @Query('participantId') participantId?: string,
  ) {
    return this.service.list({ activityId, participantId });
  }

  @Delete('registrations/:id')
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }

  @Get('activities/:id/roster')
  roster(@Param('id') id: string) {
    return this.service.activityRoster(id);
  }

  @Get('volunteers/:id/roster')
  volunteerRoster(
    @Param('id') id: string,
    @Query('activityId') activityId: string,
  ) {
    return this.service.volunteerRoster(id, activityId);
  }
}
