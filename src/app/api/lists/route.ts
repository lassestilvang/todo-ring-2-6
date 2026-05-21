import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/db/index';
import { getAllLists, getInboxList, createList, updateList, deleteList as dbDeleteList } from '@/db/operations';
import type { List } from '@/types/index';

// Ensure database is initialized
try {
  initDb();
} catch (e) {
  // Already initialized or error during init
}

export async function GET() {
  try {
    const lists = getAllLists();
    return NextResponse.json({ success: true, data: lists });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch lists' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newList = createList(body);
    return NextResponse.json({ success: true, data: newList }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to create list' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const updatedList = updateList(id, data);
    return NextResponse.json({ success: true, data: updatedList });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to update list' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }
    dbDeleteList(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete list' }, { status: 500 });
  }
}