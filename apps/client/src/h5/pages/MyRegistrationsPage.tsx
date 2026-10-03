import { useEffect, useMemo, useState } from 'react';
import { Button, Dialog, DotLoading, Empty, Tabs, Tag, Toast } from 'antd-mobile';
import { api } from '../../shared/api';
import {
  MOBILITY_MAP,
  STATUS_META,
  TRANSPORT_MAP,
  ACTIVITY_TYPE_META,
} from '../../shared/constants';
import type { ActivityView, Participant, Registration } from '../../shared/types';
import { formatDateTime } from '../../shared/format';

export default function MyRegistrationsPage() {
  const [participantId, setParticipantId] = useState(localStorage.getItem('h5_pid') ?? '');
  const [people, setPeople] = useState<Participant[]>([]);
  const [activities, setActivities] = useState<ActivityView[]>([]);
  const [regs, setRegs] = useState<Registration[]>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listParticipants().then(setPeople);
    api.listActivities().then(setActivities);
  }, []);

  useEffect(() => {
    if (!participantId) return;
    localStorage.setItem('h5_pid', participantId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    api
      .listRegistrations({ participantId })
      .then((r) => setRegs(r))
      .catch((e) => Toast.show({ icon: 'fail', content: e.message }))
      .finally(() => setLoading(false));
  }, [participantId]);

  const active = useMemo(
    () => (regs ?? []).filter((r) => r.status !== 'cancelled'),
    [regs],
  );
  const cancelled = (regs ?? []).filter((r) => r.status === 'cancelled');

  const actMap = new Map(activities.map((a) => [a.id, a]));

  const cancel = (reg: Registration) => {
    Dialog.confirm({
      content: `确定取消报名《${actMap.get(reg.activityId)?.title ?? '该活动'}》吗？`,
      onConfirm: async () => {
        try {
          await api.cancelRegistration(reg.id);
          Toast.show({ icon: 'success', content: '已取消报名' });
          setRegs((rs) =>
            (rs ?? []).map((r) => (r.id === reg.id ? { ...r, status: 'cancelled' } : r)),
          );
        } catch (e) {
          Toast.show({ icon: 'fail', content: (e as Error).message });
        }
      },
    });
  };

  return (
    <div>
      <h2 className="page-title">我的报名</h2>
      <div className="common-card" style={{ padding: '12px 14px', marginBottom: 14 }}>
        <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 8 }}>
          为方便演示，请选择查看哪位老人的报名记录：
        </div>
        <select
          value={participantId}
          onChange={(e) => {
            setRegs(undefined);
            setParticipantId(e.target.value);
          }}
          style={{
            width: '100%',
            padding: '12px 10px',
            borderRadius: 10,
            border: '1px solid var(--border)',
            fontSize: 16,
            background: '#fff',
          }}
        >
          <option value="">请选择老人…</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}（{p.age}岁）
            </option>
          ))}
        </select>
      </div>

      {!participantId && <Empty description="请先选择老人" />}
      {participantId && loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          <DotLoading /> 加载中…
        </div>
      )}
      {participantId && !loading && active.length === 0 && cancelled.length === 0 && (
        <Empty description="还没有报名记录" />
      )}

      <Tabs>
        <Tabs.Tab title={`进行中（${active.length}）`} key="active">
          <div style={{ paddingTop: 12 }}>
            {active.map((r) => {
              const a = actMap.get(r.activityId);
              const st = STATUS_META[r.status];
              return (
                <div key={r.id} className="common-card" style={{ padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ fontSize: 16.5 }}>
                      {a ? `${ACTIVITY_TYPE_META[a.type].emoji} ${a.title}` : '活动信息加载中'}
                    </b>
                    <Tag
                      style={{
                        '--text-color': st.color,
                        '--background-color': `${st.color}15`,
                        '--border-color': 'transparent',
                      }}
                    >
                      {st.label}
                    </Tag>
                  </div>
                  {a && (
                    <div style={{ color: 'var(--text-2)', fontSize: 13.5, marginTop: 6 }}>
                      🕒 {formatDateTime(a.startTime)} · 📍 {a.location}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0' }}>
                    <span className="tag" style={{ color: MOBILITY_MAP[r.mobility].color }}>
                      {MOBILITY_MAP[r.mobility].label}
                    </span>
                    {r.wheelchairSeat && <span className="tag tag--danger">♿ 轮椅位</span>}
                    {r.dietaryRestrictions.map((t) => (
                      <span key={t} className="tag tag--warm">
                        忌：{t}
                      </span>
                    ))}
                    {r.transportNeed !== 'none' && (
                      <span className="tag tag--brand">🚐 {TRANSPORT_MAP[r.transportNeed].label}</span>
                    )}
                  </div>
                  {r.status === 'registered' && (
                    <div className="code-box" style={{ padding: '14px 18px' }}>
                      <div style={{ fontSize: 13, opacity: 0.9 }}>到场签到码</div>
                      <div className="code-box__code" style={{ fontSize: 30, letterSpacing: 8, paddingLeft: 8 }}>
                        {r.checkInCode}
                      </div>
                    </div>
                  )}
                  {r.checkedInAt && (
                    <div style={{ fontSize: 13.5, color: 'var(--brand-deep)' }}>
                      ✅ 已于 {formatDateTime(r.checkedInAt)} 签到
                    </div>
                  )}
                  {r.assignedVolunteerName && (
                    <div style={{ fontSize: 13.5, color: 'var(--text-2)', marginTop: 6 }}>
                      照护志愿者：{r.assignedVolunteerName}
                    </div>
                  )}
                  {r.status !== 'checked_in' && r.status !== 'no_show' && (
                    <Button
                      size="small"
                      color="danger"
                      fill="none"
                      style={{ marginTop: 8 }}
                      onClick={() => cancel(r)}
                    >
                      取消报名
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Tabs.Tab>
        <Tabs.Tab title={`已取消（${cancelled.length}）`} key="cancelled">
          <div style={{ paddingTop: 12 }}>
            {cancelled.map((r) => (
              <div key={r.id} className="common-card" style={{ padding: 14, marginBottom: 10, opacity: 0.65 }}>
                {actMap.get(r.activityId)?.title ?? '活动'} · 已取消
              </div>
            ))}
          </div>
        </Tabs.Tab>
      </Tabs>
    </div>
  );
}
