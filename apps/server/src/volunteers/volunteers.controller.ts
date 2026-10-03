import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { VolunteersService } from './volunteers.service';

@Controller('volunteers')
export class VolunteersController {
  constructor(private readonly volunteersService: VolunteersService) {}

  @Get()
  list() {
    return this.volunteersService.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.volunteersService.get(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.volunteersService.create(body);
  }
}
