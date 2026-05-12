import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Get current status
export async function GET() {
  try {
    const activeCycle = db.prepare('SELECT * FROM cycles WHERE is_open = 1 LIMIT 1').get() as any;
    
    // Also get progress: how many machines read in this cycle
    let progress = { total: 0, completed: 0 };
    if (activeCycle) {
      const machinesCount = db.prepare('SELECT COUNT(*) as count FROM machines WHERE active = 1').get() as any;
      const readingsCount = db.prepare('SELECT COUNT(*) as count FROM readings WHERE cycle_id = ?').get(activeCycle.id) as any;
      progress = { total: machinesCount.count, completed: readingsCount.count };
    }

    return NextResponse.json({ activeCycle, progress });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cycle state' }, { status: 500 });
  }
}

// Open new cycle
export async function POST() {
  try {
    const activeCycle = db.prepare('SELECT id FROM cycles WHERE is_open = 1').get();
    if (activeCycle) {
      return NextResponse.json({ error: 'Já existe um ciclo aberto' }, { status: 400 });
    }

    const result = db.prepare('INSERT INTO cycles (is_open) VALUES (1)').run();
    return NextResponse.json({ id: result.lastInsertRowid });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to open cycle' }, { status: 500 });
  }
}

// Close cycle
export async function PUT(req: Request) {
  try {
    const activeCycle = db.prepare('SELECT id FROM cycles WHERE is_open = 1').get() as any;
    if (!activeCycle) {
      return NextResponse.json({ error: 'Nenhum ciclo aberto para fechar' }, { status: 400 });
    }

    // Check if all machines have readings
    const machinesCount = db.prepare('SELECT COUNT(*) as count FROM machines WHERE active = 1').get() as any;
    const readingsCount = db.prepare('SELECT COUNT(*) as count FROM readings WHERE cycle_id = ?').get(activeCycle.id) as any;

    if (readingsCount.count < machinesCount.count) {
      return NextResponse.json({ error: 'Existem máquinas sem leitura' }, { status: 400 });
    }

    // Close the cycle
    db.prepare(`
      UPDATE cycles 
      SET is_open = 0, closed_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(activeCycle.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to close cycle' }, { status: 500 });
  }
}
