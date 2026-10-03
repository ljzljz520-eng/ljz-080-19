import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      name: '社区养老协作平台 API',
      status: 'ok',
      time: new Date().toISOString(),
      modules: ['elders', 'volunteers', 'activities', 'registrations', 'checkins', 'records'],
    };
  }
}
