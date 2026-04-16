/**
 * @fileoverview 主布局组件
 * @description 应用的主框架布局，包含固定侧边栏导航、顶部标题栏和内容区域。
 *              使用 Ant Design Layout 组件构建，侧边栏包含系统 Logo 和菜单导航，
 *              内容区域通过 Outlet 渲染子路由页面。
 *              支持响应式设计：PC端侧边栏常驻，移动端通过汉堡菜单控制侧边栏显隐。
 * @module layouts/MainLayout
 * @version 1.1.0
 */
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Button } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  TeamOutlined,
  UserOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import useIsMobile from '../hooks/useIsMobile';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

/** 主布局组件：提供全局导航框架和页面容器 */
const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isMobile } = useIsMobile();

  /** 当从移动端切换回PC端时关闭移动菜单 */
  useEffect(() => {
    if (!isMobile && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [isMobile, mobileMenuOpen]);

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

  /** 处理菜单点击事件：导航并关闭移动端菜单 */
  const handleMenuClick = (key: string) => {
    navigate(key);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  /** 切换移动端菜单显示状态 */
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 侧边栏 */}
      <Sider
        width={220}
        style={{
          background: '#001529',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: isMobile && mobileMenuOpen ? 1001 : 100,
          overflow: 'auto',
          height: '100vh',
          transition: isMobile ? 'transform 0.3s ease' : 'none',
          transform: (isMobile && !mobileMenuOpen) ? 'translateX(-100%)' : 'translateX(0)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            padding: '0 16px',
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
          onClick={({ key }) => handleMenuClick(key)}
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

      {/* 移动端遮罩层 */}
      {isMobile && mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 1000,
          }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 主内容区 */}
      <Layout
        style={{
          marginLeft: isMobile ? 0 : 220,
          transition: 'margin-left 0.2s ease',
        }}
        className="main-content"
      >
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* 汉堡菜单按钮：仅在移动端显示 */}
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={toggleMobileMenu}
              className="mobile-menu-btn"
              style={{
                display: isMobile ? 'block' : 'none',
                fontSize: 18,
                padding: '4px 8px',
              }}
            />
            <Title level={5} style={{ margin: 0, color: '#333' }}>
              {menuItems.find((item) =>
                location.pathname.startsWith(item.key.replace(/\/\w+$/, '')) ||
                location.pathname === item.key,
              )?.label || '候选人管理系统'}
            </Title>
          </div>
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
