import { Prisma } from '@prisma/client'

export function withBranchIsolation(branchId: string | null, role: string) {
  return Prisma.defineExtension((client) => {
    return client.$extends({
      name: 'branch-isolation',
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const isolatedRoles = ['SALESPERSON', 'CHEF', 'DELIVERY', 'MANAGER'];
            const normalizedRole = role ? role.toUpperCase() : '';
            
            if (isolatedRoles.includes(normalizedRole) && branchId) {
              const modelName = model ? model.toLowerCase() : '';
              const isolatedModels = ['order', 'user', 'settings'];
              
              if (isolatedModels.includes(modelName)) {
                const readOperations = ['findMany', 'findFirst', 'findUnique', 'count', 'update', 'updateMany', 'delete', 'deleteMany'];
                if (readOperations.includes(operation)) {
                  const currentWhere = (args as any)?.where || {};
                  if (currentWhere.branchId === undefined) {
                    (args as any).where = {
                      ...currentWhere,
                      branchId: branchId,
                    };
                  }
                }
              }
            }
            return query(args);
          },
        },
      },
    });
  });
}
