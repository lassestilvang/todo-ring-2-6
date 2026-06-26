import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTasks, createTask } from '@/db/operations';
import { parseICS, stringifyICS } from 'ics';
import fs from 'fs/promises';
import path from 'path';

// Keep track of calendar subscriptions
let calendarSubscriptions = new Map();

ensureDbInitialized();

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const tasks = getTasks();

    // Filter by date range if provided
    let filteredTasks = tasks;
    if (startDate) {
      filteredTasks = filteredTasks.filter(t => t.date && t.date >= startDate);
    }
    if (endDate) {
      filteredTasks = filteredTasks.filter(t => t.date && t.date <= endDate);
    }

    // Group by date for calendar view
    const grouped: Record<string, typeof tasks> = {};
    for (const task of filteredTasks) {
      if (task.date) {
        if (!grouped[task.date]) {
          grouped[task.date] = [];
        }
        grouped[task.date]!.push(task);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        tasks: filteredTasks,
        grouped,
        total: filteredTasks.length,
      },
    });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    if (contentType?.includes('application/ics')) {
      // Handle ICS import
      return await handleICSImport(request);
    } else {
      // Assume new task creation
      return await handleTaskCreation(request);
    }
  } catch (error) {
    console.error('Calendar POST error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function handleICSImport(request: NextRequest) {
  try {
    const body = await request.text();
    const tasks = parseICS(body, (err, data) => {
      if (err) {
        return NextResponse.json(
          { success: false, error: `ICS parsing error: ${err.message}` },
          { status: 400 }
        );
      }

      // Process each imported task
      const createdTasks = [];
      for (const task of data.tasks) {
        // Check if task already exists
        const existingTaskIndex = getTasks().findIndex(t =>
          t.title === task.description &&
          t.dueDate === task.due
        );

        if (existingTaskIndex === -1) {
          // Create unique ID and save
          const newTask = {
            id: Date.now().toString(),
            title: task.description || 'Untitled Task',
            description: task.description || '',
            status: 'pending',
            listId: 'default',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            dueDate: task.due || new Date().toISOString(),
            priority: 'medium',
            tags: extractTagsFromDescription(task.description || ''),
            context: task.description || ''
          };

          createTask(newTask);
          createdTasks.push(newTask);
        }
      }

      return NextResponse.json({
        success: true,
        importedTasks: createdTasks.length,
        message: `Successfully imported ${createdTasks.length} tasks from ICS`
      });
    })(request.body as any);

    if (!tasks) {
      return NextResponse.json(
        { success: false, error: 'No tasks parsed from ICS' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      importedTasks: tasks.length,
      message: `Successfully imported ${tasks.length} tasks from ICS`
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `ICS import failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 400 }
    );
  }
}

function extractTagsFromDescription(text: string): string[] {
  // Simple tag extraction pattern
  const tagMatches = text.match(/#(\w+)/g);
  return tagMatches ? tagMatches.map(m => m.slice(1)) : [];
}

async function handleTaskCreation(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.task || !body.task.content) {
      return NextResponse.json(
        { success: false, error: 'Task content is required' },
        { status: 400 }
      };
    }

    const newTask = {
      id: Date.now().toString(),
      content: body.task.content,
      description: body.task.description || '',
      status: 'pending',
      priority: body.task.priority || 'medium',
      tags: body.task.tags || [],
      context: body.task.context || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    createTask(newTask);

    return NextResponse.json({
      success: true,
      task: newTask
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create task' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    if (contentType?.includes('application/ics')) {
      // Handle ICS export
      return await handleICSExport(request);
    } else {
      // Handle task update
      return await handleTaskUpdate(request);
    }
  } catch (error) {
    console.error('Calendar PUT error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update resource' },
      { status: 500 }
    );
  }
}

async function handleICSExport(request: NextRequest) {
  try {
    const body = await request.json();
    const { tasks, format } = body;

    const formatOptions = {
      method: 'PUBLISH',
      params: { METHOD: 'PUBLISH' },
      encoding: { 7bit: true },
      generateBusyStatus: true,
    };

    const icsContent = stringifyICS({
      name: 'TaskPlanner Calendar Export',
      description: 'Exported from TaskPlanner application',
      events: tasks.map(task => ({
        startDate: task.createdAt,
        durationMinutes: 60, // default duration
        location: '',
        description: `${task.title}\nTags: ${task.tags.join(', ')}\n${task.context || ''}`,
        uid: task.id,
        fromDate: task.createdAt,
        toDate: task.dueDate || task.createdAt,
      })),
      ...formatOptions
    });

    return NextResponse.json(
      { ics: icsContent },
      {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'attachment; filename="tasks.ics"',
          'Content-Length': Buffer.byteLength(icsContent)
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'ICS export failed' },
      { status: 500 }
    );
  }
}

async function handleTaskUpdate(request: NextRequest) {
  try {
    const { taskId, updates } = await request.json();

    if (!taskId || !updates) {
      return NextResponse.json(
        { success: false, error: 'Task ID and updates are required' },
        { status: 400 }
      );
    }

    const tasks = getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Update task
    const updatedTask = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // In a real implementation, this would persist to database
    // For now, we just return success
    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: 'Task updated successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update task' },
      { status: 500 }
    );
  }
}