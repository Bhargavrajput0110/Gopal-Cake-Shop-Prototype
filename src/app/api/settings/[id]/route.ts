import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { SettingsService } from '@/services/SettingsService';
import { CreateSettingSchema } from '@/dtos/SettingsSchemas';
import { z } from 'zod';

const UpdateSettingSchema = CreateSettingSchema.partial();

export const PATCH = withApiHandler(async (ctx) => {
  const body = await ctx.req.json();
  const data = UpdateSettingSchema.parse(body);
  const id = ctx.params.id;

  const setting = await SettingsService.updateSetting(id, data);
  return NextResponse.json(setting);
});

export const DELETE = withApiHandler(async (ctx) => {
  const id = ctx.params.id;
  await SettingsService.deleteSetting(id);
  return NextResponse.json({ success: true });
});
