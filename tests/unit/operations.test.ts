import { describe, it, expect, beforeEach } from 'vitest';
import {
  Priority,
  RecurringType,
  TaskStatus,
  ListSchema,
  TaskSchema,
  SubtaskSchema,
  LabelSchema,
} from '../../src/types/index';

// In-memory store for testing
interface Store {
  lists: any[];
  tasks: any[];
  subtasks: any[];
  labels: any[];
  task_labels: any[];
  task_history: any[];
  reminders: any[];
  task_comments: any[];
  task_dependencies: any[];
  task_shares: any[];
  list_shares: any[];
}

const store: Store = {
  lists: [],
  tasks: [],
  subtasks: [],
  labels: [],
  task_labels: [],
  task_history: [],
  reminders: [],
  task_comments: [],
  task_dependencies: [],
  task_shares: [],
  list_shares: [],
};

const resetStore = () => {
  Object.keys(store).forEach(key => {
    (store as any)[key] = [];
  });
};

const generateId = () => `id-${Math.random().toString(36).substr(2, 9)}`;

// List operations
function createList(data: { name: string; color: string; emoji: string }) {
  const id = generateId();
  const list = {
    id,
    name: data.name,
    color: data.color,
    emoji: data.emoji,
    is_inbox: 0,
    sort_order: store.lists.length,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  store.lists.push(list);
  return list;
}

function getAllLists() {
  return store.lists;
}

function getListById(id: string) {
  return store.lists.find(l => l.id === id);
}

function updateList(id: string, data: Partial<any>) {
  const list = getListById(id);
  if (!list) throw new Error('List not found');
  Object.assign(list, data, { updated_at: new Date().toISOString() });
  return list;
}

function deleteList(id: string) {
  const index = store.lists.findIndex(l => l.id === id && l.is_inbox === 0);
  if (index > -1) store.lists.splice(index, 1);
}

function getInboxList() {
  let list = store.lists.find(l => l.is_inbox === 1);
  if (!list) {
    list = createList({ name: 'Inbox', color: '#3b82f6', emoji: '📥' });
    list.is_inbox = 1;
  }
  return list;
}

// Task operations
function createTask(data: { title: string; description?: string; listId?: string; priority?: string; status?: string }) {
  const id = generateId();
  const inbox = getInboxList();
  const task = {
    id,
    title: data.title,
    description: data.description || '',
    list_id: data.listId || inbox.id,
    priority: data.priority || 'none',
    status: data.status || 'pending',
    sort_order: store.tasks.length,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  store.tasks.push(task);
  return task;
}

function getTaskById(id: string) {
  return store.tasks.find(t => t.id === id);
}

function updateTask(id: string, data: Partial<any>) {
  const task = getTaskById(id);
  if (!task) throw new Error('Task not found');
  Object.assign(task, data, { updated_at: new Date().toISOString() });
  return task;
}

function deleteTask(id: string) {
  const index = store.tasks.findIndex(t => t.id === id);
  if (index > -1) store.tasks.splice(index, 1);
}

function getTasks(listId?: string, date?: string) {
  let tasks = store.tasks;
  if (listId) tasks = tasks.filter(t => t.list_id === listId);
  if (date) tasks = tasks.filter(t => t.date === date);
  return tasks.sort((a, b) => a.sort_order - b.sort_order);
}

function getAllTasks() {
  return store.tasks;
}

function getInboxTasks() {
  const inbox = getInboxList();
  return getTasks(inbox.id);
}

function getTasksForToday() {
  const today = new Date().toISOString().split('T')[0];
  return store.tasks.filter(t => t.date === today && t.status !== 'completed');
}

function toggleTaskStatus(id: string) {
  const task = getTaskById(id);
  if (!task) throw new Error('Task not found');
  const newStatus = task.status === 'completed' ? 'pending' : 'completed';
  task.status = newStatus;
  task.updated_at = new Date().toISOString();
  return task;
}

function updateTaskSortOrder(id: string, newPosition: number) {
  const task = getTaskById(id);
  if (!task) throw new Error('Task not found');
  task.sort_order = newPosition;
  return task;
}

// Subtask operations
function createSubtask(data: { taskId: string; title: string }) {
  const id = generateId();
  const subtask = {
    id,
    task_id: data.taskId,
    title: data.title,
    is_completed: 0,
    sort_order: store.subtasks.length,
    created_at: new Date().toISOString(),
  };
  store.subtasks.push(subtask);
  return subtask;
}

function getSubtasks(taskId: string) {
  return store.subtasks.filter(s => s.task_id === taskId);
}

function toggleSubtask(id: string) {
  const subtask = store.subtasks.find(s => s.id === id);
  if (subtask) {
    subtask.is_completed = subtask.is_completed ? 0 : 1;
  }
  return subtask;
}

function deleteSubtask(id: string) {
  const index = store.subtasks.findIndex(s => s.id === id);
  if (index > -1) store.subtasks.splice(index, 1);
}

// Label operations
function createLabel(data: { name: string; color: string; icon?: string }) {
  const id = generateId();
  const label = {
    id,
    name: data.name,
    color: data.color,
    icon: data.icon || '🏷',
    created_at: new Date().toISOString(),
  };
  store.labels.push(label);
  return label;
}

function getAllLabels() {
  return store.labels;
}

function getLabelById(id: string) {
  return store.labels.find(l => l.id === id);
}

function updateLabel(id: string, data: Partial<any>) {
  const label = getLabelById(id);
  if (!label) throw new Error('Label not found');
  Object.assign(label, data);
  return label;
}

function deleteLabel(id: string) {
  const index = store.labels.findIndex(l => l.id === id);
  if (index > -1) store.labels.splice(index, 1);
}

function addLabelToTask(taskId: string, labelId: string) {
  store.task_labels.push({ task_id: taskId, label_id: labelId });
}

function removeLabelFromTask(taskId: string, labelId: string) {
  const index = store.task_labels.findIndex(
    tl => tl.task_id === taskId && tl.label_id === labelId
  );
  if (index > -1) store.task_labels.splice(index, 1);
}

function getTaskLabels(taskId: string) {
  const labelIds = store.task_labels
    .filter(tl => tl.task_id === taskId)
    .map(tl => tl.label_id);
  return store.labels.filter(l => labelIds.includes(l.id));
}

// Comment operations
function addTaskComment(taskId: string, userId: string, userName: string, content: string) {
  const id = generateId();
  const comment = {
    id,
    task_id: taskId,
    user_id: userId,
    user_name: userName,
    content,
    created_at: new Date().toISOString(),
  };
  store.task_comments.push(comment);
  return comment;
}

function getTaskComments(taskId: string) {
  return store.task_comments.filter(c => c.task_id === taskId);
}

function deleteTaskComment(id: string) {
  const index = store.task_comments.findIndex(c => c.id === id);
  if (index > -1) store.task_comments.splice(index, 1);
}

// History operations
function addTaskHistory(taskId: string, action: string, fieldChanged?: string | null, oldValue?: string | null, newValue?: string | null) {
  const id = generateId();
  store.task_history.push({
    id,
    task_id: taskId,
    action,
    field_changed: fieldChanged,
    old_value: oldValue,
    new_value: newValue,
    performed_at: new Date().toISOString(),
  });
}

// Reminder operations
function createReminder(data: { taskId: string; remindAt: string }) {
  const id = generateId();
  const reminder = {
    id,
    task_id: data.taskId,
    remind_at: data.remindAt,
    method: 'notification',
    is_fired: 0,
    created_at: new Date().toISOString(),
  };
  store.reminders.push(reminder);
  return reminder;
}

function getReminders(taskId?: string) {
  if (taskId) {
    return store.reminders.filter(r => r.task_id === taskId && r.is_fired === 0);
  }
  return store.reminders.filter(r => r.is_fired === 0);
}

function updateReminder(id: string, data: Partial<any>) {
  const reminder = store.reminders.find(r => r.id === id);
  if (!reminder) throw new Error('Reminder not found');
  Object.assign(reminder, data);
  return reminder;
}

function deleteReminder(id: string) {
  const index = store.reminders.findIndex(r => r.id === id);
  if (index > -1) store.reminders.splice(index, 1);
}

function markReminderFired(id: string) {
  const reminder = store.reminders.find(r => r.id === id);
  if (reminder) reminder.is_fired = 1;
}

// Dependency operations
function addTaskDependency(taskId: string, dependsOnId: string) {
  if (taskId === dependsOnId) {
    throw new Error('Task cannot depend on itself');
  }

  const existing = store.task_dependencies.find(
    d => d.task_id === dependsOnId && d.depends_on_id === taskId
  );
  if (existing) {
    throw new Error('This would create a circular dependency');
  }

  const id = generateId();
  const dep = {
    id,
    task_id: taskId,
    depends_on_id: dependsOnId,
    created_at: new Date().toISOString(),
  };
  store.task_dependencies.push(dep);
  return dep;
}

function getTaskDependencies(taskId: string) {
  const depIds = store.task_dependencies
    .filter(d => d.task_id === taskId)
    .map(d => d.depends_on_id);
  return store.tasks.filter(t => depIds.includes(t.id));
}

function getBlockedTasks() {
  return store.tasks.filter(t => {
    const deps = store.task_dependencies.filter(d => d.task_id === t.id);
    return deps.some(d => {
      const depTask = store.tasks.find(t => t.id === d.depends_on_id);
      return depTask && depTask.status !== 'completed';
    });
  });
}

function removeTaskDependency(taskId: string, dependsOnId: string) {
  const index = store.task_dependencies.findIndex(
    d => d.task_id === taskId && d.depends_on_id === dependsOnId
  );
  if (index > -1) store.task_dependencies.splice(index, 1);
}

// Stats operations
function getTaskStats() {
  return {
    total: store.tasks.length,
    completed: store.tasks.filter(t => t.status === 'completed').length,
    pending: store.tasks.filter(t => t.status === 'pending').length,
    inProgress: store.tasks.filter(t => t.status === 'in_progress').length,
  };
}

function getOverdueCount() {
  const today = new Date().toISOString().split('T')[0];
  return store.tasks.filter(t => t.deadline && t.deadline < today && t.status !== 'completed').length;
}

function getCompletedTodayCount() {
  const today = new Date().toISOString().split('T')[0];
  return store.tasks.filter(t => t.status === 'completed' && t.created_at?.startsWith(today)).length;
}

// Search
function searchTasks(query: string) {
  const pattern = query.toLowerCase();
  return store.tasks.filter(t =>
    t.title.toLowerCase().includes(pattern) || t.description.toLowerCase().includes(pattern)
  );
}

describe('Database Operations', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('List Operations', () => {
    describe('createList', () => {
      it('should create a list with required fields', () => {
        const list = createList({ name: 'Test List', color: '#3b82f6', emoji: '📋' });
        expect(list.name).toBe('Test List');
        expect(list.color).toBe('#3b82f6');
        expect(list.emoji).toBe('📋');
        expect(list.id).toBeDefined();
      });

      it('should create multiple lists with incrementing sort order', () => {
        const list1 = createList({ name: 'List 1', color: '#aaa', emoji: '📋' });
        const list2 = createList({ name: 'List 2', color: '#bbb', emoji: '📝' });
        expect(list1.sort_order).toBe(0);
        expect(list2.sort_order).toBe(1);
      });
    });

    describe('getAllLists', () => {
      it('should return empty array when no lists', () => {
        expect(getAllLists()).toEqual([]);
      });

      it('should return all lists', () => {
        createList({ name: 'List A', color: '#aaa', emoji: '📋' });
        createList({ name: 'List B', color: '#bbb', emoji: '📝' });
        expect(getAllLists()).toHaveLength(2);
      });
    });

    describe('getListById', () => {
      it('should return list by id', () => {
        const list = createList({ name: 'Test', color: '#ccc', emoji: '📋' });
        const found = getListById(list.id);
        expect(found).toBeDefined();
        expect(found?.id).toBe(list.id);
      });

      it('should return undefined for non-existent list', () => {
        expect(getListById('non-existent-id')).toBeUndefined();
      });
    });

    describe('getInboxList', () => {
      it('should return existing inbox or create one', () => {
        const inbox1 = getInboxList();
        const inbox2 = getInboxList();
        expect(inbox1.name).toBe('Inbox');
        expect(inbox1.is_inbox).toBe(1);
        expect(inbox1.id).toBe(inbox2.id);
      });
    });

    describe('updateList', () => {
      it('should update list fields', () => {
        const list = createList({ name: 'Original', color: '#aaa', emoji: '📋' });
        const updated = updateList(list.id, { name: 'Updated', color: '#fff' });
        expect(updated.name).toBe('Updated');
        expect(updated.color).toBe('#fff');
      });

      it('should throw error for non-existent list', () => {
        expect(() => updateList('non-existent', { name: 'New' })).toThrow('List not found');
      });
    });

    describe('deleteList', () => {
      it('should delete non-inbox list', () => {
        const list = createList({ name: 'To Delete', color: '#ff0000', emoji: '🗑️' });
        deleteList(list.id);
        expect(getAllLists().find(l => l.id === list.id)).toBeUndefined();
      });

      it('should not delete inbox list', () => {
        const inbox = getInboxList();
        deleteList(inbox.id);
        expect(getAllLists().find(l => l.id === inbox.id)).toBeDefined();
      });
    });
  });

  describe('Task Operations', () => {
    describe('createTask', () => {
      it('should create a task with required fields', () => {
        const task = createTask({ title: 'Test Task' });
        expect(task.title).toBe('Test Task');
        expect(task.status).toBe('pending');
        expect(task.priority).toBe('none');
      });

      it('should create task with all fields', () => {
        const task = createTask({ title: 'Full Task', description: 'Description', priority: 'high' });
        expect(task.title).toBe('Full Task');
        expect(task.description).toBe('Description');
        expect(task.priority).toBe('high');
      });

      it('should assign task to inbox by default', () => {
        const task = createTask({ title: 'Test' });
        expect(task.list_id).toBeDefined();
      });
    });

    describe('getTaskById', () => {
      it('should return task by id', () => {
        const task = createTask({ title: 'Test' });
        const found = getTaskById(task.id);
        expect(found).toBeDefined();
        expect(found?.id).toBe(task.id);
      });

      it('should return undefined for non-existent task', () => {
        expect(getTaskById('non-existent-id')).toBeUndefined();
      });
    });

    describe('updateTask', () => {
      it('should throw error for non-existent task', () => {
        expect(() => updateTask('non-existent', { title: 'New' })).toThrow('Task not found');
      });

      it('should update task fields', () => {
        const task = createTask({ title: 'Original' });
        const updated = updateTask(task.id, { title: 'Updated', status: 'completed' });
        expect(updated.title).toBe('Updated');
        expect(updated.status).toBe('completed');
      });
    });

    describe('deleteTask', () => {
      it('should delete a task', () => {
        const task = createTask({ title: 'To Delete' });
        deleteTask(task.id);
        expect(getTaskById(task.id)).toBeUndefined();
      });
    });

    describe('toggleTaskStatus', () => {
      it('should toggle task to completed', () => {
        const task = createTask({ title: 'Test' });
        const toggled = toggleTaskStatus(task.id);
        expect(toggled.status).toBe('completed');
      });
    });

    describe('updateTaskSortOrder', () => {
      it('should update task sort order', () => {
        const task = createTask({ title: 'Test' });
        const updated = updateTaskSortOrder(task.id, 5);
        expect(updated.sort_order).toBe(5);
      });
    });

    describe('getAllTasks', () => {
      it('should return all tasks', () => {
        createTask({ title: 'Task 1' });
        createTask({ title: 'Task 2' });
        expect(getAllTasks()).toHaveLength(2);
      });
    });

    describe('getInboxTasks', () => {
      it('should return tasks in inbox', () => {
        const task = createTask({ title: 'Inbox Task' });
        const inboxTasks = getInboxTasks();
        expect(inboxTasks.find(t => t.id === task.id)).toBeDefined();
      });
    });
  });

  describe('Subtask Operations', () => {
    it('should create a subtask', () => {
      const task = createTask({ title: 'Parent Task' });
      const subtask = createSubtask({ taskId: task.id, title: 'Subtask' });
      expect(subtask.title).toBe('Subtask');
      expect(subtask.is_completed).toBe(0);
    });

    it('should get subtasks', () => {
      const task = createTask({ title: 'Parent' });
      createSubtask({ taskId: task.id, title: 'Sub 1' });
      createSubtask({ taskId: task.id, title: 'Sub 2' });
      expect(getSubtasks(task.id)).toHaveLength(2);
    });

    it('should toggle subtask', () => {
      const task = createTask({ title: 'Parent' });
      const subtask = createSubtask({ taskId: task.id, title: 'Subtask' });
      const toggled = toggleSubtask(subtask.id);
      expect(toggled.is_completed).toBe(1);
    });

    it('should delete subtask', () => {
      const task = createTask({ title: 'Parent' });
      const subtask = createSubtask({ taskId: task.id, title: 'Subtask' });
      deleteSubtask(subtask.id);
      expect(getSubtasks(task.id)).toHaveLength(0);
    });
  });

  describe('Label Operations', () => {
    it('should create a label', () => {
      const label = createLabel({ name: 'Work', color: '#000' });
      expect(label.name).toBe('Work');
      expect(label.icon).toBe('🏷');
    });

    it('should use custom icon', () => {
      const label = createLabel({ name: 'Work', color: '#000', icon: '💼' });
      expect(label.icon).toBe('💼');
    });

    it('should add label to task', () => {
      const task = createTask({ title: 'Task' });
      const label = createLabel({ name: 'Label', color: '#aaa' });
      addLabelToTask(task.id, label.id);
      expect(getTaskLabels(task.id)).toHaveLength(1);
    });

    it('should remove label from task', () => {
      const task = createTask({ title: 'Task' });
      const label = createLabel({ name: 'Label', color: '#aaa' });
      addLabelToTask(task.id, label.id);
      removeLabelFromTask(task.id, label.id);
      expect(getTaskLabels(task.id)).toHaveLength(0);
    });
  });

  describe('Comment Operations', () => {
    it('should add a comment', () => {
      const task = createTask({ title: 'Task' });
      const comment = addTaskComment(task.id, 'user-1', 'Test User', 'Nice task!');
      expect(comment.content).toBe('Nice task!');
    });

    it('should get comments', () => {
      const task = createTask({ title: 'Task' });
      addTaskComment(task.id, 'user-1', 'User', 'Comment 1');
      addTaskComment(task.id, 'user-2', 'User2', 'Comment 2');
      expect(getTaskComments(task.id)).toHaveLength(2);
    });

    it('should delete a comment', () => {
      const task = createTask({ title: 'Task' });
      const comment = addTaskComment(task.id, 'user-1', 'User', 'Comment');
      deleteTaskComment(comment.id);
      expect(getTaskComments(task.id)).toHaveLength(0);
    });
  });

  describe('Reminder Operations', () => {
    it('should create a reminder', () => {
      const task = createTask({ title: 'Task' });
      const reminder = createReminder({ taskId: task.id, remindAt: '2024-01-15T00:00:00Z' });
      expect(reminder.task_id).toBe(task.id);
    });

    it('should get reminders', () => {
      const task = createTask({ title: 'Task' });
      createReminder({ taskId: task.id, remindAt: '2024-01-15T00:00:00Z' });
      createReminder({ taskId: task.id, remindAt: '2024-01-16T00:00:00Z' });
      expect(getReminders(task.id)).toHaveLength(2);
    });

    it('should delete a reminder', () => {
      const task = createTask({ title: 'Task' });
      const reminder = createReminder({ taskId: task.id, remindAt: '2024-01-15T00:00:00Z' });
      deleteReminder(reminder.id);
      expect(getReminders(task.id)).toHaveLength(0);
    });

    it('should mark reminder as fired', () => {
      const task = createTask({ title: 'Task' });
      const reminder = createReminder({ taskId: task.id, remindAt: '2024-01-15T00:00:00Z' });
      markReminderFired(reminder.id);
      expect(getReminders(task.id)).toHaveLength(0);
    });
  });

  describe('Dependency Operations', () => {
    it('should add a dependency', () => {
      const task1 = createTask({ title: 'Task 1' });
      const task2 = createTask({ title: 'Task 2' });
      const dep = addTaskDependency(task2.id, task1.id);
      expect(dep.task_id).toBe(task2.id);
      expect(dep.depends_on_id).toBe(task1.id);
    });

    it('should throw error for self-dependency', () => {
      const task = createTask({ title: 'Task' });
      expect(() => addTaskDependency(task.id, task.id)).toThrow('cannot depend on itself');
    });

    it('should throw error for circular dependency', () => {
      const task1 = createTask({ title: 'Task 1' });
      const task2 = createTask({ title: 'Task 2' });
      addTaskDependency(task2.id, task1.id);
      expect(() => addTaskDependency(task1.id, task2.id)).toThrow('circular dependency');
    });

    it('should get task dependencies', () => {
      const task1 = createTask({ title: 'Task 1' });
      const task2 = createTask({ title: 'Task 2' });
      addTaskDependency(task2.id, task1.id);
      const deps = getTaskDependencies(task2.id);
      expect(deps).toHaveLength(1);
      expect(deps[0].id).toBe(task1.id);
    });

    it('should get blocked tasks', () => {
      const parent = createTask({ title: 'Parent' });
      const child = createTask({ title: 'Child' });
      addTaskDependency(child.id, parent.id);
      const blocked = getBlockedTasks();
      expect(blocked).toHaveLength(1);
      expect(blocked[0].id).toBe(child.id);
    });

    it('should remove a dependency', () => {
      const task1 = createTask({ title: 'Task 1' });
      const task2 = createTask({ title: 'Task 2' });
      addTaskDependency(task2.id, task1.id);
      removeTaskDependency(task2.id, task1.id);
      expect(getTaskDependencies(task2.id)).toHaveLength(0);
    });
  });

  describe('Stats Operations', () => {
    it('should calculate task statistics', () => {
      createTask({ title: 'Task 1', status: 'completed' });
      createTask({ title: 'Task 2', status: 'pending' });
      createTask({ title: 'Task 3', status: 'in_progress' });

      const stats = getTaskStats();
      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.pending).toBe(1);
      expect(stats.inProgress).toBe(1);
    });
  });

  describe('Search Operations', () => {
    it('should search tasks by title and description', () => {
      createTask({ title: 'Important work', description: 'Description' });
      createTask({ title: 'Other task', description: 'Important info' });

      const results = searchTasks('Important');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('Type Validation Schemas', () => {
  describe('Priority', () => {
    it('should validate high priority', () => {
      expect(Priority.safeParse('high').success).toBe(true);
    });

    it('should reject invalid priority', () => {
      expect(Priority.safeParse('urgent').success).toBe(false);
    });
  });

  describe('TaskStatus', () => {
    it('should validate all statuses', () => {
      expect(TaskStatus.safeParse('pending').success).toBe(true);
      expect(TaskStatus.safeParse('completed').success).toBe(true);
      expect(TaskStatus.safeParse('in_progress').success).toBe(true);
      expect(TaskStatus.safeParse('cancelled').success).toBe(true);
    });

    it('should reject invalid status', () => {
      expect(TaskStatus.safeParse('unknown').success).toBe(false);
    });
  });

  describe('RecurringType', () => {
    it('should validate all recurring types', () => {
      expect(RecurringType.safeParse('daily').success).toBe(true);
      expect(RecurringType.safeParse('weekly').success).toBe(true);
      expect(RecurringType.safeParse('monthly').success).toBe(true);
      expect(RecurringType.safeParse('yearly').success).toBe(true);
    });
  });

  describe('ListSchema', () => {
    it('should validate a valid list', () => {
      const result = ListSchema.safeParse({
        id: 'list-123',
        name: 'My List',
        color: '#3b82f6',
        emoji: '📋',
        isInbox: false,
        sortOrder: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('TaskSchema', () => {
    it('should validate a valid task', () => {
      const result = TaskSchema.safeParse({
        id: 'task-123',
        title: 'My Task',
        priority: 'high',
        status: 'pending',
        sortOrder: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('should reject task with empty title', () => {
      const result = TaskSchema.safeParse({
        id: 'task-123',
        title: '',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      });
      expect(result.success).toBe(false);
    });
  });
});