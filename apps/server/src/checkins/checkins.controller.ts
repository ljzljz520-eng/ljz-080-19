import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CheckinsService } from './checkins.service';

@Controller()
export class CheckinsController {
  constructor(private readonly service: CheckinsService) {}

  @Post('activities/:id/checkin')
  checkIn(@Param('id') id: string, @Body() body: { elderId: string }) {
    return this.service.checkIn(id, body.elderId);
  }

  @Post('checkins/:registrationId/undo')
  undo(@Param('registrationId') registrationId: string) {
    return this.service.undoCheckIn(registrationId);
  }

  @Get('activities/:id/checkin-desk')
  desk(@Param('id') id: string) {
    return this.service.desk(id);
  }

  @Get('activities/:id/roster')
  roster(
    @Param('id') id: string,
    @Query('volunteerId') volunteerId: string,
  ) {
    return this.service.volunteerRoster(id, volunteerId);
  }
}
