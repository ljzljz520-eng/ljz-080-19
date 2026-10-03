import { useCallback, useEffect, useState } from 'react';
import {
  App as AntApp,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Input,
  Popconfirm,
  Row,
  Segmented,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import {
  CheckCircleOutlined,
  CarOutlined,
  ReloadOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { api } from '../../shared/api';
import {
  ACTIVITY_TYPE_META,
  MOBILITY_MAP,
  STATUS_META,
  TRANSPORT_MAP,
} from '../../shared/constants';
import type { ActivityView, RosterResult, RosterRow } from '../../shared/types';
import { formatDateTime } from '../../shared/format';
import BackfillModal from './BackfillModal';

type Filter = 'all' | 'registered' | 'checked_in' | 'no_show';

export default function RosterAdminPage() {
  const { id } = useParams();
  const { message } = AntApp.useApp();
  const [activity, setActivity] = useState<ActivityView>();
  const [roster, setRoster] = useState<RosterResult>();
  const [filter, setFilter] = useState<Filter>('all');
  const [keyword, setKeyword] = useState('');
  const [backfillRow, setBackfillRow] = useState<RosterRow>();
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    if (!id) return;
    const [a, r] = await Promise.all([api.getActivity(id), api.activityRoster(id)]);
    setActivity(a);
    setRoster(r);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, refreshKey]);

  const checkIn = async (registrationId: string, name: string) => {
    try {
      await api.checkInByRegistration(registrationId);
      message.success(`${name} 已签到`);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  const finish = async () => {
    if (!id) return;
    const res = await api.finishActivity(id);
    message.success(`已结束，${res.noShowCount} 人标记爽约`);
    setRefreshKey((k) => k + 1);
  };

  if (!activity || !roster) {
    return <Card loading />;
  }

  const kw = keyword.trim();
  const rows = roster.rows.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (!kw) return true;
    return (
      r.participant.name.includes(kw) ||
      r.participant.phone.includes(kw) ||
      r.transportAddress?.includes(kw) ||
      (r.careNote ?? '').includes(kw)
    );
  });

  const finished = activity.status === 'finished';

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Row justify="space-between" align="top" gutter={16}>
          <Col flex="auto">
            <Space align="center" size={10} wrap>
              <Tag color={ACTIVITY_TYPE_META[activity.type].color}>
                {ACTIVITY_TYPE_META[activity.type].emoji} {ACTIVITY_TYPE_META[activity.type].label}
              </Tag>
              <h2 style={{ margin: 0 }}>{activity.title}</h2>
              {finished ? <Tag>已结束</Tag> : <Tag color="processing">报名/进行中</Tag>}
            </Space>
            <Descriptions column={2} size="small" style={{ marginTop: 12 }}>
              <Descriptions.Item label="时间">{formatDateTime(activity.startTime)}</Descriptions.Item>
              <Descriptions.Item label="地点">{activity.location}</Descriptions.Item>
              <Descriptions.Item label="名额">
                {activity.stats.registeredCount}/{activity.capacity}（余 {activity.stats.remaining}）
              </Descriptions.Item>
              <Descriptions.Item label="轮椅位">
                {activity.stats.wheelchairSeatTaken}/{activity.wheelchairSpots}
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => setRefreshKey((k) => k + 1)}>
                刷新
              </Button>
              {!finished && (
                <Popconfirm
                  title="确认结束活动？"
                  description="所有未签到老人将标记为“爽约”，结束后可批量回填参与记录"
                  onConfirm={finish}
                >
                  <Button danger icon={<StopOutlined />}>
                    结束活动
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col span={6}>
          <Card><Statistic title="报名人数" value={roster.summary.total} prefix="👥" /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="已签到" value={roster.summary.checkedIn} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#389e0d' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="预留轮椅位" value={roster.summary.wheelchair} prefix="♿" valueStyle={{ color: '#cf6a00' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="需接送" value={roster.summary.needTransport} prefix={<CarOutlined />} valueStyle={{ color: '#1677ff' }} /></Card>
        </Col>
      </Row>

      <Card
        title="签到与照护名单"
        extra={
          <Space>
            <Input.Search
              placeholder="搜索姓名/电话/地址/备注"
              allowClear
              style={{ width: 240 }}
              onSearch={setKeyword}
              onChange={(e) => !e.target.value && setKeyword('')}
            />
            <Segmented
              value={filter}
              onChange={(v) => setFilter(v as Filter)}
              options={[
                { label: `全部 ${roster.summary.total}`, value: 'all' },
                { label: `待签到 ${roster.summary.total - roster.summary.checkedIn}`, value: 'registered' },
                { label: `已签到 ${roster.summary.checkedIn}`, value: 'checked_in' },
                { label: '爽约', value: 'no_show' },
              ]}
            />
          </Space>
        }
      >
        <Table
          rowKey="registrationId"
          dataSource={rows}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: <Empty description="暂无符合条件的报名" /> }}
          columns={[
            {
              title: '老人',
              fixed: 'left',
              width: 170,
              render: (_, r) => (
                <Space direction="vertical" size={1}>
                  <b>{r.participant.name}</b>
                  <span style={{ color: '#999', fontSize: 12 }}>
                    {r.participant.gender === 'female' ? '女' : '男'} · {r.participant.age}岁 · {r.participant.phone}
                  </span>
                </Space>
              ),
            },
            {
              title: '行动能力',
              width: 150,
              render: (_, r) => {
                const m = MOBILITY_MAP[r.mobility];
                return (
                  <Space size={4} wrap>
                    <Tag color={m.color} style={{ marginInlineEnd: 0 }}>{m.label}</Tag>
                    {r.wheelchairSeat && <Tag color="red" style={{ marginInlineEnd: 0 }}>♿ 轮椅位</Tag>}
                  </Space>
                );
              },
            },
            {
              title: '饮食禁忌',
              width: 170,
              render: (_, r) =>
                r.dietaryRestrictions.length ? (
                  <Space size={4} wrap>
                    {r.dietaryRestrictions.map((t) => (
                      <Tag key={t} color="orange" style={{ marginInlineEnd: 0 }}>{t}</Tag>
                    ))}
                  </Space>
                ) : (
                  <span style={{ color: '#bbb' }}>无</span>
                ),
            },
            {
              title: '接送需求',
              width: 210,
              render: (_, r) =>
                r.transportNeed === 'none' ? (
                  <span style={{ color: '#bbb' }}>自行前往</span>
                ) : (
                  <Tooltip title={r.transportAddress}>
                    <Space direction="vertical" size={0}>
                      <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                        🚐 {TRANSPORT_MAP[r.transportNeed].label}
                      </Tag>
                      <span style={{ color: '#999', fontSize: 12, maxWidth: 180 }} className="ellipsis">
                        {r.transportAddress}
                      </span>
                    </Space>
                  </Tooltip>
                ),
            },
            {
              title: '照护备注 / 紧急联系',
              render: (_, r) => (
                <Space direction="vertical" size={2}>
                  {(r.careNote || r.participant.healthNote) && (
                    <span style={{ color: '#b25b00' }}>
                      ⚠ {r.careNote ?? r.participant.healthNote}
                    </span>
                  )}
                  <span style={{ color: '#666', fontSize: 13 }}>
                    {r.emergencyContact.name} {r.emergencyContact.phone}
                  </span>
                </Space>
              ),
            },
            {
              title: '负责志愿者',
              width: 130,
              render: (_, r) => r.assignedVolunteerName ?? <span style={{ color: '#bbb' }}>未分配</span>,
            },
            {
              title: '状态',
              width: 90,
              render: (_, r) => {
                const s = STATUS_META[r.status];
                return <Tag color={s.color === '#1677ff' ? 'blue' : s.color === '#52c41a' ? 'green' : s.color === '#f5222d' ? 'red' : 'default'}>{s.label}</Tag>;
              },
            },
            {
              title: '操作',
              fixed: 'right',
              width: 170,
              render: (_, r) => (
                <Space direction="vertical" size={4}>
                  {r.status !== 'checked_in' && r.status !== 'cancelled' && !finished && (
                    <Button size="small" type="primary" ghost onClick={() => checkIn(r.registrationId, r.participant.name)}>
                      签到
                    </Button>
                  )}
                  {finished && (
                    <Button size="small" onClick={() => setBackfillRow(r)}>
                      回填参与记录
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <BackfillModal
        activity={activity}
        row={backfillRow}
        onClose={() => setBackfillRow(undefined)}
        onDone={() => {
          setBackfillRow(undefined);
          setRefreshKey((k) => k + 1);
          message.success('参与记录已保存，可用于后续服务推荐');
        }}
      />
    </Space>
  );
}
