import { withApiHandler } from '@/lib/withApiHandler'
import { BranchService } from '@/services/BranchService'
import { successResponse, errorResponse } from '@/lib/apiUtils'

/**
 * @swagger
 * /api/v1/branches/{id}:
 *   get:
 *     summary: Get a specific branch
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
export const GET = withApiHandler(async ({ params, requestId }) => {
  const branch = await BranchService.getBranchById(params.id)
  
  if (!branch) {
    return errorResponse('Branch not found', 'NOT_FOUND', 404, [], requestId)
  }

  return successResponse(branch, 'Branch fetched successfully', requestId)
}, true)
