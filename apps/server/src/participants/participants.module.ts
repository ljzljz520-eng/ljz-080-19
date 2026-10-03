import { Module } from '@nestjs/common';
import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';
import { ParticipationController } from './participation.controller';
import { ParticipationService } from './participation.service';

@Module({
  controllers: [ParticipantsController, ParticipationController],
  providers: [ParticipantsService, ParticipationService],
})
export class ParticipantsModule {}
