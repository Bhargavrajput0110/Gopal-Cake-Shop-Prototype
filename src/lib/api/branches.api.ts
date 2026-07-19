import { fetchClient } from './client';
import { BranchResponseDTO, CreateBranchDTO } from '@/dtos/BranchSchemas';

export const BranchesApiClient = {
  list: () => fetchClient<BranchResponseDTO[]>('/branches'),
  get: (id: string) => fetchClient<BranchResponseDTO>(`/branches/${id}`),
  create: (data: CreateBranchDTO) => fetchClient<BranchResponseDTO>('/branches', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<CreateBranchDTO>) => fetchClient<BranchResponseDTO>(`/branches/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchClient<{ success: boolean }>(`/branches/${id}`, {
    method: 'DELETE',
  }),
};
