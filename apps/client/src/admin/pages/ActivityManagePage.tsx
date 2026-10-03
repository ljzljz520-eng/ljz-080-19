import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd';
import {
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminApi } from '../api';
import {
  ACTIVITY_STATUS_MAP,
  ACTIVITY_TYPE_MAP,
  DUTY_MAP,
  MOBILITY_MAP,
  REGISTRATION_STATUS_MAP,
  type Activity,
  type Elder,
  type Registration,
  type Volunteer,
} from '../../api/types';
import AssignModal from './components/AssignModal';
import RecordModal from './components/RecordModal';

const statusColor: Record<string, string> = {
  registered: 'orange',
  checked_in: 'green',
  absent: 'default',
  cancelled: 'default',
};

export default function ActivityManagePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [elders, setElders] = useState<Elder[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [assignTarget, setAssignTarget] = useState<Registration | null>(null);
  const [recordTarget, setRecordTarget] = useState<Registration | null>(null);
  const [regModalOpen, setRegModalOpen] = useState(false);
  const [regForm] = Form.useForm();
  const [deskFilter, setDeskFilter] = useState<'pending' | 'checkedIn'>('pending');

  const load = useCallback(async () => {
    if (!id) return;
    const detail = await adminApi.activityDetail(id);
    setActivity(detail.activity);
    setRegs(detail.registrations);
  }, [id]);

  useEffect(() => {
    load();
    adminApi.elders().then(setElders);
    adminApi.volunteers().then(setVolunteers);
  }, [load]);

  const registered = regs.filter((r) => r.status !== 'cancelled');
  const checkedIn = registered.filter((r) => r.status === 'checked_in');
  const pending = registered.filter((r) => r.status === 'registered');
  const absent = registered.filter((r) => r.status === 'absent');
  const filledCount = registered.filter((r) => r.record).length;

  const checkIn = async (elderId: string) => {
    try {
      await adminApi.checkin(id!, elderId);
      message.success('签到成功');
      load();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const undo = async (registrationId: string) => {
    await adminApi.undoCheckin(registrationId);
    message.success('已撤销签到');
    load();
  };

  const manualRegister = async () => {
    const v = await regForm.validateFields();
    const elder = elders.find((e) => e.id === v.elderId)!;
    try {
      await adminApi.register({
        activityId: id,
        elderId: v.elderId,
        mobility: v.mobility ?? elder.mobility,
        needWheelchairSeat:
          v.needWheelchairSeat ?? (elder.mobility === 'wheelchair' || elder.wheelchairSeat),
        dietaryRestrictions: v.dietaryRestrictions?.length
          ? v.dietaryRestrictions
          : elder.dietaryRestrictions,
        transportNeed: v.needTransport
          ? {
              required: true,
              pickupAddress: v.pickupAddress || elder.address,
              pickupTime: v.pickupTime,
              contactPhone: v.contactPhone || elder.emergencyContactPhone,
              remark: v.transportRemark,
            }
          : { required: false },
        remark: v.remark,
      });
      message.success('报名已登记');
      setRegModalOpen(false);
      regForm.resetFields();
      load();
    } catch (e: any) {
      message.error(e.message);
    }
  };

  if (!activity) return <Card loading />;

  const baseColumns = [
    {
      title: '老人',
      width: 150,
      render: (_: any, r: Registration) => (
        <div>
          <b>{r.elder?.name}</b>
          <div style={{ color: '#999', fontSize: 12 }}>
            {r.elder?.gender === 'female' ? '女' : '男'} · {r.elder?.age}岁
          </div>
        </div>
      ),
    },
    {
      title: '行动能力',
      width: 110,
      render: (_: any, r: Registration) => (
        <Space size={4} wrap>
          <Tag>{MOBILITY_MAP[r.mobility]}</Tag>
          {r.needWheelchairSeat && <Tag color="magenta">♿轮椅位</Tag>}
        </Space>
      ),
    },
    {
      title: '饮食禁忌',
      width: 150,
      render: (_: any, r: Registration) =>
        r.dietaryRestrictions.length ? (
          <span>{r.dietaryRestrictions.join('、')}</span>
        ) : (
          <span style={{ color: '#bbb' }}>无</span>
        ),
    },
    {
      title: '接送需求',
      width: 210,
      render: (_: any, r: Registration) =>
        r.transportNeed.required ? (
          <div style={{ fontSize: 12.5 }}>
            <CarOutlined style={{ color: '#4a7fb8' }} /> {r.transportNeed.pickupAddress}
            {r.transportNeed.pickupTime && ` · ${r.transportNeed.pickupTime}`}
            {r.transportNeed.remark && <div style={{ color: '#c48a28' }}>📌 {r.transportNeed.remark}</div>}
          </div>
        ) : (
          <span style={{ color: '#bbb' }}>不需要</span>
        ),
    },
  ];

  return (
    <div>
      <Button type="link" style={{ padding: 0 }} onClick={() => navigate('/activities')}>
        ‹ 返回活动列表
      </Button>
      <div className="page-head">
        <h2>
          <Tag color="orange">{ACTIVITY_TYPE_MAP[activity.type]}</Tag>
          {activity.title}
          <Tag color={activity.status === 'ongoing' ? 'green' : 'default'} style={{ marginLeft: 8 }}>
            {ACTIVITY_STATUS_MAP[activity.status]}
          </Tag>
        </h2>
        <div className="desc">
          {dayjs(activity.startTime).format('YYYY年M月D日 HH:mm')} ~ {dayjs(activity.endTime).format('HH:mm')} · {activity.location}
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 40 }}>
          <Statistic title="报名人数" value={registered.length} suffix={`/ ${activity.capacity}`} />
          <Statistic title="♿ 轮椅位" value={activity.wheelchairUsed ?? 0} suffix={`/ ${activity.wheelchairCapacity}`} valueStyle={{ color: '#c95a78' }} />
          <Statistic title="🚐 接送车位" value={activity.transportUsed ?? 0} suffix={`/ ${activity.transportCapacity}`} valueStyle={{ color: '#4a7fb8' }} />
          <Statistic title="已签到" value={checkedIn.length} valueStyle={{ color: '#52c41a' }} />
          <Statistic title="已回填记录" value={`${filledCount}/${registered.length}`} />
        </div>
      </Card>

      <Card
        extra={
          <Space>
            <Button onClick={() => setRegModalOpen(true)}>＋ 代老人报名</Button>
          </Space>
        }
      >
        <Tabs
          defaultActiveKey={activity.status === 'ongoing' ? 'desk' : 'list'}
          items={[
            {
              key: 'desk',
              label: (
                <span>
                  <CheckCircleOutlined /> 现场签到台
                  {pending.length > 0 && <Badge count={pending.length} size="small" offset={[6, -2]} />}
                </span>
              ),
              children: (
                <div>
                  {activity.status === 'published' && (
                    <Alert
                      type="warning"
                      showIcon
                      style={{ marginBottom: 12 }}
                      message="活动尚未开始，可先签到；也可在活动列表点击「开始」将活动置为进行中"
                      action={<Button size="small" onClick={async () => { await adminApi.transition(activity.id, 'start'); load(); }}>立即开始</Button>}
                    />
                  )}
                  {activity.status === 'finished' && (
                    <Alert type="info" showIcon style={{ marginBottom: 12 }} message="活动已结束，签到入口关闭；未签到者已记为缺席" />
                  )}
                  <Space style={{ marginBottom: 12 }}>
                    <Button type={deskFilter === 'pending' ? 'primary' : 'default'} ghost={deskFilter === 'pending'} onClick={() => setDeskFilter('pending')}>
                      待签到（{pending.length}）
                    </Button>
                    <Button type={deskFilter === 'checkedIn' ? 'primary' : 'default'} ghost={deskFilter === 'checkedIn'} onClick={() => setDeskFilter('checkedIn')}>
                      已签到（{checkedIn.length}）
                    </Button>
                  </Space>
                  <Table
                    rowKey="id"
                    size="middle"
                    pagination={false}
                    dataSource={deskFilter === 'pending' ? pending : checkedIn}
                    locale={{ emptyText: <Empty description={deskFilter === 'pending' ? '全部签到完成 🎉' : '还没有人签到'} /> }}
                    columns={[
                      ...(baseColumns as any[]),
                      {
                        title: '状态',
                        width: 110,
                        render: (_: any, r: Registration) => (
                          <Tag color={statusColor[r.status]}>
                            {r.status === 'checked_in' && `已签到 ${dayjs(r.checkedInAt).format('HH:mm')}`}
                            {r.status === 'registered' && '待签到'}
                          </Tag>
                        ),
                      },
                      {
                        title: '操作',
                        width: 110,
                        render: (_: any, r: Registration) =>
                          r.status === 'registered' ? (
                            <Popconfirm
                              title={`为 ${r.elder?.name} 签到？`}
                              disabled={!['published', 'ongoing'].includes(activity.status)}
                              onConfirm={() => checkIn(r.elderId)}
                            >
                              <Button type="primary" size="small" disabled={!['published', 'ongoing'].includes(activity.status)}>
                                签到
                              </Button>
                            </Popconfirm>
                          ) : (
                            <Button size="small" onClick={() => undo(r.id)}>撤销</Button>
                          ),
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'list',
              label: (
                <span>
                  <ClockCircleOutlined /> 报名名单与照护分工（{registered.length}）
                </span>
              ),
              children: (
                <Table
                  rowKey="id"
                  size="middle"
                  pagination={registered.length > 8 ? { pageSize: 8 } : false}
                  dataSource={registered}
                  columns={[
                    ...(baseColumns as any[]),
                    {
                      title: '负责志愿者',
                      width: 220,
                      render: (_: any, r: Registration) => (
                        <Space size={4} wrap>
                          {r.volunteers?.length ? (
                            r.volunteers.map((v) => (
                              <Tag
                                key={v.assignmentId}
                                closable
                                closeIcon={<span style={{ fontSize: 10 }}>×</span>}
                                onClose={(e) => {
                                  e.preventDefault();
                                  Modal.confirm({
                                    title: `取消 ${v.volunteer?.name} 的「${DUTY_MAP[v.duty as keyof typeof DUTY_MAP]}」分工？`,
                                    onOk: async () => {
                                      await adminApi.unassign(v.assignmentId);
                                      load();
                                    },
                                  });
                                }}
                                color="green"
                              >
                                {v.volunteer?.name}·{DUTY_MAP[v.duty as keyof typeof DUTY_MAP]}
                              </Tag>
                            ))
                          ) : (
                            <span style={{ color: '#c48a28', fontSize: 12 }}>未安排</span>
                          )}
                        </Space>
                      ),
                    },
                    {
                      title: '状态',
                      width: 90,
                      render: (_: any, r: Registration) => (
                        <Tag color={statusColor[r.status]}>{REGISTRATION_STATUS_MAP[r.status]}</Tag>
                      ),
                    },
                    {
                      title: '操作',
                      width: 150,
                      render: (_: any, r: Registration) => (
                        <Space direction="vertical" size={0}>
                          <Button type="link" size="small" onClick={() => setAssignTarget(r)}>
                            安排分工
                          </Button>
                          {r.status === 'registered' && (
                            <Popconfirm
                              title="取消该老人报名？"
                              onConfirm={async () => {
                                await adminApi.cancelReg(r.id, '管理员代取消');
                                load();
                              }}
                            >
                              <Button type="link" size="small" danger>取消报名</Button>
                            </Popconfirm>
                          )}
                        </Space>
                      ),
                    },
                  ]}
                />
              ),
            },
            {
              key: 'records',
              label: `参与记录回填（${filledCount}/${registered.length}）`,
              children: (
                <div>
                  {activity.status === 'published' && (
                    <Alert
                      type="warning"
                      showIcon
                      style={{ marginBottom: 12 }}
                      message="活动开始后才能回填参与记录"
                    />
                  )}
                  <Table
                    rowKey="id"
                    size="middle"
                    pagination={registered.length > 8 ? { pageSize: 8 } : false}
                    dataSource={registered}
                    columns={[
                      {
                        title: '老人',
                        width: 120,
                        render: (_: any, r: Registration) => <b>{r.elder?.name}</b>,
                      },
                      { title: '签到结果', width: 100, render: (_: any, r: Registration) => <Tag color={statusColor[r.status]}>{REGISTRATION_STATUS_MAP[r.status]}</Tag> },
                      {
                        title: '参与记录',
                        render: (_: any, r: Registration) =>
                          r.record ? (
                            <div style={{ fontSize: 13, color: '#555' }}>
                              {r.record.attended ? '✅ 已参加' : '❌ 未参加'}
                              {r.record.healthTopics?.length ? ` · 主题：${r.record.healthTopics.join('、')}` : ''}
                              {r.record.haircutServices?.length ? ` · 服务：${r.record.haircutServices.join('、')}` : ''}
                              {r.record.healthNote && <div style={{ color: '#c95a78' }}>健康观察：{r.record.healthNote}</div>}
                              {typeof r.record.satisfaction === 'number' && <div>{'⭐'.repeat(r.record.satisfaction)}</div>}
                            </div>
                          ) : (
                            <span style={{ color: '#bbb' }}>尚未回填</span>
                          ),
                      },
                      {
                        title: '操作',
                        width: 110,
                        render: (_: any, r: Registration) => (
                          <Button
                            type={r.record ? 'default' : 'primary'}
                            size="small"
                            disabled={activity.status === 'published'}
                            onClick={() => setRecordTarget(r)}
                          >
                            {r.record ? '修改记录' : '回填记录'}
                          </Button>
                        ),
                      },
                    ]}
                  />
                  {absent.length > 0 && (
                    <Alert
                      style={{ marginTop: 12 }}
                      type="info"
                      showIcon
                      message={`${absent.map((r) => r.elder?.name).join('、')} 活动结束未签到，已自动记为缺席，建议电话回访并在参与记录中说明。`}
                    />
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      <AssignModal
        open={!!assignTarget}
        reg={assignTarget}
        volunteers={volunteers}
        onClose={() => setAssignTarget(null)}
        onChanged={load}
      />
      <RecordModal
        open={!!recordTarget}
        reg={recordTarget}
        onClose={() => setRecordTarget(null)}
        onChanged={load}
      />

      {/* 代老人报名 */}
      <Modal
        title="代老人登记报名"
        open={regModalOpen}
        width={600}
        onCancel={() => setRegModalOpen(false)}
        onOk={manualRegister}
        okText="确认报名"
        destroyOnClose
      >
        <Form form={regForm} layout="vertical" style={{ marginTop: 14 }}>
          <Form.Item name="elderId" label="选择老人" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="搜索老人姓名"
              options={elders.map((e) => ({
                value: e.id,
                label: `${e.name}（${e.gender === 'female' ? '女' : '男'} · ${e.age}岁 · ${MOBILITY_MAP[e.mobility]}）`,
              }))}
            />
          </Form.Item>
          <Alert
            style={{ marginBottom: 12 }}
            type="info"
            showIcon
            message="选择老人后，行动能力/轮椅位/饮食禁忌默认取其档案，可在下方按本场活动调整"
          />
          <Form.Item shouldUpdate noStyle>
            {() => {
              const eid = regForm.getFieldValue('elderId');
              const elder = elders.find((e) => e.id === eid);
              if (!elder) return null;
              return (
                <Descriptions column={2} size="small" bordered style={{ marginBottom: 12 }}>
                  <Descriptions.Item label="行动能力">{MOBILITY_MAP[elder.mobility]}</Descriptions.Item>
                  <Descriptions.Item label="日常轮椅位">{elder.wheelchairSeat ? '是' : '否'}</Descriptions.Item>
                  <Descriptions.Item label="饮食禁忌" span={2}>
                    {elder.dietaryRestrictions.join('、') || '无'}
                  </Descriptions.Item>
                </Descriptions>
              );
            }}
          </Form.Item>
          <Form.Item name="mobility" label="本场行动能力（默认取档案）">
            <Select
              allowClear
              placeholder="不选则取档案"
              options={Object.entries(MOBILITY_MAP).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item name="needWheelchairSeat" label="是否预留轮椅位">
            <Select
              allowClear
              placeholder="默认：乘轮椅老人自动预留"
              options={[{ value: true, label: '需要' }, { value: false, label: '不需要' }]}
            />
          </Form.Item>
          <Form.Item name="dietaryRestrictions" label="本场饮食禁忌（默认取档案）">
            <Select mode="tags" allowClear placeholder="不选则取档案" options={['低糖', '低盐', '软食', '清真', '素食', '海鲜过敏'].map((v) => ({ value: v }))} />
          </Form.Item>
          <Form.Item name="needTransport" label="是否需要接送" initialValue={false}>
            <Select options={[{ value: true, label: '需要接送' }, { value: false, label: '不需要' }]} />
          </Form.Item>
          <Form.Item shouldUpdate noStyle>
            {() =>
              regForm.getFieldValue('needTransport') ? (
                <div style={{ background: '#faf7f3', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                  <Form.Item name="pickupAddress" label="接人地址">
                    <Input placeholder="默认取老人住址" />
                  </Form.Item>
                  <Space>
                    <Form.Item name="pickupTime" label="接人时间">
                      <Input placeholder="如 08:50" style={{ width: 140 }} />
                    </Form.Item>
                    <Form.Item name="contactPhone" label="联系电话">
                      <Input placeholder="默认取紧急联系人" style={{ width: 200 }} />
                    </Form.Item>
                  </Space>
                  <Form.Item name="transportRemark" label="接送备注" style={{ marginBottom: 0 }}>
                    <Input placeholder="如：需要轮椅可上车" />
                  </Form.Item>
                </div>
              ) : null
            }
          </Form.Item>
          <Form.Item name="remark" label="其他备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
