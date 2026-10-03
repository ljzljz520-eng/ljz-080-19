import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, List, Tag } from 'antd';
import { adminApi } from '../api';
import {
  ACTIVITY_STATUS_MAP,
  ACTIVITY_TYPE_MAP,
  type Activity,
  type Elder,
  type Volunteer,
} from '../../api/types';

function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [elders, setElders] = useState<Elder[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);

  useEffect(() => {
    adminApi.activities().then(setActivities);
    adminApi.elders().then(setElders);
    adminApi.volunteers().then(setVolunteers);
  }, []);

  const regCount = activities.reduce((s, a) => s + (a.registeredCount ?? 0), 0);
  const transportCount = activities.reduce((s, a) => s + (a.transportUsed ?? 0), 0);
  const wheelchairCount = activities.reduce((s, a) => s + (a.wheelchairUsed ?? 0), 0);
  const upcoming = activities.filter((a) => ['published', 'ongoing'].includes(a.status));

  return (
    <div>
      <div className="page-head">
        <h2>工作台</h2>
        <div className="desc">活动报名 · 现场签到 · 志愿者照护分工 · 参与记录回填</div>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="活动报名不是发公告：报名时会登记每位老人的行动能力、轮椅位、饮食禁忌与接送需求，活动当天志愿者按名单照护，活动结束回填参与记录用于后续服务推荐。"
      />

      <div className="stat-cards">
        <div className="stat-card">
          <div className="num">{upcoming.length}</div>
          <div className="label">报名中/进行中活动</div>
        </div>
        <div className="stat-card">
          <div className="num">{regCount}</div>
          <div className="label">累计报名人次</div>
        </div>
        <div className="stat-card">
          <div className="num" style={{ color: '#c95a78' }}>♿ {wheelchairCount}</div>
          <div className="label">轮椅位预留</div>
        </div>
        <div className="stat-card">
          <div className="num" style={{ color: '#4a7fb8' }}>🚐 {transportCount}</div>
          <div className="label">需要接送</div>
        </div>
      </div>

      <Card
        title="近期活动"
        extra={<Button type="link" onClick={() => navigate('/activities')}>全部活动</Button>}
      >
        <List
          itemLayout="horizontal"
          dataSource={upcoming.slice(0, 5)}
          locale={{ emptyText: "暂无活动" }}
          renderItem={(a) => (
            <List.Item
              actions={[
                <Button key="manage" type="link" onClick={() => navigate(`/activities/${a.id}`)}>
                  管理报名 ›
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <span>
                    <Tag color={a.type === 'health_lecture' ? 'blue' : a.type === 'haircut' ? 'magenta' : 'orange'}>
                      {ACTIVITY_TYPE_MAP[a.type]}
                    </Tag>
                    {a.title}
                  </span>
                }
                description={`${fmt(a.startTime)} · ${a.location} · 名额 ${a.registeredCount}/${a.capacity}（轮椅 ${a.wheelchairUsed}/${a.wheelchairCapacity}，接送 ${a.transportUsed}/${a.transportCapacity}）`}
              />
              <Tag color={a.status === 'ongoing' ? 'green' : 'orange'}>{ACTIVITY_STATUS_MAP[a.status]}</Tag>
            </List.Item>
          )}
        />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <Card title="照护资源">
          <p>登记老人 <b>{elders.length}</b> 位；志愿者 <b>{volunteers.length}</b> 名</p>
          <p style={{ color: '#999', fontSize: 13 }}>
            可驾驶志愿者：{volunteers.filter((v) => v.canDrive).map((v) => v.name).join('、') || '无'}
          </p>
          <Button type="link" style={{ padding: 0 }} onClick={() => navigate('/elders')}>
            查看老人档案与服务推荐 ›
          </Button>
        </Card>
        <Card title="典型工作流">
          <ol style={{ paddingLeft: 18, margin: 0, color: '#666', lineHeight: 2 }}>
            <li>发布活动并设置名额、轮椅位与接送车位</li>
            <li>老人 H5 报名，登记照护信息</li>
            <li>管理端安排志愿者照护分工</li>
            <li>活动当天现场签到，志愿者手机看名单</li>
            <li>活动结束回填参与记录，生成后续推荐</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
