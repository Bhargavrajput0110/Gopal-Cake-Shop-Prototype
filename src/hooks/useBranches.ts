import { useState, useEffect, useCallback } from 'react';
import { BranchResponseDTO, CreateBranchDTO } from '@/dtos/BranchSchemas';
import { BranchesApiClient } from '@/lib/api/branches.api';

export function useBranches() {
  const [branches, setBranches] = useState<BranchResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await BranchesApiClient.list();
      setBranches(res.data || res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const createBranch = async (data: CreateBranchDTO) => {
    await BranchesApiClient.create(data);
    await fetchBranches();
  };

  const updateBranch = async (id: string, data: Partial<CreateBranchDTO>) => {
    await BranchesApiClient.update(id, data);
    await fetchBranches();
  };

  const deleteBranch = async (id: string) => {
    await BranchesApiClient.delete(id);
    await fetchBranches();
  };

  return {
    branches,
    isLoading,
    error,
    fetchBranches,
    createBranch,
    updateBranch,
    deleteBranch,
  };
}

