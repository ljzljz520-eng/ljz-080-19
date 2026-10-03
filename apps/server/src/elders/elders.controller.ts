import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { EldersService } from './elders.service';

@Controller('elders')
export class EldersController {
  constructor(private readonly eldersService: EldersService) {}

  @Get()
  list(@Query('keyword') keyword?: string) {
    return this.eldersService.list(keyword);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.eldersService.get(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.eldersService.create(body);
  }
}
