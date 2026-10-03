import { useEffect, useState } from 'react';
import {
  ActionSheet,
  Button,
  Dialog,
  Empty,
  Skeleton,
  Toast,
} from 'antd-mobile';
import { h5Api } from '../api';
import { identity } from '../identity';
import {
  ACTIVITY_TYPE_MAP,
  MOBILITY_MAP,
  type Elder,
  type Registration,
} from '../../api/types';

function fmt(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function MinePage() {
  const [elders, setElders] = useState<Elder[]>([]);
  const [elderId, setElderId] = useState(identity.elderId());
  const [regs, setRegs] = useState<Registration[] | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Registration | null>(null);

  const load = (eid: string) => {
    if (!eid) {
      setRegs([]);
      return;
    }
    setRegs(null);
    h5Api.myRegistrations(eid).then(setRegs).catch((e) => Toast.show(e.message));
  };

  useEffect(() => {
    h5Api
      .elders()
      .then((list) => {
        setElders(list);
        let eid = identity.elderId();
        if (!eid && list[0]) {
          eid = list[0].id;
          identity.setElder(eid);
        }
        setElderId(eid);
        load(eid);
      })
      .catch((e) => Toast.show(e.message));
  }, []);

  const elder = elders.find((e) => e.id === elderId);

  const doCancel = async (reason?: string) => {
    if (!cancelTarget) return;
    try {
      await h5Api.cancel(cancelTarget.id, reason);
      Toast.show({ icon: 'success', content: '已取消报名' });
      load(elderId);
    } catch (e: any) {
      Toast.show({ icon: 'fail', content: e.message });
    } finally {
      setCancelTarget(null);
    }
  };

  return (
    <div>
      <div className="h5-header">
        <div className="hello">我的报名</div>
        <div className="sub">查看报名状态、签到情况和历次参与记录</div>
        <div className="identity" onClick={() => setPickerVisible(true)}>
          <span>当前老人：{elder ? `${elder.name}（${elder.age}岁）` : '请选择'}</span>
          <span>切换 ›</span>
        </div>
      </div>

      <div className="page">
        <div className="section-title">报名记录</div>
        {regs === null && (
          <>
            <Skeleton.Title animated />
            <Skeleton.Paragraph lineCount={3} animated />
          </>
        )}
        {regs !== null && regs.length === 0 && <Empty description="还没有报名过活动" />}

        {regs?.map((r) => (
          <div key={r.id} className="activity-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={`type-badge t-${r.activity?.type}`}>
                {ACTIVITY_TYPE_MAP[r.activity?.type ?? 'other']}
              </span>
              <span className={`reg-status ${r.status}`}>
                {r.status === 'registered' && '⏳ 待签到'}
                {r.status === 'checked_in' && '✅ 已签到'}
                {r.status === 'absent' && '缺席'}
                {r.status === 'cancelled' && '已取消'}
              </span>
            </div>
            <div className="title" style={{ fontSize: 16 }}>{r.activity?.title}</div>
            <div className="meta">🕐 {fmt(r.activity?.startTime)} · {r.activity?.location}</div>
            <div className="care-row" style={{ marginTop: 8, fontSize: 13 }}>
              <div>行动能力：{MOBILITY_MAP[r.mobility]}{r.needWheelchairSeat ? ' · ♿已留轮椅位' : ''}</div>
              <div>饮食禁忌：{r.dietaryRestrictions.length ? r.dietaryRestrictions.join('、') : '无'}</div>
              <div>
                接送：
                {r.transportNeed.required
                  ? `需接送 · ${r.transportNeed.pickupAddress ?? ''} ${r.transportNeed.pickupTime ?? ''}`
                  : '不需要'}
              </div>
            </div>

            {r.record && (
              <div
                style={{
                  marginTop: 10,
                  background: '#f3f8f4',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 13,
                  color: '#4a6b52',
                  lineHeight: 1.7,
                }}
              >
                <b>参与记录：</b>
                {r.record.attended ? '已参加' : '未参加'}
                {r.record.healthNote && <div>现场观察：{r.record.healthNote}</div>}
                {r.record.careFeedback && <div>照护反馈：{r.record.careFeedback}</div>}
                {typeof r.record.satisfaction === 'number' && (
                  <div>满意度：{'⭐'.repeat(r.record.satisfaction)}</div>
                )}
              </div>
            )}

            {r.status === 'registered' && (
              <Button
                block
                fill="none"
                size="small"
                style={{ marginTop: 10, color: '#d9534f' }}
                onClick={() => setCancelTarget(r)}
              >
                取消报名
              </Button>
            )}
          </div>
        ))}
      </div>

      <ActionSheet
        visible={pickerVisible}
        actions={elders.map((e) => ({
          key: e.id,
          text: `${e.name}（${e.gender === 'female' ? '女' : '男'} · ${e.age}岁）`,
        }))}
        onClose={() => setPickerVisible(false)}
        onAction={(action) => {
          const key = String(action.key);
          identity.setElder(key);
          setElderId(key);
          load(key);
        }}
        extra="选择报名的老人（家属可代办）"
      />

      <Dialog
        visible={!!cancelTarget}
        content="确认取消该活动报名？取消后轮椅位与接送车位将释放给其他老人。"
        closeOnAction
        onClose={() => setCancelTarget(null)}
        actions={[
          { key: 'no', text: '再想想' },
          {
            key: 'yes',
            text: '确认取消',
            danger: true,
            onClick: () => doCancel(),
          },
        ]}
      />
    </div>
  );
}
