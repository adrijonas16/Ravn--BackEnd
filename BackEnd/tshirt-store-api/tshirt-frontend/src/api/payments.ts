import api from './client';

export interface PaymentLinkResponse {
  paymentLinkUrl: string;
  orderId: number;
  demo?: boolean;
}

export const paymentsApi = {
  createOrderPaymentLink: (orderId: number) =>
    api.post<PaymentLinkResponse>(`/orders/${orderId}/payment-link`),
};
