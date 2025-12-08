import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ConfigProvider, Spin } from "antd";
import { useAuth0 } from "@auth0/auth0-react";

import { Dashboard, LoginPage } from "@/pages";
import { ErrorBoundary } from "@/components";
import "@/styles/app.css";

export const App = () => {
  const { isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#1890ff",
            },
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ConfigProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};
