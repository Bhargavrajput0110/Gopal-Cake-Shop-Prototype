import { fetchClient } from './client';
import { CustomerResponseDTO, CreateCustomerDTO } from '@/dtos/CustomerSchemas';

export const CustomersApiClient = {
  list: () => fetchClient<CustomerResponseDTO[]>('/customers'),
  get: (id: string) => fetchClient<CustomerResponseDTO>(`/customers/${id}`),
  create: (data: CreateCustomerDTO) => fetchClient<CustomerResponseDTO>('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<CreateCustomerDTO>) => fetchClient<CustomerResponseDTO>(`/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
};
