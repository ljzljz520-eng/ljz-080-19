import { useEffect, useState } from 'react';
import { Form, Input, Modal, Select, Tag, message } from 'antd';
import { adminApi } from '../../api';
import {
  DUTY_MAP,
  MOBILITY_MAP,
  MOBILITY_ORDER,
  type Registration,
  type Volunteer,
} from '../../../api/types';

export default function AssignModal({
  open,
  reg,
  volunteers,
  onClose,
  onChanged,
}: {
  open: boolean;
  reg: Registration | null;
  volunteers: Volunteer[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) form.resetFields();
  }, [open, reg, form]);

  if (!reg) return null;

  // 可选职责根据报名情况过滤
  const dutyOptions = (Object.keys(DUTY_MAP) as (keyof typeof DUTY_MAP)[])
    .filter((d) => {
      if (d === 'wheelchair_assist') return reg.needWheelchairSeat;
      if (d === 'transport') return reg.transportNeed.required;
      if (d === 'meal_assist') return reg.activity?.type === 'festival_meal';
      return true;
    })
    .map((d) => ({ value: d, label: DUTY_MAP[d] }));

  // 按照护能力过滤：可照护该老人行动等级
  const elderLevel = MOBILITY_ORDER.indexOf(reg.mobility);
  const eligible = volunteers.filter(
    (v) => MOBILITY_ORDER.indexOf(v.maxCareLevel) >= elderLevel,
  );

  const submit = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      await adminApi.assign(reg.id, {
        volunteerId: v.volunteerId,
        duty: v.duty,
        note: v.note,
      });
      message.success('分工已安排');
      onChanged();
      onClose();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`安排照护分工 — ${reg.elder?.name}`}
      open={open}
      onCancel={onClose}
      onOk={submit}
      confirmLoading={saving}
      okText="确认安排"
      destroyOnClose
    >
      <div style={{ background: '#faf7f3', borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 13, color: '#6f6a64' }}>
        老人行动能力：<Tag>{MOBILITY_MAP[reg.mobility]}</Tag>
        {reg.needWheelchairSeat && <Tag color="magenta">♿ 需轮椅位</Tag>}
        {reg.transportNeed.required && <Tag color="blue">🚐 需接送</Tag>}
        <div style={{ marginTop: 6 }}>饮食禁忌：{reg.dietaryRestrictions.join('、') || '无'}</div>
      </div>
      <Form form={form} layout="vertical">
        <Form.Item name="duty" label="照护职责" rules={[{ required: true }]}>
          <Select options={dutyOptions} placeholder="选择职责" />
        </Form.Item>
        <Form.Item name="volunteerId" label="负责志愿者" rules={[{ required: true }]}>
          <Select
            placeholder="选择志愿者"
            options={eligible.map((v) => ({
              value: v.id,
              label: `${v.name}（${MOBILITY_MAP[v.maxCareLevel]}可照护${v.canDrive ? ' · 可驾驶' : ''} · ${v.skills.join('/') || '陪护'}）`,
            }))}
            notFoundContent="没有符合该老人照护等级的志愿者"
          />
        </Form.Item>
        <Form.Item name="note" label="分工备注">
          <Input.TextArea rows={2} placeholder="如：3栋有台阶需搀扶，08:50到楼下" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
