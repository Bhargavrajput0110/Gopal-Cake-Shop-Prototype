import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { BranchService } from '@/services/BranchService';
import { CreateBranchSchema } from '@/dtos/BranchSchemas';
import { z } from 'zod';

const UpdateBranchSchema = CreateBranchSchema.partial();

export const PATCH = withApiHandler(async (ctx) => {
  const body = await ctx.req.json();
  const data = UpdateBranchSchema.parse(body);
  const id = ctx.params.id;

  const branch = await BranchService.updateBranch(id, data);
  return NextResponse.json(branch);
});

export const DELETE = withApiHandler(async (ctx) => {
  const id = ctx.params.id;
  await BranchService.deleteBranch(id);
  return NextResponse.json({ success: true });
});
