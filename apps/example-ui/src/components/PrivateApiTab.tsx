import { Card, Button, Space, Typography, Row, Col, Collapse, Tag, Avatar, message } from "antd";
import { ReloadOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth0 } from "@auth0/auth0-react";
import { useApiHealth } from "@/hooks/useApiHealth";
import { AUTH0_CONFIG, GROUPS_CLAIM } from "@/config/constants";
import "@/styles/dashboard.css";

const { Text } = Typography;

export const PrivateApiTab = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const { loading, results, checkPrivateEndpoints } = useApiHealth();
  const groups = (user?.[GROUPS_CLAIM] as string[]) || [];

  const handleCopyToken = async () => {
    const token = await getAccessTokenSilently({
      authorizationParams: { audience: AUTH0_CONFIG.audience || undefined },
    });
    navigator.clipboard?.writeText(token);
    message.success("Token copied!");
  };

  return (
    <Space direction="vertical" size="middle" className="tab-container">
      <Row gutter={16}>
        <Col flex="auto">
          <Space>
            <Avatar src={user?.picture} icon={<UserOutlined />} />
            <Text strong>{user?.name}</Text>
            <Text type="secondary">({user?.email})</Text>
            {groups.map((g) => (
              <Tag key={g} color="blue">
                {g}
              </Tag>
            ))}
          </Space>
        </Col>
        <Col>
          <Space>
            <Button size="small" onClick={handleCopyToken}>
              Copy Token
            </Button>
            <Button type="primary" icon={<ReloadOutlined />} onClick={checkPrivateEndpoints} loading={loading}>
              Test Endpoints
            </Button>
          </Space>
        </Col>
      </Row>

      {results.length > 0 ? (
        <Collapse
          items={results.map((r, i) => ({
            key: String(i),
            label: (
              <Space>
                <Tag color={r.status === "success" ? "success" : "error"}>{r.status === "success" ? "OK" : "ERR"}</Tag>
                <Text code>{r.endpoint}</Text>
                <Text type="secondary">{r.responseTime}ms</Text>
              </Space>
            ),
            children: (
              <pre className="code-block">{r.status === "success" ? JSON.stringify(r.data, null, 2) : r.error}</pre>
            ),
          }))}
        />
      ) : (
        <Card>
          <Text type="secondary">Endpoints: /api/me, /api/protected, /api/admin/stats (requires admin role)</Text>
        </Card>
      )}
    </Space>
  );
};
