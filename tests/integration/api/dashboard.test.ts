import { describe, it, expect, vi } from 'vitest';
import { GET } from '../../../src/app/api/v1/reporting/dashboard/route';
import { DashboardKPIService } from '../../../src/services/reporting/DashboardKPIService';

vi.mock('../../../src/services/reporting/DashboardKPIService', () => ({
  DashboardKPIService: {
    getKPIs: vi.fn(),
  }
}));

// Helper to mock NextRequest context
const createMockContext = (role: string, branchId?: string, searchParams: Record<string, string> = {}) => {
  const url = new URL('http://localhost:3000/api/v1/reporting/dashboard');
  Object.entries(searchParams).forEach(([k, v]) => url.searchParams.append(k, v));
  
  const req = {
    nextUrl: url
  };

  return {
    req,
    appRole: role,
    branchId: branchId,
    authData: { id: 'user123', role }
  };
};

describe('Dashboard API GET /api/v1/reporting/dashboard', () => {
  it('returns KPIs with Cache-Control headers', async () => {
    vi.mocked(DashboardKPIService.getKPIs).mockResolvedValueOnce({
      todaysSales: 500,
      ordersToday: 5,
    } as any);

    const ctx = createMockContext('ADMIN');
    const response = await GET(ctx as any);
    
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('s-maxage=60, stale-while-revalidate=30');
    
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.todaysSales).toBe(500);
  });

  it('restricts non-admins to their own branchId', async () => {
    vi.mocked(DashboardKPIService.getKPIs).mockResolvedValueOnce({} as any);

    // Manager assigned to Branch-X, trying to query Branch-Y
    const ctx = createMockContext('MANAGER', 'Branch-X', { branchId: 'Branch-Y' });
    
    await GET(ctx as any);

    // Service should be called with Branch-X regardless of searchParams
    expect(DashboardKPIService.getKPIs).toHaveBeenCalledWith(expect.objectContaining({
      branchId: 'Branch-X'
    }));
  });

  it('allows admins to query specific branches', async () => {
    vi.mocked(DashboardKPIService.getKPIs).mockResolvedValueOnce({} as any);

    const ctx = createMockContext('ADMIN', undefined, { branchId: 'Branch-Y' });
    
    await GET(ctx as any);

    expect(DashboardKPIService.getKPIs).toHaveBeenCalledWith(expect.objectContaining({
      branchId: 'Branch-Y'
    }));
  });
});
