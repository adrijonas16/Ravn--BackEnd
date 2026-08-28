import api from './client';
import { AuthResponse, CurrentUserResponse } from '../types';

export const authApi = {
  signUp: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) =>
    api.post<AuthResponse>('/auth/signup', data),

  signIn: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/signin', data),

  me: () => api.get<CurrentUserResponse>('/auth/me'),

  updateMe: (data: { email?: string; firstName?: string; lastName?: string; phone?: string }) =>
    api.patch<CurrentUserResponse>('/auth/me', data),

  forgotPassword: (email: string) =>
    api.post<{ message: string; resetToken?: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, newPassword }),

  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }),

  signOut: (refreshToken?: string) => api.post('/auth/signout', { refreshToken }),
};
