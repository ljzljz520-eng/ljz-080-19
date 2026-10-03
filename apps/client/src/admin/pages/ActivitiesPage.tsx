import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  TimePicker,
  message,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { adminApi } from '../api';
import {
  ACTIVITY_STATUS_MAP,
  ACTIVITY_TYPE_MAP,
  type Activity,
  type ActivityStatus,
} from '../../api/types';

const STATUS_COLOR: Record<ActivityStatus, string> = {
  draft: 'default',
  published: 'orange',
  ongoing: 'green',
  finished: 'default',
  cancelled: 'default',
};

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [date, setDate] = useState<Dayjs | null>(null);

  const load = () => {
    setLoading(true);
    adminApi
      .activities()
      .then(setList)
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const create = async () => {
    const v = await form.validateFields();
    if (!date) {
      message.warning('请选择活动日期');
      return;
    }
    const startTime = date
      .hour(v.startTime.hour())
      .minute(v.startTime.minute())
      .second(0)
      .millisecond(0)
      .toISOString();
    const endTime = date
      .hour(v.endTime.hour())
      .minute(v.endTime.minute())
      .second(0)
      .millisecond(0)
      .toISOString();
    try {
      const a = await adminApi.createActivity({
        title: v.title,
        type: v.type,
        description: v.description,
        location: v.location,
        startTime,
        endTime,
        capacity: v.capacity,
        wheelchairCapacity: v.wheelchairCapacity ?? 0,
        transportCapacity: v.transportCapacity ?? 0,
      });
      message.success('活动已发布');
      setModalOpen(false);
      form.resetFields();
      setDate(null);
      navigate(`/activities/${a.id}`);
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const doTransition = async (a: Activity, action: 'start' | 'finish' | 'cancel') => {
    try {
      await adminApi.transition(a.id, action);
      message.success('操作成功');
      load();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  return (
    <div>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h2>活动与报名</h2>
          <div className="desc">发布活动、设置名额与无障碍资源，并跟进报名、签到和参与记录</div>
        </div>
        <Button type="primary" size="large" onClick={() => setModalOpen(true)}>
          ＋ 发布活动
        </Button>
      </div>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={list}
          pagination={false}
          columns={[
            {
              title: '活动',
              dataIndex: 'title',
              render: (_, a) => (
                <div>
                  <Tag>{ACTIVITY_TYPE_MAP[a.type]}</Tag>
                  <b>{a.title}</b>
                  <div style={{ color: '#999', fontSize: 12 }}>{a.location}</div>
                </div>
              ),
            },
            {
              title: '时间',
              dataIndex: 'startTime',
              width: 170,
              render: (v, a) => (
                <span style={{ fontSize: 13 }}>
                  {dayjs(v).format('MM-DD HH:mm')}
                  <br />~ {dayjs(a.endTime).format('HH:mm')}
                </span>
              ),
            },
            {
              title: '名额',
              width: 210,
              render: (_, a) => (
                <Space size="small" style={{ fontSize: 13 }}>
                  <Tag>总 {a.registeredCount}/{a.capacity}</Tag>
                  <Tag color="magenta">♿ {a.wheelchairUsed}/{a.wheelchairCapacity}</Tag>
                  <Tag color="blue">🚐 {a.transportUsed}/{a.transportCapacity}</Tag>
                </Space>
              ),
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 90,
              render: (s: ActivityStatus) => <Tag color={STATUS_COLOR[s]}>{ACTIVITY_STATUS_MAP[s]}</Tag>,
            },
            {
              title: '操作',
              width: 230,
              render: (_, a) => (
                <Space>
                  <Button type="link" size="small" onClick={() => navigate(`/activities/${a.id}`)}>
                    管理
                  </Button>
                  {a.status === 'published' && (
                    <Popconfirm title="确认活动开始？开始后可现场签到" onConfirm={() => doTransition(a, 'start')}>
                      <Button type="link" size="small">开始</Button>
                    </Popconfirm>
                  )}
                  {a.status === 'ongoing' && (
                    <Popconfirm
                      title="确认结束活动？未签到老人将记为缺席"
                      onConfirm={() => doTransition(a, 'finish')}
                    >
                      <Button type="link" size="small" style={{ color: '#52c41a' }}>结束</Button>
                    </Popconfirm>
                  )}
                  {['published', 'ongoing'].includes(a.status) && (
                    <Popconfirm title="确认取消该活动？" onConfirm={() => doTransition(a, 'cancel')}>
                      <Button type="link" size="small" danger>取消</Button>
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
        open={modalOpen}
        width={620}
        onCancel={() => setModalOpen(false)}
        onOk={create}
        okText="发布"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="活动标题" rules={[{ required: true }]}>
            <Input placeholder="如：秋季老年健康讲座：糖尿病饮食管理" />
          </Form.Item>
          <Space style={{ display: 'flex' }}>
            <Form.Item name="type" label="活动类型" rules={[{ required: true }]} initialValue="health_lecture">
              <Select
                style={{ width: 160 }}
                options={Object.entries(ACTIVITY_TYPE_MAP).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
            <Form.Item label="活动日期" required>
              <DatePicker value={date} onChange={setDate} placeholder="选择日期" style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="startTime" label="开始时间" rules={[{ required: true }]}>
              <TimePicker minuteStep={5} format="HH:mm" style={{ width: 110 }} />
            </Form.Item>
            <Form.Item name="endTime" label="结束时间" rules={[{ required: true }]}>
              <TimePicker minuteStep={5} format="HH:mm" style={{ width: 110 }} />
            </Form.Item>
          </Space>
          <Form.Item name="location" label="活动地点" rules={[{ required: true }]}>
            <Input placeholder="如：社区活动中心一层多功能厅" />
          </Form.Item>
          <Form.Item name="description" label="活动介绍">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Space size="large">
            <Form.Item name="capacity" label="总名额" rules={[{ required: true }]} initialValue={30}>
              <InputNumber min={1} style={{ width: 130 }} addonAfter="人" />
            </Form.Item>
            <Form.Item name="wheelchairCapacity" label="轮椅位数" initialValue={4}>
              <InputNumber min={0} style={{ width: 130 }} addonAfter="个" />
            </Form.Item>
            <Form.Item name="transportCapacity" label="接送车位" initialValue={6}>
              <InputNumber min={0} style={{ width: 130 }} addonAfter="座" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
