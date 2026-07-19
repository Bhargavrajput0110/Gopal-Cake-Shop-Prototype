import { Prisma } from '@prisma/client'

export function withBranchIsolation(branchId: string | null, role: string) {
  return Prisma.defineExtension((client) => {
    return client.$extends({
      name: 'branch-isolation',
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            // Only apply isolation for SALESPERSON, CHEF, DELIVERY, MANAGER
            // ADMIN and VENDORS are typically not isolated to a single branch in the same way,
            // or Admin sees all.
            const isolatedRoles = ['SALESPERSON', 'CHEF', 'DELIVERY', 'MANAGER']
            
            if (isolatedRoles.includes(role) && branchId) {
              // Check if the model has a branchId field.
              // In Prisma, we can't easily introspect model fields at runtime in the extension,
              // but we know Order, User, Settings have it. We'll try to inject it if applicable.
              // A safer way is to specifically target isolated models:
              const isolatedModels = ['Order', 'User', 'Settings']
              
              if (isolatedModels.includes(model)) {
                const readOperations = ['findMany', 'findFirst', 'findUnique', 'count', 'update', 'updateMany', 'delete', 'deleteMany']
                if (readOperations.includes(operation)) {
                  (args as any).where = {
                    ...(args as any).where,
                    branchId: branchId,
                  }
                }
              }
            }
            return query(args)
          },
        },
      },
    })
  })
}
