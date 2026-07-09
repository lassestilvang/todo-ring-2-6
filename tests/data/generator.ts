/**
 * Test data generator for creating mock data for tests
 */
export class TestDataGenerator {
  /**
   * Generate a mock task
   * @param overrides
   * @returns
   */
  static generateTask(overrides: Partial<Task> = {}): Task {
    return {
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: `Test Task ${Date.now()}`,
      description: 'This is a test task description',
      status: 'pending',
      priority: 'medium',
      dependencies: [],
      tags: ['test'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Generate an array of tasks
   * @param count
   * @returns
   */
  static generateTasks(count: number): Task[] {
    return Array.from({ length: count }, (_, i) =>
      this.generateTask({
        id: `task-${i}`,
        title: `Task ${i}`,
        status: i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'in_progress' : 'pending'
      }));
  }

  /**
   * Generate a mock user
   * @param overrides
   * @returns
   */
  static generateUser(overrides: Partial<User> = {}): User {
    return {
      id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      email: `test-${Date.now()}@example.com`,
      name: `Test User`,
      role: 'member',
      created_at: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Generate a mock list
   * @param overrides
   * @returns
   */
  static generateList(overrides: Partial<List> = {}): List {
    return {
      id: `list-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `Test List ${Date.now()}`,
      description: 'Test list description',
      owner_id: `user-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides
    };
  }
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dependencies: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'viewer';
  created_at: string;
}

interface List {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}