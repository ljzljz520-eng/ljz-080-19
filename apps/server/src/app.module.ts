import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { EldersModule } from './elders/elders.module';
import { VolunteersModule } from './volunteers/volunteers.module';
import { ActivitiesModule } from './activities/activities.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { CheckinsModule } from './checkins/checkins.module';
import { RecordsModule } from './records/records.module';

@Module({
  imports: [
    DatabaseModule,
    EldersModule,
    VolunteersModule,
    ActivitiesModule,
    RegistrationsModule,
    CheckinsModule,
    RecordsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
