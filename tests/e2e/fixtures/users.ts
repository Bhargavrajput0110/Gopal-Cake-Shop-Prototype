// tests/e2e/fixtures/users.ts
export const DEFAULT_PIN = '1234';

export const TEST_USERS = {
  admin: { 
    id: 'admin', 
    roleName: 'Admin',
    name: 'Super Admin',
    branchId: null,
    branchName: null
  },
  salesKhm: { 
    id: 'sales_khd', 
    roleName: 'Sales',
    name: 'Priti Mehta (Sales)',
    branchId: 'khanderao',
    branchName: 'Khanderao Market'
  },
  chefKhm: { 
    id: 'chef_khd', 
    roleName: 'Chef',
    name: 'Chef Mahesh (Khanderao)',
    branchId: 'khanderao',
    branchName: 'Khanderao Market'
  },
  chefUma: { 
    id: 'chef_uma', 
    roleName: 'Chef',
    name: 'Chef Sanjeev (Uma)',
    branchId: 'uma',
    branchName: 'Uma'
  },
  driverKhm: { 
    id: 'driver_khd', 
    roleName: 'Driver',
    name: 'Suresh Patel (Driver)',
    branchId: 'khanderao',
    branchName: 'Khanderao Market'
  },
  managerKhm: {
    id: 'manager_khd',
    roleName: 'Manager',
    name: 'Ramesh Bhai (Manager)',
    branchId: 'khanderao',
    branchName: 'Khanderao Market'
  }
};

export type TestUserKey = keyof typeof TEST_USERS;
