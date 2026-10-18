export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  provider: "email" | "google" | "phone" | "guest";
  createdAt: number;
}

export interface AuthSession {
  user: User | null;
  token?: string;
  isAuthenticated: boolean;
}

export interface LoginPayload {
  email?: string;
  password?: string;
  phone?: string;
  otp?: string;
  provider: "email" | "google" | "phone";
}

export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
  phone?: string;
}
