import { fetchClient } from './client'
import { InviteUserDTO, UpdateUserRoleDTO, UpdateUserStatusDTO, UserResponseDTO } from '@/dtos/UserSchemas'

export const UsersApiClient = {
  list: () => fetchClient<UserResponseDTO[]>('/users'),
  invite: (data: InviteUserDTO) => fetchClient<UserResponseDTO>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateRole: (id: string, data: UpdateUserRoleDTO) => fetchClient<UserResponseDTO>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  updateStatus: (id: string, data: UpdateUserStatusDTO) => fetchClient<UserResponseDTO>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
}
