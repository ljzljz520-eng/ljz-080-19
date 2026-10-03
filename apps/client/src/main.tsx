import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import 'dayjs/locale/zh-cn'
import './index.css'

import H5Layout from './h5/H5Layout'
import ActivityListPage from './h5/pages/ActivityListPage'
import ActivityDetailPage from './h5/pages/ActivityDetailPage'
import RegisterPage from './h5/pages/RegisterPage'
import MyRegistrationsPage from './h5/pages/MyRegistrationsPage'
import VolunteerHomePage from './h5/pages/VolunteerHomePage'
import VolunteerRosterPage from './h5/pages/VolunteerRosterPage'
import CheckInPage from './h5/pages/CheckInPage'

import AdminLayout from './admin/AdminLayout'
import ActivitiesAdminPage from './admin/pages/ActivitiesAdminPage'
import RosterAdminPage from './admin/pages/RosterAdminPage'
import RecordsAdminPage from './admin/pages/RecordsAdminPage'

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/h5" replace /> },
  {
    path: '/h5',
    element: <H5Layout />,
    children: [
      { index: true, element: <ActivityListPage /> },
      { path: 'activities/:id', element: <ActivityDetailPage /> },
      { path: 'activities/:id/register', element: <RegisterPage /> },
      { path: 'mine', element: <MyRegistrationsPage /> },
      { path: 'checkin', element: <CheckInPage /> },
      { path: 'volunteer', element: <VolunteerHomePage /> },
      { path: 'volunteer/roster/:activityId', element: <VolunteerRosterPage /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/admin/activities" replace /> },
      { path: 'activities', element: <ActivitiesAdminPage /> },
      { path: 'activities/:id/roster', element: <RosterAdminPage /> },
      { path: 'records', element: <RecordsAdminPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/h5" replace /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#2f6b4f',
          borderRadius: 8,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
        },
      }}
    >
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  </StrictMode>,
)
