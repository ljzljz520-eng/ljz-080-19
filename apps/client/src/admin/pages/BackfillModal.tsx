import { useEffect, useState } from 'react';
import {
  App as AntApp,
  Checkbox,
  Form,
  Input,
  Modal,
  Radio,
  Tag,
} from 'antd';
import { api } from '../../shared/api';
import { MOBILITY_MAP, TRANSPORT_MAP } from '../../shared/constants';
import type { ActivityView, ParticipationRecord, RosterRow } from '../../shared/types';

interface Props {
  activity: ActivityView;
  row?: RosterRow;
  onClose: () => void;
  onDone: (record: ParticipationRecord) => void;
}

const SUGGESTED_TAGS = [
  '现场血压偏高，建议复查',
  '情绪低落，建议社工跟进',
  '活动中身体不适',
  '对下次同类活动感兴趣',
  '可作为活跃长者志愿者',
  '需家属协同照护',
];

export default function BackfillModal({ activity, row, onClose, onDone }: Props) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!row) return;
    form.setFieldsValue({
      attended: row.status === 'checked_in',
      usedWheelchairSeat: row.wheelchairSeat,
      usedTransport: row.transportNeed !== 'none',
      mealNote: '',
      careSummary: '',
      tags: [],
    });
  }, [row, form]);

  const save = async () => {
    if (!row) return;
    const v = await form.validateFields();
    setSaving(true);
    try {
      const record = await api.backfill({
        registrationId: row.registrationId,
        attended: v.attended,
        usedWheelchairSeat: !!v.usedWheelchairSeat,
        usedTransport: !!v.usedTransport,
        mealNote: activity.hasMeal ? v.mealNote : undefined,
        careSummary: v.careSummary,
        tags: v.tags ?? [],
      });
      onDone(record);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const attended = Form.useWatch('attended', form);
  const tags: string[] = Form.useWatch('tags', form) ?? [];

  return (
    <Modal
      title={row ? `回填参与记录 · ${row.participant.name}` : ''}
      open={!!row}
      onCancel={onClose}
      onOk={save}
      confirmLoading={saving}
      okText="保存记录"
      cancelText="取消"
      width={580}
      destroyOnClose
    >
      {row && (
        <>
          <div style={{ background: '#f6f8f6', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#5b6b62' }}>
            报名信息：{MOBILITY_MAP[row.mobility].label}
            {row.wheelchairSeat ? '·预留轮椅位' : ''}
            {row.dietaryRestrictions.length ? `·禁忌：${row.dietaryRestrictions.join('、')}` : ''}
            {row.transportNeed !== 'none' ? `·${TRANSPORT_MAP[row.transportNeed].label}` : ''}
          </div>
          <Form form={form} layout="vertical">
            <Form.Item name="attended" label="是否实际参加" rules={[{ required: true }]}>
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                options={[
                  { label: '✅ 已参加', value: true },
                  { label: '❌ 未参加（爽约）', value: false },
                ]}
              />
            </Form.Item>

            {attended && (
              <>
                <Form.Item name="usedWheelchairSeat" valuePropName="checked" label="实际使用情况">
                  <Checkbox>活动中实际使用了轮椅位</Checkbox>
                </Form.Item>
                <Form.Item name="usedTransport" valuePropName="checked">
                  <Checkbox>实际使用了社区接送服务</Checkbox>
                </Form.Item>

                {activity.hasMeal && (
                  <Form.Item name="mealNote" label="用餐情况">
                    <Input placeholder="如：用餐正常 / 主食需进一步煮软 / 忌口执行到位" />
                  </Form.Item>
                )}
              </>
            )}

            <Form.Item
              name="careSummary"
              label="照护小结"
              tooltip="志愿者记录老人活动表现、突发情况或后续跟进建议"
            >
              <Input.TextArea
                rows={3}
                placeholder={
                  attended
                    ? '如：听讲认真，现场测血压 150/95 偏高，已提醒按时服药并建议就医复查'
                    : '如：电话无人接听，已联系家属，近期住院下次再约'
                }
              />
            </Form.Item>

            <Form.Item name="tags" label="服务标签（用于后续推荐）">
              <Checkbox.Group
                options={SUGGESTED_TAGS.map((t) => ({ label: t, value: t }))}
              />
            </Form.Item>
            {tags.length > 0 && (
              <div style={{ marginTop: -8, marginBottom: 8 }}>
                {tags.map((t) => (
                  <Tag key={t} color="green" style={{ marginBottom: 4 }}>{t}</Tag>
                ))}
              </div>
            )}
            <div style={{ color: '#999', fontSize: 12 }}>
              系统还会根据参加情况、轮椅位与接送使用情况自动补充标签，并用于后续活动推荐。
            </div>
          </Form>
        </>
      )}
    </Modal>
  );
}
