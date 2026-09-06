import { withApiHandler } from '@/lib/withApiHandler'
import { SettingsService } from '@/services/SettingsService'
import { successResponse, errorResponse } from '@/lib/apiUtils'

/**
 * @swagger
 * /api/v1/settings/{id}:
 *   delete:
 *     summary: Delete a global setting
 */
export const DELETE = withApiHandler(async ({ req, appRole, requestId, params }) => {
  if (appRole !== 'ADMIN') {
    return errorResponse('Forbidden', 'FORBIDDEN', 403, [], requestId)
  }

  const { id } = params
  if (!id) {
    return errorResponse('Setting ID is required', 'VALIDATION_ERROR', 400, [], requestId)
  }

  await SettingsService.deleteSetting(id)
  return successResponse({ success: true }, 'Setting deleted successfully', requestId)
})

export const GET = withApiHandler(async ({ req, appRole, requestId, params }) => {
  if (appRole !== 'ADMIN' && appRole !== 'MANAGER') {
    return errorResponse('Forbidden', 'FORBIDDEN', 403, [], requestId)
  }

  const { id } = params
  if (!id) {
    return errorResponse('Setting ID is required', 'VALIDATION_ERROR', 400, [], requestId)
  }

  const setting = await SettingsService.getSettingById(id)
  if (!setting) {
    return errorResponse('Setting not found', 'NOT_FOUND', 404, [], requestId)
  }

  return successResponse(setting, 'Setting fetched successfully', requestId)
})
