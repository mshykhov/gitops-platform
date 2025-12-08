import { useState, useEffect, lazy, Suspense } from "react";
import { useSearchParams } from "react-router";
import { Layout, Menu, Button, Avatar, Typography, Spin } from "antd";
import {
  ApiOutlined,
  LockOutlined,
  LoginOutlined,
  LogoutOutlined,
  UserOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
} from "@ant-design/icons";
import { useAuth0 } from "@auth0/auth0-react";
import { AppVersion } from "@/components";
import "@/styles/dashboard.css";

const PublicApiTab = lazy(() => import("@/components/PublicApiTab").then((m) => ({ default: m.PublicApiTab })));
const PrivateApiTab = lazy(() => import("@/components/PrivateApiTab").then((m) => ({ default: m.PrivateApiTab })));
const ItemsTab = lazy(() => import("@/components/ItemsTab").then((m) => ({ default: m.ItemsTab })));
const CacheTestTab = lazy(() => import("@/components/CacheTestTab").then((m) => ({ default: m.CacheTestTab })));

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const PAGE_TITLES: Record<string, string> = {
  public: "Public API",
  private: "Private API",
  items: "Items Management",
  cache: "Redis Cache Test",
};

const TAB_PARAM = "tab";
const STORAGE_KEY = "dashboard_tab";
const DEFAULT_TAB = "public";
const AUTH_REQUIRED_TABS = ["private", "items", "cache"];

export const Dashboard = () => {
  const { isAuthenticated, isLoading, user, loginWithRedirect, logout } = useAuth0();
  const [searchParams, setSearchParams] = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);

  const getInitialTab = (): string => {
    const urlTab = searchParams.get(TAB_PARAM);
    if (urlTab && PAGE_TITLES[urlTab]) return urlTab;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && PAGE_TITLES[stored]) return stored;
    } catch {
      // localStorage unavailable (private mode)
    }
    return DEFAULT_TAB;
  };

  const [selectedKey, setSelectedKey] = useState(getInitialTab);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && AUTH_REQUIRED_TABS.includes(selectedKey)) {
      setSelectedKey(DEFAULT_TAB);
      setSearchParams({}, { replace: true });
    }
  }, [isAuthenticated, isLoading, selectedKey, setSearchParams]);

  const handleTabChange = (key: string) => {
    setSelectedKey(key);
    setSearchParams({ [TAB_PARAM]: key }, { replace: true });
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch {
      // localStorage unavailable
    }
  };

  const handleLogin = () => loginWithRedirect({ authorizationParams: { prompt: "login" } });
  const handleLogout = () => logout({ logoutParams: { returnTo: window.location.origin } });

  const menuItems = [
    { key: "public", icon: <ApiOutlined />, label: "Public API" },
    ...(isAuthenticated
      ? [
          { key: "private", icon: <LockOutlined />, label: "Private API" },
          { key: "items", icon: <DatabaseOutlined />, label: "Items" },
          { key: "cache", icon: <CloudServerOutlined />, label: "Cache Test" },
        ]
      : []),
  ];

  return (
    <Layout className="dashboard-layout">
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light" className="dashboard-sider">
        <div className="dashboard-logo">
          <ThunderboltOutlined
            className={`dashboard-logo-icon ${collapsed ? "dashboard-logo-icon-collapsed" : "dashboard-logo-icon-expanded"}`}
          />
          {!collapsed && <Text strong>Example API</Text>}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={(e) => handleTabChange(e.key)}
          items={menuItems}
          className="dashboard-menu"
        />

        <div
          className={`dashboard-user-section ${collapsed ? "dashboard-user-section-collapsed" : "dashboard-user-section-expanded"}`}
        >
          {!isLoading &&
            (isAuthenticated ? (
              <div className="dashboard-user-info">
                <Avatar src={user?.picture} icon={<UserOutlined />} />
                {!collapsed && (
                  <div className="dashboard-user-email">
                    <Text ellipsis className="dashboard-user-email-text">
                      {user?.email}
                    </Text>
                  </div>
                )}
                <Button
                  type="text"
                  danger
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  className="dashboard-logout-btn"
                >
                  {!collapsed && "Logout"}
                </Button>
              </div>
            ) : (
              <Button type="primary" icon={<LoginOutlined />} onClick={handleLogin} block={!collapsed}>
                {!collapsed && "Login"}
              </Button>
            ))}
        </div>
      </Sider>

      <Layout>
        <Header className="dashboard-header">
          <Text strong className="dashboard-header-title">
            {PAGE_TITLES[selectedKey]}
          </Text>
        </Header>
        <Content className="dashboard-content">
          <Suspense fallback={<Spin />}>
            {selectedKey === "public" && <PublicApiTab />}
            {selectedKey === "private" && <PrivateApiTab />}
            {selectedKey === "items" && <ItemsTab />}
            {selectedKey === "cache" && <CacheTestTab />}
          </Suspense>
        </Content>
      </Layout>

      <AppVersion />
    </Layout>
  );
};
