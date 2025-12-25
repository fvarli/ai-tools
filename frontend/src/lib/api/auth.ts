import { get, post } from './client';
import type { User, LoginCredentials } from '../types/auth';

export interface LoginResponse {
  user: User;
  expiresAt: string;
}

export interface RefreshResponse {
  expiresAt: string;
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  return post<LoginResponse>('/auth/login', credentials);
}

export async function logout(): Promise<void> {
  await post('/auth/logout');
}

export async function getCurrentUser(): Promise<User> {
  return get<User>('/auth/me');
}

export async function refreshToken(): Promise<RefreshResponse> {
  return post<RefreshResponse>('/auth/refresh');
}
