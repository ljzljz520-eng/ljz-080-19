import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Col,
  Empty,
  List,
  Progress,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import { BulbOutlined } from '@ant-design/icons';
import { api } from '../../shared/api';
import { ACTIVITY_TYPE_META } from '../../shared/constants';
import type {
  ActivityView,
  Participant,
  ParticipationRecord,
  ServiceRecommendation,
} from '../../shared/types';

export default function RecordsAdminPage() {
  const [people, setPeople] = useState<Participant[]>([]);
  const [activities, setActivities] = useState<ActivityView[]>([]);
  const [allRecords, setAllRecords] = useState<ParticipationRecord[]>([]);
  const [participantId, setParticipantId] = useState<string>();
  const [records, setRecords] = useState<ParticipationRecord[]>();
  const [reco, setReco] = useState<ServiceRecommendation>();

  useEffect(() => {
    Promise.all([
      api.listParticipants(),
      api.listActivities(),
      // 汇总所有已结束活动的参与记录
      api.listActivities().then((acts) =>
        Promise.all(
          acts.map((a) =>
            api.recordsByActivity(a.id).catch(() => [] as ParticipationRecord[]),
          ),
        ),
      ),
    ]).then(([ps, acts, recGroups]) => {
      setPeople(ps);
      setActivities(acts);
      setAllRecords(recGroups.flat());
      if (ps[0]) setParticipantId(ps[0].id);
    });
  }, []);

  useEffect(() => {
    if (!participantId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReco(undefined);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecords(undefined);
    api.recordsByParticipant(participantId).then(setRecords);
    api.recommend(participantId).then(setReco).catch(() => undefined);
  }, [participantId]);

  const actMap = useMemo(() => new Map(activities.map((a) => [a.id, a])), [activities]);
  const pMap = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  return (
    <Tabs
      defaultActiveKey="participant"
      items={[
        {
          key: 'participant',
          label: '按老人查看 · 推荐',
          children: (
            <Row gutter={16}>
              <Col span={9}>
                <Card title="选择老人" extra={<Tag color="green">{people.length} 人建档</Tag>}>
                  <Select
                    style={{ width: '100%', marginBottom: 12 }}
                    size="large"
                    value={participantId}
                    onChange={setParticipantId}
                    placeholder="选择老人"
                    options={people.map((p) => ({
                      value: p.id,
                      label: `${p.name}（${p.gender === 'female' ? '女' : '男'}·${p.age}岁）`,
                    }))}
                    optionFilterProp="label"
                    showSearch
                  />
                  <List
                    dataSource={people}
                    renderItem={(p) => (
                      <List.Item
                        onClick={() => setParticipantId(p.id)}
                        style={{
                          cursor: 'pointer',
                          background: p.id === participantId ? '#edf5ef' : 'transparent',
                          borderRadius: 8,
                          padding: '10px 12px',
                          border: 'none',
                        }}
                      >
                        <List.Item.Meta
                          avatar={<div className="p-avatar">{p.name.slice(0, 1)}</div>}
                          title={<b>{p.name}</b>}
                          description={
                            <Space size={4} wrap>
                              <Tag style={{ marginInlineEnd: 0 }}>{p.age}岁</Tag>
                              {p.dietaryRestrictions.map((t) => (
                                <Tag key={t} color="orange" style={{ marginInlineEnd: 0 }}>{t}</Tag>
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
                <Card
                  title={
                    <Space>
                      <BulbOutlined style={{ color: '#2f6b4f' }} />
                      后续服务推荐
                    </Space>
                  }
                  style={{ marginBottom: 16 }}
                >
                  {!reco ? (
                    <Empty description="加载推荐中…" />
                  ) : (
                    <>
                      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
                        💡 {reco.reason}
                      </Typography.Paragraph>
                      {reco.suggestedActivities.length === 0 ? (
                        <Empty description="近期暂无可推荐活动" />
                      ) : (
                        reco.suggestedActivities.map((s) => {
                          const meta = ACTIVITY_TYPE_META[s.type];
                          const color = s.match >= 75 ? '#389e0d' : s.match >= 55 ? '#faad14' : '#bfbfbf';
                          return (
                            <div key={s.activityId} className="reco-row">
                              <span className="reco-row__emoji">{meta.emoji}</span>
                              <div className="reco-row__body">
                                <b>{s.title}</b>
                                <Progress
                                  percent={s.match}
                                  size="small"
                                  strokeColor={color}
                                  format={(v) => `匹配度 ${v}`}
                                />
                              </div>
                              <Tag color={meta.color}>{meta.label}</Tag>
                            </div>
                          );
                        })
                      )}
                    </>
                  )}
                </Card>

                <Card title="历史参与记录">
                  {!records ? (
                    <Empty description="加载中…" />
                  ) : records.length === 0 ? (
                    <Empty description="暂无参与记录，活动结束回填后将显示在这里" />
                  ) : (
                    <Timeline
                      items={records
                        .slice()
                        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                        .map((r) => {
                          const a = actMap.get(r.activityId);
                          return {
                            color: r.attended ? 'green' : 'red',
                            children: (
                              <div className="record-item">
                                <Space wrap>
                                  <b>{a ? `${ACTIVITY_TYPE_META[a.type].emoji} ${a.title}` : '未知活动'}</b>
                                  {r.attended ? <Tag color="green">已参加</Tag> : <Tag color="red">未参加</Tag>}
                                  {r.usedWheelchairSeat && <Tag color="orange">♿ 用轮椅位</Tag>}
                                  {r.usedTransport && <Tag color="blue">🚐 用接送</Tag>}
                                </Space>
                                {r.mealNote && (
                                  <div className="record-item__line">🍚 用餐：{r.mealNote}</div>
                                )}
                                {r.careSummary && (
                                  <div className="record-item__line">📝 {r.careSummary}</div>
                                )}
                                <div style={{ marginTop: 6 }}>
                                  {r.tags.map((t) => (
                                    <Tag key={t} color="geekblue" style={{ marginBottom: 4 }}>{t}</Tag>
                                  ))}
                                </div>
                              </div>
                            ),
                          };
                        })}
                    />
                  )}
                </Card>
              </Col>
            </Row>
          ),
        },
        {
          key: 'activity',
          label: '按活动查看记录',
          children: (
            <Card title="全部参与记录">
              <Table
                rowKey="id"
                dataSource={allRecords}
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: <Empty description="暂无已回填的参与记录" /> }}
                columns={[
                  {
                    title: '活动',
                    render: (_, r) => actMap.get(r.activityId)?.title ?? '未知活动',
                  },
                  {
                    title: '老人',
                    width: 120,
                    render: (_, r) => r.participantName ?? pMap.get(r.participantId)?.name,
                  },
                  {
                    title: '参加',
                    width: 90,
                    render: (_, r) =>
                      r.attended ? <Tag color="green">已参加</Tag> : <Tag color="red">爽约</Tag>,
                  },
                  { title: '用餐情况', dataIndex: 'mealNote', width: 180 },
                  { title: '照护小结', dataIndex: 'careSummary' },
                  {
                    title: '标签',
                    width: 260,
                    render: (_, r) => (
                      <Space size={4} wrap>
                        {r.tags.map((t) => (
                          <Tag key={t} color="geekblue" style={{ marginInlineEnd: 0 }}>{t}</Tag>
                        ))}
                      </Space>
                    ),
                  },
                ]}
              />
            </Card>
          ),
        },
      ]}
    />
  );
}
