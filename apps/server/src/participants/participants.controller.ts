import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Participant } from '../domain';
import { ParticipantsService } from './participants.service';

@Controller('api/participants')
export class ParticipantsController {
  constructor(private readonly service: ParticipantsService) {}

  @Get()
  list(): Promise<Participant[]> {
    return this.service.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  create(@Body() body: Omit<Participant, 'id'>) {
    return this.service.create(body);
  }
}
