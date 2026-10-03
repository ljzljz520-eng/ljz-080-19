import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import { useLocation, useNavigate } from 'react-router-dom';
import 'antd-mobile/bundle/css-vars-patch.css';
import './styles.less';
import ActivitiesPage from './pages/ActivitiesPage';
import RegisterPage from './pages/RegisterPage';
import MinePage from './pages/MinePage';
import VolunteerPage from './pages/VolunteerPage';

function Tabs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 520, background: '#fff', borderTop: '1px solid #ece7e1', zIndex: 30 }}>
      <TabBar
        safeArea
        activeKey={pathname}
        onChange={(key) => navigate(key)}
      >
        <TabBar.Item key="/activities" title="活动" icon={<span style={{ fontSize: 20 }}>🏠</span>} />
        <TabBar.Item key="/mine" title="我的报名" icon={<span style={{ fontSize: 20 }}>📋</span>} />
        <TabBar.Item key="/volunteer" title="志愿者" icon={<span style={{ fontSize: 20 }}>🤝</span>} />
      </TabBar>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <div className="h5-root">
        <Routes>
          <Route path="/" element={<Navigate to="/activities" replace />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/activities/:id/register" element={<RegisterPage />} />
          <Route path="/mine" element={<MinePage />} />
          <Route path="/volunteer" element={<VolunteerPage />} />
        </Routes>
        <Tabs />
      </div>
    </HashRouter>
  </StrictMode>,
);
