// tests/unit/utils/test-helpers.ts
export function createMockTask(overrides: Partial<any> = {}): any {
  return {
    id: 'test-task-id',
    title: 'Test Task',
    description: 'Test description',
    list_id: 'test-list-id',
    date: new Date().toISOString().split('T')[0],
    completedAt: null,
    priority: 'medium',
    status: 'pending',
    estimateHours: 1,
    estimateMinutes: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockUser(overrides: Partial<any> = {}): any {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedpassword',
    ...overrides,
  };
}

export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function mockDate(date: string): void {
  const RealDate = Date;
  // @ts-ignore
  global.Date = class extends RealDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(date);
      } else {
        // @ts-ignore
        super(...args);
      }
    }
  };
}

export function restoreDate(): void {
  // @ts-ignore
  global.Date = Date;
}