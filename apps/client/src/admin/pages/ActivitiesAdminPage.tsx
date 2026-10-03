import { useEffect, useState } from 'react';
import {
  App as AntApp,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd';
import { PlusOutlined, ReloadOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import { api } from '../../shared/api';
import { ACTIVITY_TYPE_META } from '../../shared/constants';
import type { ActivityView, Volunteer } from '../../shared/types';
import { formatDateTime } from '../../shared/format';

const TYPE_OPTIONS = Object.entries(ACTIVITY_TYPE_META).map(([value, m]) => ({
  value,
  label: `${m.emoji} ${m.label}`,
}));

export default function ActivitiesAdminPage() {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const [data, setData] = useState<ActivityView[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setData(await api.listActivities());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    api.listVolunteers().then(setVolunteers);
  }, []);

  const publish = async () => {
    const v = await form.validateFields();
    const s: Dayjs = v.range[0];
    const e: Dayjs = v.range[1];
    setSubmitting(true);
    try {
      await api.createActivity({
        title: v.title,
        type: v.type,
        description: v.description ?? '',
        location: v.location,
        startTime: s.toISOString(),
        endTime: e.toISOString(),
        capacity: v.capacity,
        wheelchairSpots: v.wheelchairSpots,
        hasMeal: v.hasMeal,
        transportProvided: v.transportProvided,
        volunteerIds: v.volunteerIds ?? [],
      });
      message.success('活动已发布，老人端可立即报名');
      setOpen(false);
      form.resetFields();
      load();
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const finish = async (id: string) => {
    try {
      const res = await api.finishActivity(id);
      message.success(`活动已结束，${res.noShowCount} 位未签到老人已标记“爽约”，请回填参与记录`);
      navigate(`/admin/activities/${id}/roster`);
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  const totalRegs = data.reduce((s, a) => s + a.stats.registeredCount, 0);
  const totalChecked = data.reduce((s, a) => s + a.stats.checkedInCount, 0);
  const totalWheelchair = data.reduce((s, a) => s + a.stats.wheelchairSeatTaken, 0);
  const totalTransport = data.reduce((s, a) => s + a.stats.transportCount, 0);

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: '#2f6b4f' }}>📅</div>
            <div><div className="stat-card__num">{data.length}</div><div className="stat-card__label">活动总数</div></div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: '#1677ff' }}>👥</div>
            <div><div className="stat-card__num">{totalRegs}</div><div className="stat-card__label">累计报名人次</div></div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: '#52c41a' }}>✅</div>
            <div><div className="stat-card__num">{totalChecked}</div><div className="stat-card__label">累计签到人次</div></div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ background: '#f59e4c' }}>♿</div>
            <div><div className="stat-card__num">{totalWheelchair} / {totalTransport}</div><div className="stat-card__label">轮椅位占用 / 需接送人次</div></div>
          </div>
        </Col>
      </Row>

      <Card
        title="活动列表"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
              发布活动
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          pagination={false}
          columns={[
            {
              title: '活动',
              dataIndex: 'title',
              render: (_, a) => (
                <Space direction="vertical" size={2}>
                  <Space>
                    <span>{ACTIVITY_TYPE_META[a.type].emoji}</span>
                  <b>{a.title}</b>
                  </Space>
                  <span style={{ color: '#999', fontSize: 12 }}>{a.location}</span>
                </Space>
              ),
            },
            {
              title: '类型',
              dataIndex: 'type',
              width: 110,
              render: (t: keyof typeof ACTIVITY_TYPE_META) => (
                <Tag color={ACTIVITY_TYPE_META[t].color}>{ACTIVITY_TYPE_META[t].label}</Tag>
              ),
            },
            { title: '时间', width: 200, render: (_, a) => `${formatDateTime(a.startTime)} 起` },
            {
              title: '报名 / 名额',
              width: 120,
              render: (_, a) => (
                <span>
                  <b style={{ color: '#2f6b4f' }}>{a.stats.registeredCount}</b> / {a.capacity}
                  <span style={{ color: '#bbb' }}>（余 {a.stats.remaining}）</span>
                </span>
              ),
            },
            {
              title: '特殊照护',
              width: 200,
              render: (_, a) => (
                <Space size={4} wrap>
                  <Tag color="orange">♿ {a.stats.wheelchairSeatTaken}/{a.wheelchairSpots}</Tag>
                  <Tag color="geekblue">🚐 {a.stats.transportCount}</Tag>
                  {a.hasMeal && <Tag color="gold">🍚 供餐</Tag>}
                </Space>
              ),
            },
            {
              title: '状态',
              width: 100,
              render: (_, a) =>
                a.status === 'finished' ? (
                  <Badge status="default" text="已结束" />
                ) : (
                  <Badge status="processing" text="报名中" />
                ),
            },
            {
              title: '操作',
              width: 230,
              render: (_, a) => (
                <Space>
                  <Button
                    size="small"
                    icon={<TeamOutlined />}
                    onClick={() => navigate(`/admin/activities/${a.id}/roster`)}
                  >
                    签到名单
                  </Button>
                  {a.status !== 'finished' && (
                    <Popconfirm
                      title="结束活动"
                      description="未签到的报名将标记为爽约，随后请回填参与记录"
                      onConfirm={() => finish(a.id)}
                    >
                      <Button size="small" danger>
                        结束活动
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="发布活动"
        open={open}
        width={620}
        onCancel={() => setOpen(false)}
        onOk={publish}
        confirmLoading={submitting}
        okText="发布"
        cancelText="取消"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            type: 'health_talk',
            capacity: 40,
            wheelchairSpots: 4,
            hasMeal: false,
            transportProvided: true,
            volunteerIds: [],
          }}
          style={{ marginTop: 16 }}
        >
          <Form.Item name="title" label="活动标题" rules={[{ required: true, message: '请填写标题' }]}>
            <Input placeholder="如：秋季心脑血管健康讲座" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={10}>
              <Form.Item name="type" label="活动类型" rules={[{ required: true }]}>
                <Select options={TYPE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item name="location" label="活动地点" rules={[{ required: true, message: '请填写地点' }]}>
                <Input placeholder="如：社区活动中心一楼" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="range"
            label="活动时间"
            rules={[{ required: true, message: '请选择开始与结束时间' }]}
          >
            <DatePicker.RangePicker
              showTime={{ format: 'HH:mm', minuteStep: 15 }}
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              minDate={dayjs()}
            />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="capacity" label="报名名额" rules={[{ required: true }]}>
                <InputNumber min={1} max={500} style={{ width: '100%' }} addonAfter="人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="wheelchairSpots"
                label="轮椅位数"
                tooltip="需预留无障碍空间的轮椅坐席数量，不能超过总名额"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} max={500} style={{ width: '100%' }} addonAfter="位" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="volunteerIds" label="负责志愿者（活动当天照护名单按此筛选）">
            <Select
              mode="multiple"
              placeholder="选择本场活动的志愿者"
              options={volunteers.map((v) => ({ value: v.id, label: v.name }))}
              optionFilterProp="label"
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="transportProvided" label="提供接送" valuePropName="checked">
                <Switch checkedChildren="有" unCheckedChildren="无" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="hasMeal" label="提供餐饮" valuePropName="checked">
                <Switch checkedChildren="有" unCheckedChildren="无" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="活动介绍">
            <Input.TextArea rows={3} placeholder="活动内容、主讲人、注意事项等" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
