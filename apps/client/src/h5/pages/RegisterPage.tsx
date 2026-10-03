import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Input,
  NavBar,
  Switch,
  TextArea,
  Toast,
} from 'antd-mobile';
import { h5Api } from '../api';
import {
  ACTIVITY_TYPE_MAP,
  DIET_OPTIONS,
  MOBILITY_MAP,
  type Activity,
  type Elder,
  type MobilityLevel,
} from '../../api/types';

const MOBILITY_EMOJI: Record<MobilityLevel, string> = {
  independent: '🚶',
  cane: '🦯',
  walker: '🧓',
  wheelchair: '♿',
  bedridden: '🛏️',
};

export default function RegisterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [elder, setElder] = useState<Elder | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [mobility, setMobility] = useState<MobilityLevel>('independent');
  const [needWheelchairSeat, setNeedWheelchairSeat] = useState(false);
  const [diets, setDiets] = useState<string[]>([]);
  const [customDiet, setCustomDiet] = useState('');
  const [needTransport, setNeedTransport] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [transportRemark, setTransportRemark] = useState('');
  const [remark, setRemark] = useState('');

  useEffect(() => {
    Promise.all([
      h5Api.activity(id!),
      h5Api.elders().then((list) => {
        const localId = localStorage.getItem('h5.elderId');
        const me = list.find((e) => e.id === localId) ?? list[0];
        if (me) {
          setElder(me);
          setMobility(me.mobility);
          setNeedWheelchairSeat(me.mobility === 'wheelchair' || me.wheelchairSeat);
          setDiets(me.dietaryRestrictions);
          setContactPhone(me.emergencyContactPhone ?? me.phone ?? '');
          setPickupAddress(me.address ?? '');
        }
      }),
    ])
      .then(([a]) => setActivity(a))
      .catch((e) => Toast.show({ icon: 'fail', content: e.message }));
  }, [id]);

  const allDiets = useMemo(
    () => Array.from(new Set([...DIET_OPTIONS, ...diets.filter((d) => !DIET_OPTIONS.includes(d))])),
    [diets],
  );

  const toggleDiet = (d: string) =>
    setDiets((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const submit = async () => {
    if (needTransport && !pickupAddress.trim()) {
      Toast.show({ icon: 'fail', content: '请填写接人地址' });
      return;
    }
    const body = {
      activityId: id,
      elderId: elder?.id,
      mobility,
      needWheelchairSeat,
      dietaryRestrictions: diets,
      transportNeed: needTransport
        ? {
            required: true,
            pickupAddress,
            pickupTime,
            contactPhone,
            remark: transportRemark || undefined,
          }
        : { required: false },
      remark: remark || undefined,
    };
    setSubmitting(true);
    try {
      await h5Api.register(body);
      Toast.show({ icon: 'success', content: '报名成功！' });
      setTimeout(() => navigate('/mine', { replace: true }), 700);
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!activity || !elder) return <NavBar onBack={() => navigate(-1)}>活动报名</NavBar>;

  return (
    <div>
      <NavBar
        onBack={() => navigate(-1)}
        style={{ background: '#fff', '--height': '46px' }}
      >
        活动报名登记
      </NavBar>
      <div className="page">
        <Card style={{ borderRadius: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.5 }}>
            {activity.title}
          </div>
          <div style={{ color: '#6f6a64', fontSize: 13, marginTop: 6 }}>
            {ACTIVITY_TYPE_MAP[activity.type]} · {activity.location}
          </div>
        </Card>

        <div className="form-card">
          <div className="form-title">👤 报名老人</div>
          <div style={{ color: '#6f6a64', fontSize: 14 }}>
            {elder.name}（{elder.gender === 'female' ? '女' : '男'} · {elder.age}岁）
            {elder.conditions.length > 0 && ` · ${elder.conditions.join('、')}`}
          </div>
          <div className="form-hint" style={{ marginTop: 6 }}>
            以下信息已按老人档案预填，如本场活动情况有变化可直接修改
          </div>
        </div>

        <div className="form-card">
          <div className="form-title">🚶 行动能力</div>
          <div className="form-hint">志愿者将据此安排接送与现场照护</div>
          <div className="mobility-grid">
            {(Object.keys(MOBILITY_MAP) as MobilityLevel[]).map((m) => (
              <div
                key={m}
                className={`mob-item ${mobility === m ? 'active' : ''}`}
                onClick={() => {
                  setMobility(m);
                  if (m === 'wheelchair') setNeedWheelchairSeat(true);
                }}
              >
                <span className="emoji">{MOBILITY_EMOJI[m]}</span>
                {MOBILITY_MAP[m]}
              </div>
            ))}
          </div>
        </div>

        <div className="form-card">
          <div className="form-title">♿ 轮椅位</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#6f6a64' }}>
              本场活动需要为老人预留轮椅位
              <br />
              <span style={{ fontSize: 12, color: '#a09a93' }}>
                剩余轮椅位 {Math.max((activity.wheelchairCapacity ?? 0) - (activity.wheelchairUsed ?? 0), 0)} 个
              </span>
            </span>
            <Switch
              checked={needWheelchairSeat}
              onChange={setNeedWheelchairSeat}
              style={{ '--checked-color': '#e8794a' }}
            />
          </div>
        </div>

        <div className="form-card">
          <div className="form-title">🍲 饮食禁忌与偏好</div>
          <div className="form-hint">节日聚餐将按此单独备餐，可多选</div>
          <div className="diet-tags">
            {allDiets.map((d) => (
              <span
                key={d}
                className={`diet-tag ${diets.includes(d) ? 'active' : ''}`}
                onClick={() => toggleDiet(d)}
              >
                {d}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <Input
              placeholder="补充其他禁忌，如“花生过敏”"
              value={customDiet}
              onChange={setCustomDiet}
              clearable
              style={{ '--font-size': '14px', background: '#faf8f6', borderRadius: 8, padding: '8px 10px' }}
            />
            <Button
              size="small"
              color="primary"
              style={{ '--background-color': '#e8794a' as any }}
              onClick={() => {
                const v = customDiet.trim();
                if (v && !diets.includes(v)) setDiets([...diets, v]);
                setCustomDiet('');
              }}
            >
              添加
            </Button>
          </div>
        </div>

        <div className="form-card">
          <div className="form-title">🚐 接送需求</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#6f6a64' }}>
              需要志愿者车辆接送
              <br />
              <span style={{ fontSize: 12, color: '#a09a93' }}>
                剩余接送车位 {Math.max((activity.transportCapacity ?? 0) - (activity.transportUsed ?? 0), 0)} 个
              </span>
            </span>
            <Switch
              checked={needTransport}
              onChange={setNeedTransport}
              style={{ '--checked-color': '#e8794a' }}
            />
          </div>
          {needTransport && (
            <div className="transport-box">
              <div style={{ marginBottom: 8, fontSize: 14 }}>接人地址 *</div>
              <Input
                placeholder="如：幸福里社区3栋2单元301"
                value={pickupAddress}
                onChange={setPickupAddress}
                style={{ '--font-size': '14px', background: '#fff', borderRadius: 8, padding: '8px 10px' }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 8, fontSize: 14 }}>接人时间</div>
                  <Input
                    type="time"
                    value={pickupTime}
                    onChange={setPickupTime}
                    style={{ '--font-size': '14px', background: '#fff', borderRadius: 8, padding: '8px 10px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 8, fontSize: 14 }}>随车联系电话</div>
                  <Input
                    type="tel"
                    placeholder="家属/老人电话"
                    value={contactPhone}
                    onChange={setContactPhone}
                    style={{ '--font-size': '14px', background: '#fff', borderRadius: 8, padding: '8px 10px' }}
                  />
                </div>
              </div>
              <div style={{ margin: '10px 0 8px', fontSize: 14 }}>接送备注</div>
              <TextArea
                placeholder="如：单元楼有台阶需搀扶、需携带轮椅上车"
                value={transportRemark}
                onChange={setTransportRemark}
                rows={2}
                style={{ '--font-size': '14px', background: '#fff', borderRadius: 8 }}
              />
            </div>
          )}
        </div>

        <div className="form-card">
          <div className="form-title">💬 其他需要告知的事项</div>
          <TextArea
            placeholder="如：老人听力不好请大声交流、中途需服药等"
            value={remark}
            onChange={setRemark}
            rows={2}
            style={{ '--font-size': '14px', background: '#faf8f6', borderRadius: 8 }}
          />
        </div>
      </div>

      <div className="bottom-cta">
        <Button
          block
          size="large"
          color="primary"
          loading={submitting}
          onClick={submit}
          style={{ '--background-color': '#e8794a', '--border-color': '#d25f32' }}
        >
          确认报名
        </Button>
      </div>
    </div>
  );
}
