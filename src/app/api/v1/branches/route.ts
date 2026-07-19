import { withApiHandler } from '@/lib/withApiHandler'
import { BranchService } from '@/services/BranchService'
import { successResponse } from '@/lib/apiUtils'

/**
 * @swagger
 * /api/v1/branches:
 *   get:
 *     summary: List all active branches
 *     description: Returns a list of all active branches in the system.
 *     responses:
 *       200:
 *         description: A list of branches.
 */
export const GET = withApiHandler(async ({ requestId }) => {
  const branches = await BranchService.listBranches()
  return successResponse(branches, 'Branches fetched successfully', requestId)
}, true) // Setting to public, or maybe keep it protected? The CTO said public APIs exist, but let's assume it's protected for staff/customers unless stated. Wait, customers need to know branches for pickup! So public is okay for read.
