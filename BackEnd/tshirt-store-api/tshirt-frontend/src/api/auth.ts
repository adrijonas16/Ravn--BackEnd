import api from './client';
import { AuthResponse, CurrentUserResponse } from '../types';

export const authApi = {
  signUp: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post<AuthResponse>('/auth/signup', data),

  signIn: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/signin', data),

  me: () => api.get<CurrentUserResponse>('/auth/me'),

  signOut: () => api.post('/auth/signout'),
};
