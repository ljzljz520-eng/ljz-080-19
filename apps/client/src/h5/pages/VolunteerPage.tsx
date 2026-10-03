import { useEffect, useState } from 'react';
import {
  ActionSheet,
  Button,
  Empty,
  Selector,
  Skeleton,
  Tag,
  Toast,
} from 'antd-mobile';
import { h5Api, type RosterElder } from '../api';
import { identity } from '../identity';
import { MOBILITY_MAP, type Activity, type Volunteer } from '../../api/types';

function fmt(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function VolunteerPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [volunteerId, setVolunteerId] = useState(identity.volunteerId());
  const [activityId, setActivityId] = useState('');
  const [roster, setRoster] = useState<{
    totalAssigned: number;
    checkedInCount: number;
    elders: RosterElder[];
  } | null>(null);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [volPicker, setVolPicker] = useState(false);
  const [actPicker, setActPicker] = useState(false);

  useEffect(() => {
    Promise.all([h5Api.volunteers(), h5Api.activities()])
      .then(([vs, acts]) => {
        setVolunteers(vs);
        const relevant = acts.filter((a) => ['published', 'ongoing'].includes(a.status));
        setActivities(relevant);
        let vid = identity.volunteerId();
        if (!vid && vs[0]) {
          vid = vs[0].id;
          identity.setVolunteer(vid);
        }
        setVolunteerId(vid);
        if (relevant[0]) setActivityId(relevant[0].id);
      })
      .catch((e) => Toast.show(e.message));
  }, []);

  useEffect(() => {
    if (!volunteerId || !activityId) return;
    setLoadingRoster(true);
    h5Api
      .roster(activityId, volunteerId)
      .then((d) => setRoster({ totalAssigned: d.totalAssigned, checkedInCount: d.checkedInCount, elders: d.elders }))
      .catch((e) => Toast.show(e.message))
      .finally(() => setLoadingRoster(false));
  }, [volunteerId, activityId]);

  const volunteer = volunteers.find((v) => v.id === volunteerId);
  const activity = activities.find((a) => a.id === activityId);

  return (
    <div>
      <div className="h5-header" style={{ background: 'linear-gradient(135deg,#5b9a68,#86c08f)' }}>
        <div className="hello">🤝 志愿者照护台</div>
        <div className="sub">老人签到后，这里会显示您负责照护的老人名单与照护要点</div>
      </div>

      <div className="page">
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '10px 12px',
            display: 'flex',
            gap: 8,
          }}
        >
          <Button
            size="small"
            fill="outline"
            style={{ flex: 1, '--border-color': '#5b9a68', '--text-color': '#5b9a68' }}
            onClick={() => setVolPicker(true)}
          >
            志愿者：{volunteer?.name ?? '请选择'}
          </Button>
          <Button
            size="small"
            fill="outline"
            style={{ flex: 1.4 }}
            onClick={() => setActPicker(true)}
          >
            活动：{activity ? activity.title.slice(0, 10) : '请选择'}
          </Button>
        </div>

        {activity && (
          <Selector
            style={{ marginTop: 10, '--padding': '8px' }}
            options={activities.map((a) => ({
              label: `${a.title.slice(0, 12)}（${a.status === 'ongoing' ? '进行中' : fmt(a.startTime)}）`,
              value: a.id,
            }))}
            value={[activityId]}
            onChange={(v) => v[0] && setActivityId(v[0] as string)}
          />
        )}

        {roster && (
          <div className="summary-bar" style={{ position: 'static', marginTop: 12, borderRadius: 12 }}>
            <div className="stat">
              <b>{roster.totalAssigned}</b>
              <span>我负责</span>
            </div>
            <div className="stat">
              <b style={{ color: '#5b9a68' }}>{roster.checkedInCount}</b>
              <span>已签到</span>
            </div>
            <div className="stat">
              <b style={{ color: '#c48a28' }}>{roster.totalAssigned - roster.checkedInCount}</b>
              <span>待签到</span>
            </div>
          </div>
        )}

        <div className="section-title">我的照护名单</div>

        {loadingRoster && <Skeleton.Paragraph lineCount={6} animated />}
        {!loadingRoster && roster && roster.elders.length === 0 && (
          <Empty description="您在该活动暂无照护分工，请等待管理员安排" />
        )}

        {roster?.elders.map((e) => (
          <div key={e.assignmentId} className={`care-card ${e.checkedIn ? 'checked' : 'pending'}`}>
            <div className="care-head">
              <span className="name">
                {e.elder.name}
                <span style={{ fontSize: 13, color: '#a09a93', fontWeight: 400 }}>
                  {' '}
                  {e.elder.gender === 'female' ? '女' : '男'} · {e.elder.age}岁
                </span>
              </span>
              <Tag color={e.checkedIn ? '#5b9a68' : '#c48a28'} fill="outline">
                {e.checkedIn ? `已签到 ${fmt(e.checkedInAt)}` : '⏳ 尚未签到'}
              </Tag>
            </div>

            <div style={{ marginTop: 6 }}>
              <span className="duty-pill">职责：{e.dutyLabel}</span>
              {e.care.needWheelchairSeat && <span className="duty-pill" style={{ background: '#fdeaef', color: '#c95a78' }}>♿ 轮椅位</span>}
              {e.care.transportNeed.required && <span className="duty-pill" style={{ background: '#e8f1fa', color: '#4a7fb8' }}>🚐 接送</span>}
            </div>

            <div className="care-row">
              <div>🚶 行动能力：<b>{MOBILITY_MAP[e.care.mobility as keyof typeof MOBILITY_MAP]}</b></div>
              {e.elder.conditions.length > 0 && (
                <div>💊 慢病情况：<b>{e.elder.conditions.join('、')}</b></div>
              )}
              <div>
                🍲 饮食禁忌：
                <b>{e.care.dietaryRestrictions.length ? e.care.dietaryRestrictions.join('、') : '无'}</b>
              </div>
              {e.care.transportNeed.required && (
                <>
                  <div>🚐 接人地址：<b>{e.care.transportNeed.pickupAddress}</b></div>
                  {e.care.transportNeed.pickupTime && (
                    <div>🕐 接人时间：<b>{e.care.transportNeed.pickupTime}</b></div>
                  )}
                  {e.care.transportNeed.remark && (
                    <div style={{ color: '#8a5a1f' }}>📌 {e.care.transportNeed.remark}</div>
                  )}
                </>
              )}
              {e.elder.emergencyContactName && (
                <div>
                  ☎️ 紧急联系人：{e.elder.emergencyContactName}{' '}
                  {e.elder.emergencyContactPhone}
                </div>
              )}
              {e.care.remark && <div style={{ color: '#8a5a1f' }}>📌 报名备注：{e.care.remark}</div>}
              {e.assignmentNote && <div style={{ color: '#8a5a1f' }}>📌 分工备注：{e.assignmentNote}</div>}
            </div>

            <div style={{ display: 'flex', gap: 8 }} className="call-btn">
              {e.elder.phone && (
                <a href={`tel:${e.elder.phone}`} style={{ flex: 1 }}>
                  <Button block size="small" color="primary" style={{ '--background-color': '#5b9a68', '--border-color': '#5b9a68' }}>
                    联系老人
                  </Button>
                </a>
              )}
              {e.elder.emergencyContactPhone && (
                <a href={`tel:${e.elder.emergencyContactPhone}`} style={{ flex: 1 }}>
                  <Button block size="small" fill="outline">
                    联系家属
                  </Button>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <ActionSheet
        visible={volPicker}
        actions={volunteers.map((v) => ({ key: v.id, text: `${v.name}（${v.canDrive ? '可驾驶' : '不可驾驶'}）` }))}
        onClose={() => setVolPicker(false)}
        onAction={(a) => {
          const key = String(a.key);
          identity.setVolunteer(key);
          setVolunteerId(key);
        }}
      />
      <ActionSheet
        visible={actPicker}
        actions={activities.map((a) => ({ key: a.id, text: a.title }))}
        onClose={() => setActPicker(false)}
        onAction={(a) => setActivityId(String(a.key))}
      />
    </div>
  );
}
