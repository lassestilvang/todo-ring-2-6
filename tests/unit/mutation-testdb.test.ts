import { test, expect } from './test-utils';
import { DBClient } from '@src/lib/db/index';
import { Task } from '@src/types';

/**
 * Mutation Test Suite - Database Operations
 *
 * Verifies data integrity through create/update/delete operations
 */
test.describe('Mutation Tests', () => {
  let db: DBClient;
  let testTask: Task;

  test.beforeAll(async () => {
    db = new DBClient('./test.sqlite');
    await db.init();

    // Create test task
    testTask = {
      id: 'test-task-1',
      title: 'Mutation Test Task',
      description: 'Testing database mutation integrity',
      status: 'active',
      priority: 'medium',
      dependencies: [],
      tags: []
    };
  });

  test.beforeEach(async () => {
    await db.createTask(testTask);
  });

  test.afterEach(async () => {
    await db.deleteTask('test-task-1');
  });

  test.afterAll(async () => {
    await db.close();
  });

  test('Mutation: Create Task', async () => {
    // Arrange
    const newTask: Task = {
      id: 'create-test-1',
      title: 'Create Test Task',
      description: 'Testing create operation',
      status: 'planned',
      priority: 'low',
      dependencies: [],
      tags: ['create-test']
    };

    // Act
    await db.createTask(newTask);

    // Assert
    const fetched = await db.getTask('create-test-1');
    expect(fetched).toEqual(newTask);
  });

  test('Mutation: Update Task Status', async () => {
    // Arrange
    await db.createTask({
      id: 'update-test-1',
      title: 'Update Test Task',
      status: 'planned',
      priority: 'medium'
    });

    // Act
    await db.updateTaskStatus('update-test-1', 'completed');

    // Assert
    const updated = await db.getTask('update-test-1');
    expect(updated.status).toBe('completed');
  });

  test('Mutation: Delete Task', async () => {
    // Arrange
    await db.createTask({
      id: 'delete-test-1',
      title: 'Delete Test Task',
      status: 'processing'
    });

    // Act
    await db.deleteTask('delete-test-1');

    // Assert
    await expect(db.getTask('delete-test-1')).rejects.toThrow('Task not found');
  });

  test('Mutation: Update Task Dependencies', async () => {
    // Arrange
    await db.createTask({
      id: 'dep-test-1',
      title: 'Dependency Test Task',
      status: 'active'
    });

    // Act
    await db.updateTaskDependencies('dep-test-1', ['task-dependency-1']);

    // Assert
    const result = await db.getTask('dep-test-1');
    expect(result.dependencies).toEqual(['task-dependency-1']);
  });

  test('Mutation: Multi-Operation Transaction', async () => {
    // Arrange
    const transactionTasks: Task[] = [
      { id: 'trans-test-1', title: 'Transaction Task 1', status: 'active' },
      { id: 'trans-test-2', title: 'Transaction Task 2', status: 'planned' }
    ];

    // Act
    await db.createTask(transactionTasks[0]);
    await db.createTask(transactionTasks[1]);

    // Verify intermediate state
    const task1 = await db.getTask('trans-test-1');
    const task2 = await db.getTask('trans-test-2');
    expect(task1.title).toBe('Transaction Task 1');
    expect(task2.title).toBe('Transaction Task 2');

    // Complete transaction
    await db.deleteTask('trans-test-1');

    // Assert final state
    await expect(db.getTask('trans-test-1')).rejects.toThrow('Task not found');
    const remaining = await db.getTask('trans-test-2');
    expect(remaining.id).toBe('trans-test-2');
  });
});