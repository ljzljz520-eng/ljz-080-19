import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, DotLoading, Empty, Selector, Toast } from 'antd-mobile';
import { api } from '../../shared/api';
import { ACTIVITY_TYPE_META } from '../../shared/constants';
import type { ActivityView, RosterResult, Volunteer } from '../../shared/types';
import { formatDateTime } from '../../shared/format';

export default function VolunteerHomePage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>();
  const [volunteerId, setVolunteerId] = useState(localStorage.getItem('h5_vid') ?? '');
  const [activities, setActivities] = useState<ActivityView[]>([]);
  const [rosters, setRosters] = useState<Record<string, RosterResult>>({});
  const navigate = useNavigate();

  useEffect(() => {
    api
      .listVolunteers()
      .then((vs) => {
        setVolunteers(vs);
        if (!volunteerId && vs[0]) {
          setVolunteerId(vs[0].id);
          localStorage.setItem('h5_vid', vs[0].id);
        }
      })
      .catch((e) => Toast.show({ icon: 'fail', content: e.message }));
    api.listActivities().then(setActivities);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!volunteerId) return;
    localStorage.setItem('h5_vid', volunteerId);
    Promise.all(
      activities
        .filter((a) => a.status !== 'finished')
        .map((a) =>
          api.volunteerRoster(volunteerId, a.id).then((r) => [a.id, r] as const),
        ),
    )
      .then((entries) => setRosters(Object.fromEntries(entries)))
      .catch(console.error);
  }, [volunteerId, activities]);

  if (!volunteers) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
        <DotLoading /> 加载中…
      </div>
    );
  }

  const mine = activities
    .filter((a) => a.volunteerIds.includes(volunteerId))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div>
      <h2 className="page-title">志愿者工作台</h2>

      <div className="common-card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 10 }}>我是</div>
        <Selector
          options={volunteers.map((v) => ({ label: `${v.name}（${v.phone.slice(-4)}）`, value: v.id }))}
          value={volunteerId ? [volunteerId] : []}
          onChange={(v) => setVolunteerId(v[0] as string)}
        />
      </div>

      <div className="care-box care-box--soft" style={{ marginBottom: 14, fontSize: 13.5 }}>
        活动当天打开对应活动的<b>照护名单</b>，可看到您负责老人的行动能力、轮椅位、
        饮食禁忌、接送地址与紧急联系人，并可直接为老人签到。
      </div>

      {mine.length === 0 && <Empty description="近期没有分配给您的活动" />}

      {mine.map((a) => {
        const r = rosters[a.id];
        const meta = ACTIVITY_TYPE_META[a.type];
        return (
          <div key={a.id} className="common-card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 22 }}>{meta.emoji}</span>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 16.5 }}>{a.title}</b>
                <div style={{ color: 'var(--text-2)', fontSize: 13.5, marginTop: 4 }}>
                  🕒 {formatDateTime(a.startTime)}
                </div>
                <div style={{ color: 'var(--text-2)', fontSize: 13.5 }}>📍 {a.location}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
              <div className="mini-stat">
                <b>{r?.summary.total ?? '…'}</b>
                <span>我负责</span>
              </div>
              <div className="mini-stat mini-stat--ok">
                <b>{r?.summary.checkedIn ?? '…'}</b>
                <span>已签到</span>
              </div>
              <div className="mini-stat mini-stat--warn">
                <b>{r?.summary.wheelchair ?? '…'}</b>
                <span>轮椅位</span>
              </div>
              <div className="mini-stat mini-stat--brand">
                <b>{r?.summary.needTransport ?? '…'}</b>
                <span>需接送</span>
              </div>
            </div>
            <Button
              block
              color="primary"
              size="large"
              onClick={() => navigate(`/h5/volunteer/roster/${a.id}?v=${volunteerId}`)}
            >
              打开照护名单
            </Button>
          </div>
        );
      })}
    </div>
  );
}
