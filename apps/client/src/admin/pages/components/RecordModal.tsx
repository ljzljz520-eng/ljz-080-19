import { useEffect, useState } from 'react';
import { Form, Input, Modal, Radio, Rate, Select, message } from 'antd';
import { adminApi } from '../../api';
import { ACTIVITY_TYPE_MAP, type Registration } from '../../../api/types';

const HEALTH_TOPIC_OPTIONS = [
  '血糖监测', '血压管理', '糖尿病足预防', '用药指导', '跌倒预防', '心脑血管保健', '营养饮食', '康复锻炼',
];
const HAIRCUT_OPTIONS = ['理发', '剃须', '修面', '洗发'];

export default function RecordModal({
  open,
  reg,
  onClose,
  onChanged,
}: {
  open: boolean;
  reg: Registration | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [attended, setAttended] = useState(true);

  useEffect(() => {
    if (open && reg) {
      const r = reg.record;
      form.setFieldsValue({
        attended: r ? r.attended : true,
        healthTopics: r?.healthTopics ?? [],
        haircutServices: r?.haircutServices ?? [],
        mealSituation: r?.mealSituation,
        healthNote: r?.healthNote,
        careFeedback: r?.careFeedback,
        satisfaction: r?.satisfaction,
      });
      setAttended(r ? r.attended : true);
    }
  }, [open, reg, form]);

  if (!reg) return null;
  const type = reg.activity?.type;

  const submit = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      await adminApi.fillRecord(reg.id, { ...v, filledBy: '社区管理员' });
      message.success('参与记录已回填');
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
      title={`回填参与记录 — ${reg.elder?.name} · ${ACTIVITY_TYPE_MAP[type ?? 'other']}`}
      open={open}
      onCancel={onClose}
      onOk={submit}
      confirmLoading={saving}
      width={580}
      okText="保存记录"
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="attended" label="是否实际参加" rules={[{ required: true }]}>
          <Radio.Group onChange={(e) => setAttended(e.target.value)}>
            <Radio.Button value={true}>✅ 已参加</Radio.Button>
            <Radio.Button value={false}>❌ 未参加/缺席</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {attended && type === 'health_lecture' && (
          <Form.Item name="healthTopics" label="关注的健康主题（用于推荐后续讲座）">
            <Select mode="tags" options={HEALTH_TOPIC_OPTIONS.map((t) => ({ value: t, label: t }))} placeholder="选择或输入主题" />
          </Form.Item>
        )}
        {attended && type === 'haircut' && (
          <Form.Item name="haircutServices" label="已提供的义剪服务">
            <Select mode="tags" options={HAIRCUT_OPTIONS.map((t) => ({ value: t, label: t }))} />
          </Form.Item>
        )}
        {attended && type === 'festival_meal' && (
          <Form.Item name="mealSituation" label="实际用餐情况">
            <Input.TextArea rows={2} placeholder="如：已按清真/低糖单独备餐，老人进食良好" />
          </Form.Item>
        )}

        <Form.Item name="healthNote" label="现场健康观察">
          <Input.TextArea
            rows={2}
            placeholder="如：课后测血糖8.9略偏高；行走不稳，建议下次安排轮椅"
          />
        </Form.Item>
        <Form.Item name="careFeedback" label="照护反馈">
          <Input.TextArea rows={2} placeholder="接送、用餐、现场照护的情况说明" />
        </Form.Item>
        <Form.Item name="satisfaction" label="满意度">
          <Rate />
        </Form.Item>
      </Form>
    </Modal>
  );
}
