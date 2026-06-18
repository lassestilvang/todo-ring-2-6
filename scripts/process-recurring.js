#!/usr/bin/env node

/**
 * Process recurring tasks
 * Run this periodically (e.g., via cron job or scheduled task)
 *
 * Example cron entry (runs daily at midnight):
 * 0 0 * * * /usr/bin/node /path/to/taskplanner/scripts/process-recurring.js
 */

const { getDb } = require('../db/index');
const { getRecurringTasks, calculateNextDate, createTask } = require('../db/operations');

// Import the operations - in production, you'd use a proper import
// For now, we'll inline the necessary functions

async function processRecurringTasks() {
  console.log('Processing recurring tasks...');

  const db = getDb();

  // Get all tasks with recurrence
  const recurringTasks = db.prepare(
    "SELECT * FROM tasks WHERE recurring_type != 'none' AND status NOT IN ('completed', 'cancelled')"
  ).all();

  let createdCount = 0;
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const endDate = nextMonth.toISOString().split('T')[0];

  for (const task of recurringTasks) {
    let current = new Date(task.date || task.created_at);
    const end = new Date(endDate);

    while (current <= end) {
      const currentDateStr = current.toISOString().split('T')[0];

      // Skip if task already exists for this date
      const existing = db.prepare(
        'SELECT id FROM tasks WHERE title = ? AND date = ? AND recurring_type != ?',
        [task.title, currentDateStr, 'none']
      ).get();

      if (!existing) {
        // Create new task instance
        const newId = crypto.randomUUID();
        const now = new Date().toISOString();

        db.prepare(`
          INSERT INTO tasks
          (id, title, description, list_id, date, deadline, estimate_hours, estimate_minutes,
           actual_hours, actual_minutes, priority, status, recurring_type, recurring_interval,
           is_all_day, sort_order, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 'pending', ?, ?, ?,
          (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM tasks), ?, ?)
        `).run(
          newId,
          `${task.title} (recurring)`,
          task.description,
          task.list_id,
          currentDateStr,
          task.deadline,
          task.estimate_hours,
          task.estimate_minutes,
          task.priority,
          task.recurring_type,
          task.recurring_interval || '',
          task.is_all_day ? 1 : 0,
          now,
          now
        );

        console.log(`Created recurring task: ${task.title} for ${currentDateStr}`);
        createdCount++;
      }

      // Move to next occurrence
      current = new Date(current.getTime() + (task.recurring_type === 'daily' ? 1 :
        task.recurring_type === 'weekly' ? 7 :
        task.recurring_type === 'weekdays' ? getNextWeekday(current) :
        task.recurring_type === 'monthly' ? 30 :
        task.recurring_type === 'yearly' ? 365 : 1));
    }
  }

  console.log(`Created ${createdCount} new recurring task instances`);
  return createdCount;
}

function getNextWeekday(date) {
  let next = new Date(date);
  next.setDate(next.getDate() + 1);
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

// Run if called directly
if (require.main === module) {
  processRecurringTasks()
    .then(() => {
      console.log('Recurring task processing complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error processing recurring tasks:', err);
      process.exit(1);
    });
}

module.exports = { processRecurringTasks };