import { Typography } from "antd";

const { Text } = Typography;

export const AppVersion = () => (
  <Text
    type="secondary"
    style={{
      position: "fixed",
      bottom: 8,
      right: 12,
      fontSize: 11,
      opacity: 0.6,
      zIndex: 1000,
    }}
  >
    v{__APP_VERSION__}
  </Text>
);
