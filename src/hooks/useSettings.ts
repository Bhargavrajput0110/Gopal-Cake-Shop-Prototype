import { useState, useEffect, useCallback } from 'react';
import { SettingResponseDTO, CreateSettingDTO } from '@/dtos/SettingsSchemas';
import { SettingsApiClient } from '@/lib/api/settings.api';

export function useSettings() {
  const [settings, setSettings] = useState<SettingResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await SettingsApiClient.list();
      setSettings(res.data || res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const createSetting = async (data: CreateSettingDTO) => {
    await SettingsApiClient.create(data);
    await fetchSettings();
  };

  const updateSetting = async (id: string, data: Partial<CreateSettingDTO>) => {
    await SettingsApiClient.update(id, data);
    await fetchSettings();
  };

  const deleteSetting = async (id: string) => {
    await SettingsApiClient.delete(id);
    await fetchSettings();
  };

  return {
    settings,
    isLoading,
    error,
    fetchSettings,
    createSetting,
    updateSetting,
    deleteSetting,
  };
}
