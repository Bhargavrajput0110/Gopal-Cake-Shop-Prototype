import { useState, useEffect, useCallback } from 'react'
import { UserResponseDTO, InviteUserDTO, UpdateUserRoleDTO, UpdateUserStatusDTO } from '@/dtos/UserSchemas'
import { UsersApiClient } from '@/lib/api/users.api'

export function useUsers() {
  const [users, setUsers] = useState<UserResponseDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res: any = await UsersApiClient.list();
      setUsers(res.data || res);
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const inviteUser = async (data: InviteUserDTO) => {
    await UsersApiClient.invite(data)
    await fetchUsers()
  }

  const updateRole = async (id: string, data: UpdateUserRoleDTO) => {
    await UsersApiClient.updateRole(id, data)
    await fetchUsers()
  }

  const updateStatus = async (id: string, data: UpdateUserStatusDTO) => {
    await UsersApiClient.updateStatus(id, data)
    await fetchUsers()
  }

  return {
    users,
    isLoading,
    error,
    fetchUsers,
    inviteUser,
    updateRole,
    updateStatus,
  }
}
