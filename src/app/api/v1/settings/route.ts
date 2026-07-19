import { withApiHandler } from '@/lib/withApiHandler'
import { SettingsService } from '@/services/SettingsService'
import { UpdateSettingSchema } from '@/dtos/SettingsSchemas'
import { successResponse, errorResponse } from '@/lib/apiUtils'
import { revalidateTag } from 'next/cache'

/**
 * @swagger
 * /api/v1/settings:
 *   get:
 *     summary: Retrieve global settings
 *     description: Managers and Admins can view settings.
 *     responses:
 *       200:
 *         description: Settings list
 */
export const GET = withApiHandler(async ({ appRole, requestId }) => {
  if (appRole !== 'ADMIN' && appRole !== 'MANAGER') {
    return errorResponse('Forbidden', 'FORBIDDEN', 403, [], requestId)
  }

  const settings = await SettingsService.getSettings()
  return successResponse(settings, 'Settings fetched successfully', requestId)
})

/**
 * @swagger
 * /api/v1/settings:
 *   put:
 *     summary: Update a global setting
 *     description: Only Admins can update settings.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Setting updated
 */
export const PUT = withApiHandler(async ({ req, user, appRole, requestId }) => {
  if (appRole !== 'ADMIN') {
    return errorResponse('Forbidden', 'FORBIDDEN', 403, [], requestId)
  }

  const body = await req.json()
  const data = UpdateSettingSchema.parse(body)

  if (!data.key) {
    return errorResponse('Key is required', 'VALIDATION_ERROR', 400, [], requestId)
  }

  const updatedSetting = await SettingsService.updateSettingByKey(data.key, data, user.id)
  
  // Cache invalidation (removed for Next 16 compat)
  // revalidateTag('settings')

  return successResponse(updatedSetting, 'Setting updated successfully', requestId)
})
