import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  DotLoading,
  Form,
  Input,
  NavBar,
  Picker,
  Radio,
  Stepper,
  Switch,
  TextArea,
  Toast,
} from 'antd-mobile';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../shared/api';
import {
  DIET_SUGGESTIONS,
  MOBILITY_OPTIONS,
  TRANSPORT_OPTIONS,
} from '../../shared/constants';
import type { ActivityView, Participant, Registration } from '../../shared/types';

export default function RegisterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<ActivityView>();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Registration>();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const selectedId = Form.useWatch('participantId', form) as string | undefined;
  const selected = participants.find((p) => p.id === selectedId);

  const mobility = Form.useWatch('mobility', form) as string | undefined;
  const wheelchairSeat = Form.useWatch('wheelchairSeat', form) as boolean | undefined;
  const transportNeed = Form.useWatch('transportNeed', form) as string | undefined;
  const dietary: string[] = Form.useWatch('dietaryRestrictions', form) ?? [];

  useEffect(() => {
    Promise.all([api.getActivity(id!), api.listParticipants()])
      .then(([a, ps]) => {
        setActivity(a);
        setParticipants(ps);
        form.setFieldsValue({
          mobility: 'independent',
          wheelchairSeat: false,
          dietaryRestrictions: [],
          transportNeed: 'none',
        });
      })
      .catch((e) => Toast.show({ icon: 'fail', content: e.message }));
  }, [id, form]);

  // 选择已有老人后，带出档案中的照护信息作为本次报名默认值
  const pickExisting = (pid: string) => {
    const p = participants.find((x) => x.id === pid);
    if (!p) return;
    form.setFieldsValue({
      participantId: pid,
      mobility: p.mobility,
      wheelchairSeat: p.mobility === 'wheelchair',
      dietaryRestrictions: p.dietaryRestrictions,
      emergencyName: p.emergencyContact.name,
      emergencyPhone: p.emergencyContact.phone,
      transportAddress: p.address,
    });
    setIsNew(false);
  };

  const toggleDiet = (tag: string, checked: boolean) => {
    const next = checked ? [...dietary, tag] : dietary.filter((t) => t !== tag);
    form.setFieldsValue({ dietaryRestrictions: next });
  };

  const customDiet = Form.useWatch('customDiet', form) as string | undefined;
  const addCustomDiet = () => {
    const v = customDiet?.trim();
    if (v && !dietary.includes(v)) {
      form.setFieldsValue({ dietaryRestrictions: [...dietary, v], customDiet: '' });
    }
  };

  const initialPickerColumns = useMemo(
    () => [
      participants.map((p) => ({
        label: `${p.name}（${p.age}岁）${p.phone}`,
        value: p.id,
      })),
    ],
    [participants],
  );

  const submit = async () => {
    if (!activity) return;
    try {
      const v = await form.validateFields();
      if (!v.emergencyName?.trim() || !/^1\d{10}$/.test(v.emergencyPhone ?? '')) {
        Toast.show({ icon: 'fail', content: '请填写紧急联系人姓名和 11 位手机号' });
        return;
      }
      if (v.transportNeed !== 'none' && !v.transportAddress?.trim()) {
        Toast.show({ icon: 'fail', content: '需要接送时请填写接送地址' });
        return;
      }
      setSubmitting(true);
      const payload: Record<string, unknown> = {
        activityId: id,
        mobility: v.mobility,
        wheelchairSeat: !!v.wheelchairSeat,
        dietaryRestrictions: v.dietaryRestrictions ?? [],
        transportNeed: v.transportNeed,
        transportAddress: v.transportNeed === 'none' ? undefined : v.transportAddress,
        careNote: v.careNote,
        emergencyContact: { name: v.emergencyName.trim(), phone: v.emergencyPhone.trim() },
      };
      if (isNew) {
        if (!v.newName?.trim() || !/^1\d{10}$/.test(v.newPhone ?? '')) {
          Toast.show({ icon: 'fail', content: '请填写老人姓名和 11 位联系电话' });
          setSubmitting(false);
          return;
        }
        payload.newParticipant = {
          name: v.newName.trim(),
          gender: v.gender ?? 'female',
          age: Number(v.age ?? 75),
          phone: v.newPhone.trim(),
          address: v.transportAddress ?? '',
          healthNote: v.healthNote,
        };
      } else {
        payload.participantId = v.participantId;
      }
      const reg = await api.register(payload);
      setDone(reg);
      window.scrollTo(0, 0);
    } catch (e) {
      if (e instanceof Error && e.message) Toast.show({ icon: 'fail', content: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!activity) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
        <DotLoading /> 加载中…
      </div>
    );
  }

  if (done) {
    return (
      <div>
        <NavBar onBack={() => navigate('/h5')}>报名成功</NavBar>
        <div style={{ textAlign: 'center', padding: '28px 0 6px' }}>
          <div style={{ fontSize: 56 }}>✅</div>
          <h2 style={{ margin: '6px 0' }}>报名成功</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 15 }}>{activity.title}</p>
        </div>
        <div className="code-box">
          <div>活动当天到场签到码</div>
          <div className="code-box__code">{done.checkInCode}</div>
          <div className="code-box__tip">请老人或家属记下这 6 位数字，到场报码即可签到</div>
        </div>
        <div className="care-box care-box--soft">
          {done.assignedVolunteerId ? (
            <>已为老人安排照护志愿者，活动当天名单中可看到<b>行动能力、饮食禁忌和接送</b>等信息，
            志愿者将提前联系确认接送。</>
          ) : (
            <>报名信息已登记，社区将尽快安排照护志愿者。</>
          )}
        </div>
        <div style={{ height: 14 }} />
        <Button className="big-button" color="primary" onClick={() => navigate('/h5/mine')}>
          查看我的报名
        </Button>
      </div>
    );
  }

  return (
    <div>
      <NavBar onBack={() => navigate(-1)}>报名登记</NavBar>
      <h2 className="page-title" style={{ marginTop: 10 }}>{activity.title}</h2>

      <Form layout="horizontal" form={form} requiredMarkStyle="none" className="reg-form">
        {/* 第一步：选择老人 */}
        <section className="common-card form-section">
          <h3 className="section-title">
            <span className="step-no">1</span>报名老人
          </h3>

          {!isNew && (
            <Form.Item name="participantId" rules={[{ required: true, message: '请选择老人' }]}>
              <Input readOnly placeholder="点击选择已建档的老人" onClick={() => setPickerVisible(true)} />
            </Form.Item>
          )}

          {selected && !isNew && (
            <div className="care-box care-box--soft" style={{ marginBottom: 12 }}>
              已选：<b>{selected.name}</b>（{selected.gender === 'female' ? '女' : '男'}·{selected.age}岁）
              {selected.healthNote ? `｜${selected.healthNote}` : ''}
              <br />
              下方照护信息已按档案预填，可按本次活动情况修改。
              <div style={{ marginTop: 8 }}>
                <Button size="small" fill="outline" onClick={() => { form.resetFields(); setIsNew(true); }}>
                  不是这位？为新老人报名
                </Button>
              </div>
            </div>
          )}

          {!selected && !isNew && (
            <div style={{ display: 'flex', gap: 10 }}>
              <Button block color="primary" fill="outline" onClick={() => setPickerVisible(true)}>
                选择已建档老人
              </Button>
              <Button block color="primary" fill="solid" onClick={() => setIsNew(true)}>
                为新老人报名
              </Button>
            </div>
          )}

          {isNew && (
            <div className="new-p-box">
              <div className="care-box care-box--warn" style={{ marginBottom: 12 }}>
                首次报名，将同时为老人建立社区照护档案。
              </div>
              <Form.Item name="newName" label="姓名" rules={[{ required: true, message: '请填写姓名' }]}>
                <Input placeholder="老人姓名" />
              </Form.Item>
              <Form.Item name="gender" label="性别" initialValue="female">
                <Radio.Group>
                  <Radio value="female">女</Radio>
                  <Radio value="male">男</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="age" label="年龄" initialValue={75}>
                <Stepper min={55} max={110} digits={0} />
              </Form.Item>
              <Form.Item name="newPhone" label="电话" rules={[{ required: true, message: '请填写电话' }]}>
                <Input placeholder="11 位手机号" maxLength={11} type="tel" />
              </Form.Item>
              <Form.Item name="healthNote" label="健康备注">
                <TextArea placeholder="如：糖尿病、高血压、装心脏起搏器等（选填）" rows={2} />
              </Form.Item>
              <Button size="small" fill="none" onClick={() => { setIsNew(false); form.setFieldsValue({ participantId: undefined }); }}>
                返回选择已建档老人
              </Button>
            </div>
          )}
        </section>

        {/* 第二步：照护信息 */}
        <section className="common-card form-section">
          <h3 className="section-title">
            <span className="step-no">2</span>照护信息登记
          </h3>
          <p className="form-tip">这些信息将出现在活动当天志愿者的照护名单上，请如实填写。</p>

          <Form.Item name="mobility" label="行动能力" rules={[{ required: true }]} className="stack-group">
            <Radio.Group>
                {MOBILITY_OPTIONS.map((o) => (
                  <Radio key={o.value} value={o.value} className="care-radio" block>
                    <span style={{ color: o.color, fontWeight: 700 }}>{o.label}</span>
                    <span className="care-radio__desc">{o.desc}</span>
                  </Radio>
                ))}
              </Radio.Group>
          </Form.Item>

          <Form.Item name="wheelchairSeat" valuePropName="checked" label="预留轮椅位">
            <Switch
              disabled={mobility !== 'wheelchair'}
              onChange={(v) => {
                if (mobility !== 'wheelchair' && v) form.setFieldsValue({ wheelchairSeat: false });
              }}
            />
          </Form.Item>
          <p className="form-tip">
            {mobility === 'wheelchair'
              ? `本场活动剩余轮椅位 ${activity.stats.wheelchairRemaining} 个，开启后为老人预留。`
              : '仅“依靠轮椅”的老人需要预留轮椅位；如情况有变请先调整行动能力。'}
          </p>
          {wheelchairSeat && activity.stats.wheelchairRemaining <= 0 && (
            <div className="care-box care-box--danger">本场轮椅位已订满，提交后将提示联系社区协调。</div>
          )}

          <div className="diet-block">
            <div className="diet-block__label">饮食禁忌 / 餐食要求{activity.hasMeal ? '（本场聚餐将据此备餐）' : '（选填）'}</div>
            <Form.Item name="dietaryRestrictions" hidden>
              <Input />
            </Form.Item>
            <div className="diet-tags">
              {DIET_SUGGESTIONS.map((tag) => (
                <Checkbox
                  key={tag}
                  checked={dietary.includes(tag)}
                  onChange={(checked) => toggleDiet(tag, checked)}
                  className="diet-chip"
                >
                  {tag}
                </Checkbox>
              ))}
            </div>
            <div className="diet-custom">
              <Form.Item name="customDiet" style={{ flex: 1, marginBottom: 0 }}>
                <Input placeholder="其他禁忌，手动添加" />
              </Form.Item>
              <Button color="primary" fill="outline" onClick={addCustomDiet}>
                添加
              </Button>
            </div>
            {dietary.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {dietary.map((t) => (
                  <span key={t} className="tag tag--warm">
                    {t}
                    <span
                      style={{ marginLeft: 6, cursor: 'pointer' }}
                      onClick={() => toggleDiet(t, false)}
                    >
                      ✕
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 第三步：接送与应急 */}
        <section className="common-card form-section">
          <h3 className="section-title">
            <span className="step-no">3</span>接送与应急联系
          </h3>

          {activity.transportProvided ? (
            <>
              <Form.Item name="transportNeed" label="接送需求" rules={[{ required: true }]} className="stack-group">
                <Radio.Group>
                    {TRANSPORT_OPTIONS.map((o) => (
                      <Radio key={o.value} value={o.value} className="care-radio" block>
                        <b>{o.label}</b>
                        <span className="care-radio__desc">{o.desc}</span>
                      </Radio>
                    ))}
                  </Radio.Group>
              </Form.Item>
              {transportNeed && transportNeed !== 'none' && (
                <Form.Item
                  name="transportAddress"
                  label="接送地址"
                  rules={[{ required: true, message: '请填写接送地址' }]}
                >
                  <TextArea placeholder="详细到楼栋门牌号，方便志愿者接人" rows={2} />
                </Form.Item>
              )}
            </>
          ) : (
            <div className="care-box care-box--warn" style={{ marginBottom: 12 }}>
              本活动不提供接送，请家属自行安排出行。
            </div>
          )}

          <Form.Item name="emergencyName" label="紧急联系人" rules={[{ required: true, message: '请填写紧急联系人' }]}>
            <Input placeholder="与老人关系 + 姓名，如：儿子 张建国" />
          </Form.Item>
          <Form.Item
            name="emergencyPhone"
            label="联系电话"
            rules={[
              { required: true, message: '请填写联系电话' },
              { pattern: /^1\d{10}$/, message: '请输入 11 位手机号' },
            ]}
          >
            <Input placeholder="11 位手机号" maxLength={11} type="tel" />
          </Form.Item>
          <Form.Item name="careNote" label="照护备注">
            <TextArea
              placeholder="如：需提醒服药、听不懂普通话请放慢语速、上下车需搀扶等（选填）"
              rows={3}
            />
          </Form.Item>
        </section>
      </Form>

      <div style={{ height: 12 }} />
      <Button
        className="big-button"
        color="primary"
        size="large"
        loading={submitting}
        onClick={submit}
        disabled={!isNew && !selectedId}
      >
        {!isNew && !selectedId ? '请先选择报名老人' : '确认报名'}
      </Button>

      <Picker
        visible={pickerVisible}
        columns={initialPickerColumns}
        onClose={() => setPickerVisible(false)}
        value={selectedId ? [selectedId] : []}
        onConfirm={(v) => {
          if (v[0]) pickExisting(String(v[0]));
        }}
        title="选择报名老人"
      >
        {() => null}
      </Picker>
    </div>
  );
}
