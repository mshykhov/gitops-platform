import { Card, Button, Space, Typography, Row, Col, Collapse, Tag } from "antd";
import { ReloadOutlined, ApiOutlined } from "@ant-design/icons";
import { useApiHealth } from "@/hooks/useApiHealth";
import { API_URL } from "@/config/constants";
import "@/styles/dashboard.css";

const { Text } = Typography;

export const PublicApiTab = () => {
  const { loading, results, checkPublicEndpoints } = useApiHealth();

  return (
    <Space direction="vertical" size="middle" className="tab-container">
      <Row justify="space-between" align="middle">
        <Col>
          <Space>
            <ApiOutlined className="dashboard-logo-icon" />
            <Text strong>Public API</Text>
            <Text type="secondary">({API_URL})</Text>
          </Space>
        </Col>
        <Col>
          <Button type="primary" icon={<ReloadOutlined />} onClick={checkPublicEndpoints} loading={loading}>
            Test Endpoints
          </Button>
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
          <Text type="secondary">Endpoints: /api/public/health, /api/public/info, /api/public/time</Text>
        </Card>
      )}
    </Space>
  );
};
