import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Empty,
  ErrorBlock,
  Selector,
  Skeleton,
  Tag,
} from 'antd-mobile';
import { h5Api } from '../api';
import {
  ACTIVITY_STATUS_MAP,
  ACTIVITY_TYPE_MAP,
  type Activity,
} from '../../api/types';
import { identity } from '../identity';

const TYPE_EMOJI: Record<string, string> = {
  health_lecture: '🩺',
  haircut: '💈',
  festival_meal: '🥟',
  other: '🎈',
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<Activity[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const load = () => {
    setError('');
    setList(null);
    h5Api
      .activities()
      .then(setList)
      .catch((e) => setError(e.message));
  };
  useEffect(load, []);

  const shown = (list ?? []).filter(
    (a) =>
      filter === 'all'
        ? a.status !== 'cancelled'
        : a.status === filter,
  );

  return (
    <div>
      <div className="h5-header">
        <div className="hello">您好，社区活动欢迎您 🌿</div>
        <div className="sub">报名健康讲座、义剪、节日聚餐，照护需求我们提前安排</div>
        <div className="identity" onClick={() => navigate('/mine')}>
          <span>当前身份：老人/家属</span>
          <span>切换 ›</span>
        </div>
      </div>

      <div className="page">
        <Selector
          style={{ '--padding': '8px' }}
          options={[
            { label: '可报名', value: 'published' },
            { label: '进行中', value: 'ongoing' },
            { label: '已结束', value: 'finished' },
            { label: '全部', value: 'all' },
          ]}
          value={[filter]}
          onChange={(v) => setFilter((v[0] as string) ?? 'all')}
        />

        <div className="section-title">近期活动</div>

        {error && <ErrorBlock status="disconnected" description={error} />}
        {list === null && !error && (
          <>
            <Skeleton.Title animated />
            <Skeleton.Paragraph lineCount={4} animated />
          </>
        )}
        {list !== null && shown.length === 0 && (
          <Empty description="暂无符合条件的活动" />
        )}

        {shown.map((a) => {
          const full = (a.registeredCount ?? 0) >= a.capacity;
          return (
            <div key={a.id} className="activity-card">
              <div>
                <span className={`type-badge t-${a.type}`}>
                  {TYPE_EMOJI[a.type]} {ACTIVITY_TYPE_MAP[a.type]}
                </span>
                <Tag color={a.status === 'published' ? '#e8794a' : '#bbb'} fill="outline">
                  {ACTIVITY_STATUS_MAP[a.status]}
                </Tag>
              </div>
              <div className="title">{a.title}</div>
              <div className="meta">
                <span className="icon">🕐</span>
                <span>{fmtTime(a.startTime)} ~ {fmtTime(a.endTime)}</span>
              </div>
              <div className="meta">
                <span className="icon">📍</span>
                <span>{a.location}</span>
              </div>
              {a.description && (
                <div className="meta" style={{ marginTop: 4 }}>
                  <span className="icon">📝</span>
                  <span>{a.description}</span>
                </div>
              )}
              <div className="slots">
                <span className={full ? 'full' : ''}>
                  名额 <b>{a.registeredCount ?? 0}</b>/{a.capacity}
                </span>
                <span>
                  ♿ 轮椅位 <b>{a.wheelchairUsed ?? 0}</b>/{a.wheelchairCapacity}
                </span>
                <span>
                  🚐 接送 <b>{a.transportUsed ?? 0}</b>/{a.transportCapacity}
                </span>
              </div>
              <Button
                block
                color="primary"
                size="large"
                style={{ marginTop: 12, '--background-color': '#e8794a' as any, '--border-color': '#e8794a' as any }}
                disabled={a.status !== 'published' || full}
                onClick={() => {
                  if (!identity.elderId()) {
                    navigate('/mine');
                    return;
                  }
                  navigate(`/activities/${a.id}/register`);
                }}
              >
                {a.status !== 'published'
                  ? ACTIVITY_STATUS_MAP[a.status]
                  : full
                    ? '名额已满'
                    : '我要报名'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
