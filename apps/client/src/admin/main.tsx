import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import 'antd/dist/reset.css';
import './styles.less';
import AdminLayout from './AdminLayout';
import DashboardPage from './pages/DashboardPage';
import ActivitiesPage from './pages/ActivitiesPage';
import ActivityManagePage from './pages/ActivityManagePage';
import EldersPage from './pages/EldersPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#e8794a',
          borderRadius: 8,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
        },
      }}
    >
      <HashRouter>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/activities/:id" element={<ActivityManagePage />} />
            <Route path="/elders" element={<EldersPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ConfigProvider>
  </StrictMode>,
);
