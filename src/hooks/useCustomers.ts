import { useState, useEffect, useCallback } from 'react';
import { CustomerResponseDTO, CreateCustomerDTO } from '@/dtos/CustomerSchemas';
import { CustomersApiClient } from '@/lib/api/customers.api';

export function useCustomers() {
  const [customers, setCustomers] = useState<CustomerResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await CustomersApiClient.list();
      setCustomers(res.data || res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const createCustomer = async (data: CreateCustomerDTO) => {
    await CustomersApiClient.create(data);
    await fetchCustomers();
  };

  const updateCustomer = async (id: string, data: Partial<CreateCustomerDTO>) => {
    await CustomersApiClient.update(id, data);
    await fetchCustomers();
  };

  return {
    customers,
    isLoading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
  };
}
