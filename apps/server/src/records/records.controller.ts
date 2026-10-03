import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RecordsService } from './records.service';

@Controller('records')
export class RecordsController {
  constructor(private readonly service: RecordsService) {}

  @Get()
  list(@Query('activityId') activityId?: string, @Query('elderId') elderId?: string) {
    if (activityId) return this.service.listByActivity(activityId);
    if (elderId) return this.service.listByElder(elderId);
    return [];
  }

  @Post('registrations/:registrationId')
  fill(@Param('registrationId') registrationId: string, @Body() body: any) {
    return this.service.fill(registrationId, body);
  }

  @Get('elders/:elderId/recommend')
  recommend(@Param('elderId') elderId: string) {
    return this.service.recommend(elderId);
  }
}
