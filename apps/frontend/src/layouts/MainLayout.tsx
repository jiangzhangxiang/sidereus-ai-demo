/**
 * @fileoverview 主布局组件
 * @description 应用的主框架布局，包含固定侧边栏导航、顶部标题栏和内容区域。
 *              使用 Ant Design Layout 组件构建，侧边栏包含系统 Logo 和菜单导航，
 *              内容区域通过 Outlet 渲染子路由页面。
 * @module layouts/MainLayout
 * @version 1.0.0
 */
import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

/** 主布局组件：提供全局导航框架和页面容器 */
const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/candidates',
      icon: <TeamOutlined />,
      label: '候选人列表',
    },
  ];

  /** 根据当前路径计算选中的菜单项 key */
  const getSelectedKey = () => {
    if (location.pathname.startsWith('/candidates')) {
      return '/candidates';
    }
    return location.pathname;
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Sider
        width={220}
        style={{
          background: '#001529',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <UserOutlined
            style={{ fontSize: 24, color: '#1677ff', marginRight: 8 }}
          />
          <Title
            level={4}
            style={{
              color: '#fff',
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
            }}
          >
            候选人管理系统
          </Title>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ marginTop: 8, borderRight: 0 }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 0,
            right: 0,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.3)',
            fontSize: 12,
          }}
        >
          HR Demo v1.0
        </div>
      </Sider>

      <Layout style={{ marginLeft: 220 }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <Title level={5} style={{ margin: 0, color: '#333' }}>
            {menuItems.find((item) =>
              location.pathname.startsWith(item.key.replace(/\/\w+$/, '')) ||
              location.pathname === item.key,
            )?.label || '候选人管理系统'}
          </Title>
        </Header>

        <Content
          style={{
            margin: '20px',
            padding: '20px',
            background: 'transparent',
            minHeight: 'calc(100vh - 104px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
