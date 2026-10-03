import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BackfillDto, ParticipationService } from './participation.service';

@Controller('api')
export class ParticipationController {
  constructor(private readonly service: ParticipationService) {}

  /** 活动结束后回填参与记录 */
  @Post('participation-records')
  backfill(@Body() dto: BackfillDto) {
    return this.service.backfill(dto);
  }

  @Get('activities/:id/participation-records')
  byActivity(@Param('id') id: string) {
    return this.service.listByActivity(id);
  }

  @Get('participants/:id/participation-records')
  byParticipant(@Param('id') id: string) {
    return this.service.listByParticipant(id);
  }

  /** 基于参与记录的后续服务推荐 */
  @Get('participants/:id/recommendations')
  recommend(@Param('id') id: string) {
    return this.service.recommendForParticipant(id);
  }
}
