import { TabBar } from 'antd-mobile';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import './h5.less';

const tabs = [
  { key: '/h5', title: '活动报名', icon: '🏠' },
  { key: '/h5/mine', title: '我的报名', icon: '📋' },
  { key: '/h5/checkin', title: '活动签到', icon: '✅' },
  { key: '/h5/volunteer', title: '志愿者', icon: '🙋' },
];

export default function H5Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeKey =
    tabs.find((t) => t.key !== '/h5' && pathname.startsWith(t.key))?.key ?? '/h5';

  return (
    <div className="h5-app">
      <header className="h5-header">
        <div className="h5-header__brand">
          <span className="h5-header__logo">❤</span>
          <div>
            <div className="h5-header__title">幸福里养老协作平台</div>
            <div className="h5-header__sub">社区活动 · 报名照护一站式</div>
          </div>
        </div>
        <a className="h5-header__admin" href="/admin">
          管理端
        </a>
      </header>

      <main className="h5-main">
        <Outlet />
      </main>

      <nav className="h5-tabbar">
        <TabBar onChange={(key) => navigate(key)} activeKey={activeKey}>
          {tabs.map((t) => (
            <TabBar.Item key={t.key} title={t.title} icon={<span style={{ fontSize: 22 }}>{t.icon}</span>} />
          ))}
        </TabBar>
      </nav>
    </div>
  );
}
