import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { SettingsService } from '@/services/SettingsService';
import { CreateSettingSchema } from '@/dtos/SettingsSchemas';

export const GET = withApiHandler(async (ctx) => {
  const settings = await SettingsService.listSettings();
  return NextResponse.json(settings);
});

export const POST = withApiHandler(async (ctx) => {
  const body = await ctx.req.json();
  const data = CreateSettingSchema.parse(body);

  const setting = await SettingsService.createSetting(data);
  return NextResponse.json(setting, { status: 201 });
});
