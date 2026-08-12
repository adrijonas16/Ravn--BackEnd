import api from './client';
import { AuthResponse } from '../types';

export const authApi = {
  signUp: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post<AuthResponse>('/auth/signup', data),

  signIn: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/signin', data),

  signOut: () => api.post('/auth/signout'),
};
