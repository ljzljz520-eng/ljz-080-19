import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('活动报名 (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('GET /api 健康检查', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ok');
      });
  });

  it('报名登记照护信息 → 签到 → 志愿者名单只含自己负责的老人', async () => {
    const server = app.getHttpServer();
    // 王桂兰报名健康讲座并申请接送
    const reg = await request(server)
      .post('/api/registrations')
      .send({
        activityId: 'ac_001',
        elderId: 'el_001',
        transportNeed: { required: true, pickupAddress: '3栋301', pickupTime: '08:50' },
      })
      .expect(201);
    expect(reg.body.mobility).toBe('walker');
    expect(reg.body.dietaryRestrictions).toContain('低糖');

    // 重复报名被拒绝
    await request(server)
      .post('/api/registrations')
      .send({ activityId: 'ac_001', elderId: 'el_001' })
      .expect(400);

    // 安排陈晨接送（可驾驶）；安排刘洋接送应被拒绝
    await request(server)
      .post(`/api/registrations/${reg.body.id}/assign`)
      .send({ volunteerId: 'vo_001', duty: 'transport' })
      .expect(201);
    await request(server)
      .post(`/api/registrations/${reg.body.id}/assign`)
      .send({ volunteerId: 'vo_002', duty: 'transport' })
      .expect(400);

    // 签到
    await request(server)
      .post('/api/activities/ac_001/checkin')
      .send({ elderId: 'el_001' })
      .expect(201);

    // 陈晨的名单包含王桂兰且已签到，并带照护信息
    const roster = await request(server)
      .get('/api/activities/ac_001/roster?volunteerId=vo_001')
      .expect(200);
    expect(roster.body.checkedInCount).toBe(1);
    expect(roster.body.elders[0].elder.name).toBe('王桂兰');
    expect(roster.body.elders[0].care.transportNeed.pickupAddress).toBe('3栋301');

    // 刘洋没有分工，名单为空（看不到别人负责的老人）
    const roster2 = await request(server)
      .get('/api/activities/ac_001/roster?volunteerId=vo_002')
      .expect(200);
    expect(roster2.body.elders).toHaveLength(0);

    // 活动开始后才能回填参与记录
    await request(server)
      .patch('/api/activities/ac_001/transition')
      .send({ action: 'start' })
      .expect(200);

    // 回填参与记录
    await request(server)
      .post(`/api/records/registrations/${reg.body.id}`)
      .send({ attended: true, healthTopics: ['血糖监测'], satisfaction: 5 })
      .expect(201);

    // 推荐包含健康主题衍生推荐
    const rec = await request(server)
      .get('/api/records/elders/el_001/recommend')
      .expect(200);
    expect(rec.body.stats.participated).toBe(1);
    expect(JSON.stringify(rec.body.recommendations)).toContain('血糖监测');
  });
});
