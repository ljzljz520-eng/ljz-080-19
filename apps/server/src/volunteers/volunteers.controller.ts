import { Controller, Get } from '@nestjs/common';
import { VolunteersService } from './volunteers.service';

@Controller('api/volunteers')
export class VolunteersController {
  constructor(private readonly service: VolunteersService) {}

  @Get()
  list() {
    return this.service.list();
  }
}
