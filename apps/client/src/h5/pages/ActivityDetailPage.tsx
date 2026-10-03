import { useEffect, useState } from 'react';
import { Button, DotLoading, Modal, Tag } from 'antd-mobile';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../shared/api';
import { ACTIVITY_TYPE_META } from '../../shared/constants';
import type { ActivityView } from '../../shared/types';
import { formatDateTime, formatTime } from '../../shared/format';

export default function ActivityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<ActivityView>();

  useEffect(() => {
    api.getActivity(id!).then(setActivity).catch(console.error);
  }, [id]);

  if (!activity) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
        <DotLoading /> 加载中…
      </div>
    );
  }

  const meta = ACTIVITY_TYPE_META[activity.type];
  const full = activity.stats.remaining <= 0;

  const goRegister = () => {
    if (full) {
      Modal.alert({ content: '本场活动名额已满，可联系社区工作人员登记候补。' });
      return;
    }
    navigate(`/h5/activities/${id}/register`);
  };

  return (
    <div>
      <div className="common-card" style={{ padding: 18, marginBottom: 14 }}>
        <Tag
          style={{
            '--background-color': `${meta.color}18`,
            '--text-color': meta.color,
            '--border-color': 'transparent',
            fontSize: 13,
          }}
        >
          {meta.emoji} {meta.label}
        </Tag>
        <h2 style={{ fontSize: 22, margin: '10px 0 12px', lineHeight: 1.35 }}>{activity.title}</h2>
        <InfoRow icon="🕒" text={`${formatDateTime(activity.startTime)} - ${formatTime(activity.endTime)}`} />
        <InfoRow icon="📍" text={activity.location} />
        <InfoRow
          icon="👥"
          text={`名额 ${activity.stats.registeredCount}/${activity.capacity} 人，剩余 ${activity.stats.remaining} 个`}
        />
        <InfoRow icon="♿" text={`轮椅位剩余 ${activity.stats.wheelchairRemaining}/${activity.wheelchairSpots} 个`} />
        <InfoRow icon="🚐" text={activity.transportProvided ? '社区提供接送，报名时可登记接送地址' : '本活动不提供接送'} />
        {activity.hasMeal && <InfoRow icon="🍚" text="活动提供餐饮，将按报名登记的饮食禁忌备餐" />}
      </div>

      <div className="common-card" style={{ padding: 18, marginBottom: 14 }}>
        <h3 className="section-title">活动介绍</h3>
        <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 15, lineHeight: 1.8 }}>
          {activity.description || '暂无详细介绍。'}
        </p>
      </div>

      <div className="care-box care-box--warn" style={{ marginBottom: 16 }}>
        <b>温馨提示：</b>报名需要选择老人身份并登记照护信息；行动不便或需轮椅位、
        接送的老人，志愿者会在活动当天重点照护。
      </div>

      {activity.status === 'finished' ? (
        <Button className="big-button" color="default" disabled>
          活动已结束
        </Button>
      ) : (
        <Button className="big-button" color="primary" onClick={goRegister}>
          {full ? '名额已满，联系候补' : '我要报名'}
        </Button>
      )}
    </div>
  );
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '9px 0', fontSize: 15 }}>
      <span style={{ flex: 'none' }}>{icon}</span>
      <span style={{ color: 'var(--text-2)' }}>{text}</span>
    </div>
  );
}
