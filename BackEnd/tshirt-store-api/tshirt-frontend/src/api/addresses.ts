import api from './client';
import { Address } from '../types';

export type AddressPayload = Omit<Address, 'id'>;

export const addressesApi = {
  list: () => api.get<Address[]>('/addresses'),
  create: (data: AddressPayload) => api.post<Address>('/addresses', data),
  update: (id: number, data: Partial<AddressPayload>) => api.patch<Address>(`/addresses/${id}`, data),
  remove: (id: number) => api.delete(`/addresses/${id}`),
};
