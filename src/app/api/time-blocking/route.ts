/**
 * Time Blocking API Route
 * Manages time blocks for scheduling tasks
 */

import { NextRequest, NextResponse } from 'next/server';
import { withMiddleware } from '@/lib/api-middleware';
import { getDb } from '@/lib/db-client';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const createTimeBlockSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  start_time: z.string().datetime('Invalid start time'),
  end_time: z.string().datetime('Invalid end time'),
  task_id: z.string().optional(),
});

const updateTimeBlockSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  start_time: z.string().datetime('Invalid start time').optional(),
  end_time: z.string().datetime('Invalid end time').optional(),
  task_id: z.string().optional(),
});

// GET - List time blocks (optionally filtered by date)
async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const date = searchParams.get('date');
  const userId = req.headers.get('x-user-id');

  const db = getDb();

  if (date) {
    // Get time blocks for a specific date
    const timeBlocks = db
      .prepare(`
        SELECT tb.*, t.title as task_title
        FROM time_blocks tb
        LEFT JOIN tasks t ON tb.task_id = t.id
        WHERE tb.user_id = ? AND date(tb.start_time) = date(tb.end_time) AND date(tb.start_time) = ?
        ORDER BY tb.start_time ASC
      `)
      .all(userId, date);

    return NextResponse.json({
      success: true,
      data: timeBlocks,
    });
  } else {
    // Get all time blocks for user
    const timeBlocks = db
      .prepare(`
        SELECT tb.*, t.title as task_title
        FROM time_blocks tb
        LEFT JOIN tasks t ON tb.task_id = t.id
        WHERE tb.user_id = ?
        ORDER BY tb.start_time ASC
      `)
      .all(userId);

    return NextResponse.json({
      success: true,
      data: timeBlocks,
    });
  }
}

// POST - Create a new time block
async function POST(req: NextRequest) {
  const body = await req.json();
  const validated = createTimeBlockSchema.parse(body);
  const userId = req.headers.get('x-user-id');

  const db = getDb();
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO time_blocks (id, user_id, title, start_time, end_time, task_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, userId, validated.title, validated.start_time, validated.end_time, validated.task_id);

  const timeBlock = db
    .prepare(`
      SELECT tb.*, t.title as task_title
      FROM time_blocks tb
      LEFT JOIN tasks t ON tb.task_id = t.id
      WHERE tb.id = ?
    `)
    .get(id);

  return NextResponse.json(
    { success: true, data: timeBlock },
    { status: 201 }
  );
}

// PUT - Update a time block
async function PUT(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'ID is required' },
      { status: 400 }
    );
  }

  const body = await req.json();
  const validated = updateTimeBlockSchema.parse(body);
  const userId = req.headers.get('x-user-id');

  const db = getDb();

  // Check if time block exists and belongs to user
  const existing = db.prepare('SELECT * FROM time_blocks WHERE id = ? AND user_id = ?').get(id, userId);

  if (!existing) {
    return NextResponse.json(
      { success: false, error: 'Time block not found' },
      { status: 404 }
    );
  }

  // Build update query dynamically
  const updates: string[] = [];
  const values: any[] = [];

  if (validated.title !== undefined) {
    updates.push('title = ?');
    values.push(validated.title);
  }
  if (validated.start_time !== undefined) {
    updates.push('start_time = ?');
    values.push(validated.start_time);
  }
  if (validated.end_time !== undefined) {
    updates.push('end_time = ?');
    values.push(validated.end_time);
  }
  if (validated.task_id !== undefined) {
    updates.push('task_id = ?');
    values.push(validated.task_id);
  }

  if (updates.length === 0) {
    return NextResponse.json({ success: true, data: existing });
  }

  values.push(id, userId);

  db.prepare(`
    UPDATE time_blocks
    SET ${updates.join(', ')}, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(...values);

  const updated = db
    .prepare(`
      SELECT tb.*, t.title as task_title
      FROM time_blocks tb
      LEFT JOIN tasks t ON tb.task_id = t.id
      WHERE tb.id = ?
    `)
    .get(id);

  return NextResponse.json({ success: true, data: updated });
}

// DELETE - Delete a time block
async function DELETE(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get('id');
  const userId = req.headers.get('x-user-id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'ID is required' },
      { status: 400 }
    );
  }

  const db = getDb();

  const result = db.prepare(
    'DELETE FROM time_blocks WHERE id = ? AND user_id = ?'
  ).run(id, userId);

  if (result.changes === 0) {
    return NextResponse.json(
      { success: false, error: 'Time block not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, message: 'Time block deleted' });
}

export { GET, POST, PUT, DELETE };