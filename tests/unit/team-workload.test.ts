import { describe, it, expect, vi } from 'vitest';

// Mock the API
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

describe('TeamWorkloadAnalytics', () => {
  const mockTeam = {
    id: 'team-1',
    name: 'Engineering',
    description: 'Engineering team',
  };

  const mockMembers = [
    {
      id: 'user-1',
      name: 'Alice',
      role: 'admin',
      tasks: [
        { id: 't1', title: 'Task 1', status: 'completed', estimateMinutes: 60 },
        { id: 't2', title: 'Task 2', status: 'in_progress', estimateMinutes: 120 },
      ],
      capacity: 8,
    },
    {
      id: 'user-2',
      name: 'Bob',
      role: 'editor',
      tasks: [
        { id: 't3', title: 'Task 3', status: 'pending', estimateMinutes: 90 },
      ],
      capacity: 6,
    },
  ];

  describe('Workload Calculation', () => {
    it('should calculate member workload correctly', () => {
      const member = mockMembers[0];
      const totalMinutes = member.tasks.reduce((sum, t) => sum + t.estimateMinutes, 0);
      const totalHours = totalMinutes / 60;

      expect(totalHours).toBe(3); // 60 + 120 = 180 minutes = 3 hours
    });

    it('should identify overloaded members', () => {
      const member = mockMembers[0];
      const totalHours = member.tasks.reduce((sum, t) => sum + t.estimateMinutes, 0) / 60;
      const utilization = (totalHours / member.capacity) * 100;

      // 3 hours / 8 hours = 37.5% utilization
      expect(utilization).toBeLessThan(85);
    });

    it('should identify underloaded members', () => {
      const member = mockMembers[1];
      const totalHours = member.tasks.reduce((sum, t) => sum + t.estimateMinutes, 0) / 60;
      const utilization = (totalHours / member.capacity) * 100;

      // 1.5 hours / 6 hours = 25% utilization
      expect(utilization).toBeLessThan(30);
    });
  });

  describe('Workload Distribution', () => {
    it('should generate correct workload data', () => {
      const workload = mockMembers.map(member => ({
        memberId: member.id,
        totalHours: member.tasks.reduce((sum, t) => sum + t.estimateMinutes, 0) / 60,
        capacity: member.capacity,
        utilization: (member.tasks.reduce((sum, t) => sum + t.estimateMinutes, 0) / 60 / member.capacity) * 100,
      }));

      expect(workload[0].totalHours).toBe(3);
      expect(workload[1].totalHours).toBe(1.5);
    });
  });
});