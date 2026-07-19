import { fetchClient } from './client';
import { SettingResponseDTO, CreateSettingDTO } from '@/dtos/SettingsSchemas';

export const SettingsApiClient = {
  list: () => fetchClient<SettingResponseDTO[]>('/settings'),
  get: (id: string) => fetchClient<SettingResponseDTO>(`/settings/${id}`),
  create: (data: CreateSettingDTO) => fetchClient<SettingResponseDTO>('/settings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<CreateSettingDTO>) => fetchClient<SettingResponseDTO>(`/settings`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchClient<{ success: boolean }>(`/settings/${id}`, {
    method: 'DELETE',
  }),
};
