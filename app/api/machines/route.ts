import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const machines = db.prepare('SELECT * FROM machines WHERE active = 1 ORDER BY CAST(number AS INTEGER) ASC').all();
    return NextResponse.json(machines);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch machines' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { number, type, initial_reading } = await req.json();

    if (!number || !type || initial_reading === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO machines (number, type, current_reading) 
      VALUES (?, ?, ?)
    `).run(number, type, initial_reading);

    return NextResponse.json({ id: result.lastInsertRowid });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return NextResponse.json({ error: 'Número de máquina já existe' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create machine' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    db.prepare('UPDATE machines SET active = 0 WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
