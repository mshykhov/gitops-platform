import { useEffect } from "react";
import { Spin } from "antd";
import { useAuth0 } from "@auth0/auth0-react";

export const LoginPage = () => {
  const { loginWithRedirect, isLoading, isAuthenticated } = useAuth0();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({
        authorizationParams: {
          prompt: "login", // Always show login form, don't use SSO session
        },
      });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  return (
    <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Spin size="large" />
    </div>
  );
};
