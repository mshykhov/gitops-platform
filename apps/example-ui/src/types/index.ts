export interface User {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  [key: string]: unknown;
}

export interface UserWithRoles extends User {
  groups: string[];
}

export interface ApiHealthResponse {
  status: string;
  timestamp?: string;
}

export interface ApiEndpointResult {
  endpoint: string;
  status: "success" | "error";
  data?: unknown;
  error?: string;
  responseTime: number;
}

export interface Item {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItemFormData {
  name: string;
  description?: string;
}
