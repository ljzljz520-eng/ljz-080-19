import { Body, Controller, Param, Post } from '@nestjs/common';
import { CheckinService } from './checkin.service';

@Controller('api')
export class CheckinController {
  constructor(private readonly service: CheckinService) {}

  @Post('activities/:id/checkin')
  byCode(@Param('id') id: string, @Body('code') code: string) {
    return this.service.checkInByCode(id, code);
  }

  @Post('registrations/:id/checkin')
  byRegistration(@Param('id') id: string) {
    return this.service.checkInByRegistration(id);
  }

  @Post('activities/:id/finish')
  finish(@Param('id') id: string) {
    return this.service
      .markNoShows(id)
      .then((noShowCount) => ({ noShowCount }));
  }
}
