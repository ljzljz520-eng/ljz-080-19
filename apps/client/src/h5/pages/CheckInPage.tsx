import { useEffect, useState } from 'react';
import { Button, DotLoading, Empty, Selector, Toast } from 'antd-mobile';
import { api } from '../../shared/api';
import { ACTIVITY_TYPE_META, MOBILITY_MAP, TRANSPORT_MAP } from '../../shared/constants';
import type { ActivityView, CheckInView } from '../../shared/types';
import { formatDateTime } from '../../shared/format';

/**
 * 活动当天签到台：
 * 1) 选择活动；2) 老人报 6 位签到码，工作人员点击数字键盘录入；
 * 3) 签到成功立刻展示老人照护要点，并保留最近签到列表。
 */
export default function CheckInPage() {
  const [activities, setActivities] = useState<ActivityView[]>();
  const [activityId, setActivityId] = useState<string>();
  const [code, setCode] = useState('');
  const [recent, setRecent] = useState<CheckInView[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .listActivities()
      .then((list) => {
        setActivities(list);
        const target =
          list.find((a) => a.stats.checkedInCount >= 0 && a.status !== 'finished') ?? list[0];
        if (target) setActivityId(target.id);
      })
      .catch((e) => Toast.show({ icon: 'fail', content: e.message }));
  }, []);

  const press = (n: number) => code.length < 6 && setCode(code + n);

  const submit = async () => {
    if (!activityId || code.length !== 6) {
      Toast.show({ icon: 'fail', content: '请输入 6 位签到码' });
      return;
    }
    setSubmitting(true);
    try {
      const view = await api.checkInByCode(activityId, code);
      setRecent((rs) => [view, ...rs.filter((r) => r.id !== view.id)].slice(0, 8));
      setCode('');
      Toast.show({ icon: 'success', content: `${view.participant.name} 签到成功` });
    } catch (e) {
      Toast.show({ icon: 'fail', content: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!activities) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
        <DotLoading /> 加载中…
      </div>
    );
  }

  return (
    <div>
      <h2 className="page-title">活动签到台</h2>

      <div className="common-card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10 }}>选择活动</div>
        <Selector
          options={activities.map((a) => ({
            label: `${ACTIVITY_TYPE_META[a.type].emoji} ${a.title}（${formatDateTime(a.startTime)}）`,
            value: a.id,
          }))}
          value={activityId ? [activityId] : []}
          onChange={(v) => {
            setActivityId(v[0] as string);
            setRecent([]);
          }}
          columns={1}
        />
      </div>

      <div className="common-card" style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>老人签到码</div>
        <div className="code-display">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className={code[i] ? 'on' : ''}>
              {code[i] ?? ''}
            </span>
          ))}
        </div>
        <div className="keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} type="button" className="keypad__key" onClick={() => press(n)}>
              {n}
            </button>
          ))}
          <button
            type="button"
            className="keypad__key keypad__key--fn"
            onClick={() => setCode('')}
          >
            清空
          </button>
          <button key={0} type="button" className="keypad__key" onClick={() => press(0)}>
            0
          </button>
          <button
            type="button"
            className="keypad__key keypad__key--fn"
            onClick={() => setCode(code.slice(0, -1))}
          >
            删除
          </button>
        </div>
        <Button
          className="big-button"
          color="primary"
          size="large"
          loading={submitting}
          onClick={submit}
          disabled={code.length !== 6}
        >
          确认签到
        </Button>
      </div>

      {recent.length > 0 && (
        <>
          <h3 className="section-title">最近签到（{recent.length}）</h3>
          {recent.map((r) => {
            const mob = MOBILITY_MAP[r.mobility];
            return (
              <div key={r.id} className="common-card sign-card" style={{ marginBottom: 10 }}>
                <div className="sign-card__head">
                  <b>{r.participant.name}</b>
                  <span style={{ color: 'var(--text-3)', fontSize: 13 }}>
                    {r.participant.gender === 'female' ? '女' : '男'} · {r.participant.age}岁
                  </span>
                </div>
                <div className="sign-card__tags">
                  <span className="tag" style={{ color: mob.color }}>{mob.label}</span>
                  {r.wheelchairSeat && <span className="tag tag--danger">♿ 预留轮椅位</span>}
                  {r.dietaryRestrictions.map((t) => (
                    <span key={t} className="tag tag--warm">忌：{t}</span>
                  ))}
                  {r.transportNeed !== 'none' && (
                    <span className="tag tag--brand">🚐 {TRANSPORT_MAP[r.transportNeed].label}</span>
                  )}
                </div>
                {(r.careNote || r.participant.healthNote) && (
                  <div className="care-box care-box--warn" style={{ marginTop: 8 }}>
                    {r.careNote ?? r.participant.healthNote}
                  </div>
                )}
                <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-2)' }}>
                  紧急联系：{r.emergencyContact.name} {r.emergencyContact.phone}
                  {r.assignedVolunteerName ? ` · 照护志愿者：${r.assignedVolunteerName}` : ''}
                </div>
              </div>
            );
          })}
        </>
      )}

      {activities.length === 0 && <Empty description="暂无活动" />}
    </div>
  );
}
