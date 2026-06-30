/**
 * Task Batches API Route
 * Manages groups of tasks (projects/orders)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withMiddleware } from '@/lib/api-middleware';
import { getDb } from '@/lib/db-client';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const createBatchSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
  taskIds: z.array(z.string()).optional(),
});

const updateBatchSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  taskIds: z.array(z.string()).optional(),
});

// GET - List all batches
async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  const db = getDb();

  const batches = db
    .prepare(`
      SELECT b.*, COUNT(bt.task_id) as task_count
      FROM task_batches b
      LEFT JOIN batch_tasks bt ON b.id = bt.batch_id
      WHERE b.user_id = ?
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `)
    .all(userId);

  return NextResponse.json({ success: true, data: batches });
}

// POST - Create a new batch
async function POST(req: NextRequest) {
  const body = await req.json();
  const validated = createBatchSchema.parse(body);
  const userId = req.headers.get('x-user-id');
  const db = getDb();
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO task_batches (id, user_id, name, description, color)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(id, userId, validated.name, validated.description, validated.color || '#3b82f6');

  // Add tasks to batch if provided
  if (validated.taskIds && validated.taskIds.length > 0) {
    const batchTaskStmt = db.prepare(
      'INSERT INTO batch_tasks (id, batch_id, task_id) VALUES (?, ?, ?)'
    );
    for (const taskId of validated.taskIds) {
      batchTaskStmt.run(uuidv4(), id, taskId);
    }
  }

  const batch = db.prepare('SELECT * FROM task_batches WHERE id = ?').get(id);

  return NextResponse.json({ success: true, data: batch }, { status: 201 });
}

// PUT - Update a batch
async function PUT(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
  }

  const body = await req.json();
  const validated = updateBatchSchema.parse(body);
  const userId = req.headers.get('x-user-id');
  const db = getDb();

  // Check if batch exists
  const existing = db.prepare('SELECT * FROM task_batches WHERE id = ? AND user_id = ?').get(id, userId);
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
  }

  // Build update query
  const updates: string[] = [];
  const values: any[] = [];

  if (validated.name !== undefined) {
    updates.push('name = ?');
    values.push(validated.name);
  }
  if (validated.description !== undefined) {
    updates.push('description = ?');
    values.push(validated.description);
  }
  if (validated.color !== undefined) {
    updates.push('color = ?');
    values.push(validated.color);
  }

  if (updates.length > 0) {
    values.push(id, userId);
    db.prepare(`UPDATE task_batches SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
  }

  // Update task associations if provided
  if (validated.taskIds !== undefined) {
    db.prepare('DELETE FROM batch_tasks WHERE batch_id = ?').run(id);
    if (validated.taskIds.length > 0) {
      const batchTaskStmt = db.prepare('INSERT INTO batch_tasks (id, batch_id, task_id) VALUES (?, ?, ?)');
      for (const taskId of validated.taskIds) {
        batchTaskStmt.run(uuidv4(), id, taskId);
      }
    }
  }

  const batch = db.prepare('SELECT * FROM task_batches WHERE id = ?').get(id);
  return NextResponse.json({ success: true, data: batch });
}

// DELETE - Delete a batch
async function DELETE(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get('id');
  const userId = req.headers.get('x-user-id');
  const db = getDb();

  if (!id) {
    return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
  }

  // Delete batch tasks first
  db.prepare('DELETE FROM batch_tasks WHERE batch_id = ?').run(id);

  // Delete batch
  const result = db.prepare('DELETE FROM task_batches WHERE id = ? AND user_id = ?').run(id, userId);

  if (result.changes === 0) {
    return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'Batch deleted' });
}

export { GET, POST, PUT, DELETE };