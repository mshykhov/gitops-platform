import { useState } from "react";
import { Card, Button, Space, Typography, Input, InputNumber, Table, Tag, Row, Col, Tooltip } from "antd";
import { ReloadOutlined, DeleteOutlined, CloudServerOutlined } from "@ant-design/icons";
import { useCacheTest, CacheLogEntry } from "@/hooks/useCacheTest";
import "@/styles/dashboard.css";

const { Text } = Typography;

const podColors: Record<string, string> = {};
const colorPalette = ["blue", "green", "orange", "purple", "cyan", "magenta"];
let colorIndex = 0;

const getPodColor = (podName: string): string => {
  if (!podColors[podName]) {
    podColors[podName] = colorPalette[colorIndex % colorPalette.length];
    colorIndex++;
  }
  return podColors[podName];
};

export const CacheTestTab = () => {
  const { loading, logs, getPodInfo, setValue, getValue, deleteValue, getKeys, clearLogs } = useCacheTest();
  const [key, setKey] = useState("mykey");
  const [value, setValueInput] = useState("hello world");
  const [ttl, setTtl] = useState<number>(60);

  const columns = [
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: 80,
      render: (action: string, record: CacheLogEntry) => (
        <Tag color={record.status === "success" ? "success" : "error"}>{action}</Tag>
      ),
    },
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
      width: 120,
      render: (k: string) => (k ? <Text code>{k}</Text> : "-"),
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      ellipsis: true,
      render: (v: string | null) =>
        v !== null && v !== undefined ? <Text>{v}</Text> : <Text type="secondary">null</Text>,
    },
    {
      title: "TTL",
      dataIndex: "ttl",
      key: "ttl",
      width: 70,
      render: (t: number | null) => (t ? <Text type="secondary">{t}s</Text> : "-"),
    },
    {
      title: "Pod",
      dataIndex: "podName",
      key: "podName",
      width: 200,
      render: (pod: string) => (
        <Tooltip title={pod}>
          <Tag icon={<CloudServerOutlined />} color={getPodColor(pod)}>
            {pod.length > 20 ? `${pod.slice(0, 20)}...` : pod}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: "Time",
      dataIndex: "responseTime",
      key: "responseTime",
      width: 80,
      render: (ms: number) => <Text type="secondary">{ms}ms</Text>,
    },
  ];

  return (
    <Space direction="vertical" size="middle" className="tab-container">
      <Card size="small" title="Cache Operations">
        <Space direction="vertical" className="tab-container">
          <Row gutter={8}>
            <Col flex="120px">
              <Input placeholder="Key" value={key} onChange={(e) => setKey(e.target.value)} addonBefore="Key" />
            </Col>
            <Col flex="auto">
              <Input
                placeholder="Value"
                value={value}
                onChange={(e) => setValueInput(e.target.value)}
                addonBefore="Value"
              />
            </Col>
            <Col flex="140px">
              <InputNumber
                min={1}
                max={86400}
                value={ttl}
                onChange={(v) => setTtl(v || 60)}
                addonBefore="TTL"
                addonAfter="sec"
                style={{ width: "100%" }}
              />
            </Col>
          </Row>
          <Space wrap>
            <Button onClick={() => setValue(key, value, ttl)} loading={loading} type="primary">
              SET
            </Button>
            <Button onClick={() => getValue(key)} loading={loading}>
              GET
            </Button>
            <Button onClick={() => deleteValue(key)} loading={loading} danger>
              DELETE
            </Button>
            <Button onClick={getKeys} loading={loading} icon={<ReloadOutlined />}>
              LIST KEYS
            </Button>
            <Button onClick={getPodInfo} loading={loading} icon={<CloudServerOutlined />}>
              POD INFO
            </Button>
          </Space>
        </Space>
      </Card>

      <Card
        size="small"
        title={`Request Log (${logs.length})`}
        extra={
          <Button size="small" icon={<DeleteOutlined />} onClick={clearLogs} disabled={logs.length === 0}>
            Clear
          </Button>
        }
      >
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ y: 400 }}
          locale={{ emptyText: "Click buttons above to test Redis cache across pods" }}
        />
      </Card>

      <Card size="small">
        <Text type="secondary">
          <strong>How to test shared cache:</strong> Scale to 2+ replicas, then SET a value and GET multiple times.
          Different pod names in the log prove cache is shared via Redis.
        </Text>
      </Card>
    </Space>
  );
};
