import { Layout, Menu } from 'antd';
import {
  AppstoreOutlined,
  CalendarOutlined,
  DashboardOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const { Sider, Content, Header } = Layout;

export default function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const selected =
    pathname.startsWith('/activities')
      ? '/activities'
      : pathname.startsWith('/elders')
        ? '/elders'
        : '/dashboard';

  return (
    <Layout className="admin-layout" style={{ minHeight: '100vh' }}>
      <Sider width={220} breakpoint="lg" collapsedWidth={64}>
        <div className="logo">
          <span className="logo-badge">🌿</span>
          <span>幸福里养老协作</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selected]}
          items={[
            { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
            { key: '/activities', icon: <CalendarOutlined />, label: '活动与报名' },
            { key: '/elders', icon: <TeamOutlined />, label: '老人档案与推荐' },
            { key: 'm1', icon: <AppstoreOutlined />, label: '服务资源（占位）', disabled: true },
          ]}
          onClick={({ key }) => key.startsWith('/') && navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <b style={{ fontSize: 16 }}>社区养老协作平台 · 管理端</b>
          <span style={{ color: '#999', fontSize: 13 }}>
            用户端：<a href="../#/">H5 入口 ↗</a>
          </span>
        </Header>
        <Content style={{ padding: 22 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
