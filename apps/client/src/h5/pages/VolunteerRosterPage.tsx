import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, DotLoading, NavBar, SwipeAction, Tag, Toast } from 'antd-mobile';
import { api } from '../../shared/api';
import {
  MOBILITY_MAP,
  STATUS_META,
  TRANSPORT_MAP,
} from '../../shared/constants';
import type { RosterRow, RosterResult } from '../../shared/types';

export default function VolunteerRosterPage() {
  const { activityId } = useParams();
  const [sp] = useSearchParams();
  const volunteerId = sp.get('v') ?? localStorage.getItem('h5_vid') ?? '';
  const navigate = useNavigate();
  const [roster, setRoster] = useState<RosterResult>();

  const load = useCallback(() => {
    api.volunteerRoster(volunteerId, activityId!).then(setRoster);
  }, [activityId, volunteerId]);

  useEffect(() => {
    load();
  }, [load]);

  const doCheckIn = async (row: RosterRow) => {
    try {
      await api.checkInByRegistration(row.registrationId);
      Toast.show({ icon: 'success', content: `${row.participant.name} 已签到` });
      load();
    } catch (e) {
      Toast.show({ icon: 'fail', content: (e as Error).message });
    }
  };

  if (!roster) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
        <DotLoading /> 加载名单…
      </div>
    );
  }

  const groups = [
    { key: 'checked_in', title: '已签到', rows: roster.rows.filter((r) => r.status === 'checked_in') },
    { key: 'waiting', title: '待签到', rows: roster.rows.filter((r) => r.status !== 'checked_in') },
  ];

  return (
    <div>
      <NavBar onBack={() => navigate(-1)}>我的照护名单</NavBar>

      <div style={{ display: 'flex', gap: 8, margin: '12px 0 14px' }}>
        <div className="mini-stat"><b>{roster.summary.total}</b><span>我负责</span></div>
        <div className="mini-stat mini-stat--ok"><b>{roster.summary.checkedIn}</b><span>已签到</span></div>
        <div className="mini-stat mini-stat--warn"><b>{roster.summary.wheelchair}</b><span>轮椅位</span></div>
        <div className="mini-stat mini-stat--brand"><b>{roster.summary.needTransport}</b><span>需接送</span></div>
      </div>

      {roster.rows.length === 0 && (
        <div className="common-card" style={{ padding: 30, textAlign: 'center', color: 'var(--text-3)' }}>
          本场活动暂未分配老人给您照护
        </div>
      )}

      {groups.map((g) =>
        g.rows.length === 0 ? null : (
          <div key={g.key}>
            <h3 className="section-title">
              {g.title}（{g.rows.length}）
            </h3>
            {g.rows.map((row) => {
              const p = row.participant;
              const mob = MOBILITY_MAP[row.mobility];
              const st = STATUS_META[row.status];
              const checked = row.status === 'checked_in';
              return (
                <SwipeAction
                  key={row.registrationId}
                  rightActions={
                    checked
                      ? []
                      : [
                          {
                            key: 'checkin',
                            text: '签到',
                            color: 'var(--brand)',
                            onClick: () => doCheckIn(row),
                          },
                        ]
                  }
                >
                  <div className={`elder-card common-card ${checked ? 'is-done' : ''}`}>
                    <div className="elder-card__head">
                      <div className="elder-card__avatar">{p.name.slice(0, 1)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="elder-card__name">
                          {p.name}
                          <span className="elder-card__sub">
                            {p.gender === 'female' ? '女' : '男'} · {p.age}岁 · {p.phone}
                          </span>
                        </div>
                        <div style={{ marginTop: 5 }}>
                          <Tag
                            style={{
                              '--text-color': mob.color,
                              '--background-color': `${mob.color}14`,
                              '--border-color': 'transparent',
                            }}
                          >
                            {mob.label}
                          </Tag>
                          {row.wheelchairSeat && <span className="tag tag--danger" style={{ marginLeft: 6 }}>♿ 轮椅位</span>}
                          <Tag
                            style={{
                              marginLeft: 6,
                              '--text-color': st.color,
                              '--background-color': `${st.color}14`,
                              '--border-color': 'transparent',
                            }}
                          >
                            {st.label}
                          </Tag>
                        </div>
                      </div>
                    </div>

                    <dl className="elder-card__info">
                      {row.dietaryRestrictions.length > 0 && (
                        <div>
                          <dt>饮食禁忌</dt>
                          <dd>{row.dietaryRestrictions.join('、') || '无'}</dd>
                        </div>
                      )}
                      {row.transportNeed !== 'none' && (
                        <div>
                          <dt>接送</dt>
                          <dd>
                            {TRANSPORT_MAP[row.transportNeed].label}
                            {row.transportAddress ? `｜${row.transportAddress}` : ''}
                          </dd>
                        </div>
                      )}
                      {(row.careNote || p.healthNote) && (
                        <div>
                          <dt>照护备注</dt>
                          <dd className="warn-text">{row.careNote ?? p.healthNote}</dd>
                        </div>
                      )}
                      <div>
                        <dt>紧急联系人</dt>
                        <dd>
                          {row.emergencyContact.name} {row.emergencyContact.phone}
                        </dd>
                      </div>
                    </dl>

                    {!checked && (
                      <Button
                        block
                        color="primary"
                        size="large"
                        style={{ marginTop: 10 }}
                        onClick={() => doCheckIn(row)}
                      >
                        老人已到场，确认签到
                      </Button>
                    )}
                  </div>
                </SwipeAction>
              );
            })}
          </div>
        ),
      )}
    </div>
  );
}
