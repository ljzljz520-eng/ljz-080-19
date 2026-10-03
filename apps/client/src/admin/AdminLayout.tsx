import { Layout, Menu, Typography } from 'antd';
import {
  CalendarOutlined,
  ProfileOutlined,
  MobileOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import './admin.less';

const { Sider, Header, Content } = Layout;

export default function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const selected = pathname.startsWith('/admin/records')
    ? '/admin/records'
    : '/admin/activities';

  return (
    <Layout className="admin-layout">
      <Sider width={232} breakpoint="lg" collapsedWidth={0} className="admin-sider">
        <div className="admin-logo">
          <span className="admin-logo__icon">❤</span>
          <div>
            <div className="admin-logo__title">幸福里养老平台</div>
            <div className="admin-logo__sub">社区运营管理端</div>
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selected]}
          items={[
            { key: '/admin/activities', icon: <CalendarOutlined />, label: '活动与报名管理' },
            { key: '/admin/records', icon: <ProfileOutlined />, label: '参与记录与推荐' },
          ]}
          onClick={({ key }) => navigate(key)}
          className="admin-menu"
        />
      </Sider>
      <Layout>
        <Header className="admin-header">
          <Typography.Text strong style={{ fontSize: 16 }}>
            {selected === '/admin/records' ? '参与记录与服务推荐' : '活动与报名管理'}
          </Typography.Text>
          <a className="admin-header__link" href="/h5">
            <MobileOutlined /> 切换到老人/志愿者 H5
          </a>
        </Header>
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
