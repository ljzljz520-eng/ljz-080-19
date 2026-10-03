import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DotLoading, Empty } from 'antd-mobile';
import { api } from '../../shared/api';
import { ACTIVITY_TYPE_META } from '../../shared/constants';
import type { ActivityView } from '../../shared/types';
import { formatDateTime, weekday } from '../../shared/format';

export default function ActivityListPage() {
  const [activities, setActivities] = useState<ActivityView[]>();
  const navigate = useNavigate();

  useEffect(() => {
    api.listActivities().then(setActivities).catch(console.error);
  }, []);

  if (!activities) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
        <DotLoading /> 正在加载活动…
      </div>
    );
  }

  const open = activities.filter((a) => a.status !== 'finished');
  const finished = activities.filter((a) => a.status === 'finished');

  const card = (a: ActivityView) => {
    const meta = ACTIVITY_TYPE_META[a.type];
    const d = new Date(a.startTime);
    return (
      <div key={a.id} className="act-card common-card" onClick={() => navigate(`/h5/activities/${a.id}`)}>
        <div className="act-card__top">
          <div className="act-card__date">
            <b>{d.getDate()}</b>
            <span>{d.getMonth() + 1}月·{weekday(a.startTime)}</span>
          </div>
          <div className="act-card__body">
            <div className="act-card__title">
              <span style={{ marginRight: 6 }}>{meta.emoji}</span>
              {a.title}
            </div>
            <div className="act-card__meta">
              <span>🕒 {formatDateTime(a.startTime)}</span>
              <span>📍 {a.location}</span>
            </div>
            <div className="act-card__tags">
              <span className="tag tag--brand">{meta.label}</span>
              {a.transportProvided && <span className="tag tag--warm">🚐 提供接送</span>}
              {a.wheelchairSpots > 0 && <span className="tag tag--warm">♿ 轮椅位 {a.stats.wheelchairRemaining}/{a.wheelchairSpots}</span>}
              {a.hasMeal && <span className="tag">🍚 供餐</span>}
            </div>
          </div>
        </div>
        <div className="act-card__footer">
          <span>
            已报名 <b style={{ color: 'var(--brand-deep)' }}>{a.stats.registeredCount}</b>/{a.capacity} 人
          </span>
          <span style={{ color: 'var(--brand)', fontWeight: 600 }}>
            {a.status === 'finished' ? '活动已结束' : a.stats.remaining > 0 ? '查看并报名 ›' : '已满员 ›'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="care-box care-box--soft" style={{ marginBottom: 14, fontSize: 13.5 }}>
        报名时请如实登记<b>行动能力、轮椅位、饮食禁忌和接送需求</b>，
        志愿者将据此安排照护，保障活动当天安全。
      </div>
      {open.length === 0 && finished.length === 0 && (
        <Empty description="暂无活动，社区发布后会显示在这里" />
      )}
      {open.map(card)}
      {finished.length > 0 && (
        <>
          <h3 className="section-title" style={{ marginTop: 18 }}>已结束的活动</h3>
          {finished.map(card)}
        </>
      )}
    </div>
  );
}
