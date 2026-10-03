import { useEffect, useState } from 'react';
import {
  Alert,
  Card,
  Col,
  Empty,
  Input,
  List,
  Row,
  Segmented,
  Space,
  Table,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import {
  CheckCircleOutlined,
  HeartOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminApi, type Recommendation } from '../api';
import {
  ACTIVITY_TYPE_MAP,
  MOBILITY_MAP,
  type Elder,
  type ParticipationRecord,
} from '../../api/types';

const LEVEL_COLOR = { info: 'blue', suggest: 'orange', attention: 'red' } as const;
const LEVEL_TEXT = { info: '提示', suggest: '建议', attention: '重点关注' } as const;

export default function EldersPage() {
  const [elders, setElders] = useState<Elder[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<Elder | null>(null);
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [records, setRecords] = useState<ParticipationRecord[]>([]);
  const [tab, setTab] = useState<'recommend' | 'history'>('recommend');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminApi.elders().then(setElders);
  }, []);

  const openElder = async (e: Elder) => {
    setSelected(e);
    setTab('recommend');
    setRec(null);
    setRecords([]);
    setLoading(true);
    try {
      const [r, hist] = await Promise.all([
        adminApi.recommend(e.id),
        adminApi.recordsOfElder(e.id),
      ]);
      setRec(r);
      setRecords(hist);
    } finally {
      setLoading(false);
    }
  };

  const filtered = elders.filter(
    (e) => !keyword || e.name.includes(keyword) || e.phone?.includes(keyword) || e.address?.includes(keyword),
  );

  return (
    <div>
      <div className="page-head">
        <h2>老人档案与服务推荐</h2>
        <div className="desc">参与记录回填后，系统综合老人档案与历次活动表现，给出后续服务推荐与照护提示</div>
      </div>

      <Row gutter={16}>
        <Col span={9}>
          <Card
            title={`老人列表（${filtered.length}）`}
            extra={<Input.Search placeholder="搜索姓名/电话/住址" allowClear style={{ width: 200 }} onSearch={setKeyword} onChange={(e) => !e.target.value && setKeyword('')} />}
            styles={{ body: { padding: 0 } }}
          >
            <List
              dataSource={filtered}
              renderItem={(e) => (
                <List.Item
                  style={{
                    padding: '12px 18px',
                    cursor: 'pointer',
                    background: selected?.id === e.id ? '#fdf2eb' : undefined,
                  }}
                  onClick={() => openElder(e)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <b>{e.name}</b>
                        <span style={{ color: '#999', fontSize: 12 }}>
                          {e.gender === 'female' ? '女' : '男'} · {e.age}岁
                        </span>
                      </Space>
                    }
                    description={
                      <Space size={4} wrap>
                        <Tag>{MOBILITY_MAP[e.mobility]}</Tag>
                        {e.wheelchairSeat && <Tag color="magenta">♿</Tag>}
                        {e.dietaryRestrictions.map((d) => (
                          <Tag key={d} color="gold">{d}</Tag>
                        ))}
                        {e.conditions.map((c) => (
                          <Tag key={c} color="red">{c}</Tag>
                        ))}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={15}>
          {!selected ? (
            <Card>
              <Empty description="选择左侧老人，查看服务推荐与参与历史" style={{ padding: 60 }} />
            </Card>
          ) : (
            <Card loading={loading}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    {selected.name}
                    <span style={{ fontSize: 14, color: '#999', fontWeight: 400, marginLeft: 10 }}>
                      {selected.gender === 'female' ? '女' : '男'} · {selected.age}岁 · {selected.address}
                    </span>
                  </Typography.Title>
                  <div style={{ marginTop: 8 }}>
                    <Space size={6} wrap>
                      <Tag>行动：{MOBILITY_MAP[selected.mobility]}</Tag>
                      <Tag color={selected.wheelchairSeat ? 'magenta' : 'default'}>
                        日常轮椅位：{selected.wheelchairSeat ? '需要' : '不需要'}
                      </Tag>
                      {selected.dietaryRestrictions.map((d) => (
                        <Tag key={d} color="gold">禁忌：{d}</Tag>
                      ))}
                      {selected.conditions.map((c) => (
                        <Tag key={c} color="red">{c}</Tag>
                      ))}
                    </Space>
                  </div>
                </div>
                <Segmented
                  options={[
                    { label: '服务推荐', value: 'recommend' },
                    { label: '参与历史', value: 'history' },
                  ]}
                  value={tab}
                  onChange={(v) => setTab(v as 'recommend' | 'history')}
                />
              </div>

              {tab === 'recommend' && rec && (
                <div style={{ marginTop: 18 }}>
                  <Space size="large" style={{ marginBottom: 8 }}>
                    <span style={{ color: '#666' }}>参加 <b style={{ color: '#52c41a' }}>{rec.stats.participated}</b> 次</span>
                    <span style={{ color: '#666' }}>缺席 <b>{rec.stats.absent}</b> 次</span>
                    <span style={{ color: '#666' }}>平均满意度 {rec.stats.avgSatisfaction ? `⭐${rec.stats.avgSatisfaction}` : '—'}</span>
                  </Space>

                  <Card
                    size="small"
                    type="inner"
                    title={<span><HeartOutlined style={{ color: '#e8794a' }} /> 照护提示</span>}
                    style={{ marginBottom: 14 }}
                  >
                    <Timeline
                      items={rec.careTips.length ? rec.careTips.map((t) => ({
                        color: LEVEL_COLOR[t.level],
                        children: (
                          <span>
                            <Tag color={LEVEL_COLOR[t.level]}>{LEVEL_TEXT[t.level]}</Tag>
                            {t.text}
                          </span>
                        ),
                      })) : [{ children: '暂无特别提示' }]}
                    />
                  </Card>

                  <Card
                    size="small"
                    type="inner"
                    title={<span><NotificationOutlined style={{ color: '#e8794a' }} /> 推荐服务与活动</span>}
                  >
                    <List
                      dataSource={rec.recommendations}
                      renderItem={(r) => {
                        const open = rec.openActivities.find(
                          (o) => o.type === r.type && !o.alreadyRegistered,
                        );
                        return (
                          <List.Item>
                            <List.Item.Meta
                              title={
                                <Space>
                                  <Tag color="orange">{ACTIVITY_TYPE_MAP[r.type as keyof typeof ACTIVITY_TYPE_MAP] ?? '服务'}</Tag>
                                  {r.title}
                                </Space>
                              }
                              description={r.reason}
                            />
                            {open && (
                              <Tag color="green" icon={<CheckCircleOutlined />}>
                                近期可报：{dayjs(open.startTime).format('M月D日')}
                              </Tag>
                            )}
                          </List.Item>
                        );
                      }}
                    />
                    {rec.openActivities.some((o) => o.alreadyRegistered) && (
                      <Alert
                        style={{ marginTop: 8 }}
                        type="success"
                        showIcon
                        message={`已报名近期活动：${rec.openActivities.filter((o) => o.alreadyRegistered).map((o) => o.title).join('、')}`}
                      />
                    )}
                  </Card>
                </div>
              )}

              {tab === 'history' && (
                <Table
                  style={{ marginTop: 18 }}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  dataSource={records}
                  locale={{ emptyText: <Empty description="暂无参与记录，活动结束回填后展示" /> }}
                  columns={[
                    {
                      title: '活动',
                      render: (_, r) => (
                        <span>
                          <Tag>{ACTIVITY_TYPE_MAP[(r.activity?.type ?? 'other') as keyof typeof ACTIVITY_TYPE_MAP]}</Tag>
                          {r.activity?.title}
                        </span>
                      ),
                    },
                    { title: '时间', width: 120, render: (_, r) => dayjs(r.filledAt).format('YYYY-MM-DD') },
                    {
                      title: '参加',
                      width: 80,
                      render: (_, r) => (r.attended ? <Tag color="green">是</Tag> : <Tag>否</Tag>),
                    },
                    {
                      title: '关键信息',
                      render: (_, r) => (
                        <span style={{ fontSize: 12.5, color: '#666' }}>
                          {[
                            r.healthTopics?.length ? `关注：${r.healthTopics.join('、')}` : '',
                            r.haircutServices?.length ? `服务：${r.haircutServices.join('、')}` : '',
                            r.mealSituation,
                            r.healthNote ? `观察：${r.healthNote}` : '',
                          ].filter(Boolean).join('；') || '—'}
                        </span>
                      ),
                    },
                  ]}
                />
              )}
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
