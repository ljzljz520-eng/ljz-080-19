import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ActivitiesModule } from './activities/activities.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { CheckinModule } from './checkin/checkin.module';
import { ParticipantsModule } from './participants/participants.module';
import { VolunteersModule } from './volunteers/volunteers.module';

@Module({
  imports: [
    DatabaseModule,
    ActivitiesModule,
    RegistrationsModule,
    CheckinModule,
    ParticipantsModule,
    VolunteersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
