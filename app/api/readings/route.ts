import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { FACTORS, calculateAmount, MachineType } from '@/lib/constants';

export async function POST(req: Request) {
  const transaction = db.transaction((data) => {
    const { machineId, endReading } = data;

    const cycle = db.prepare('SELECT id FROM cycles WHERE is_open = 1').get() as any;
    if (!cycle) throw new Error('Cicle is not open');

    const machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(machineId) as any;
    if (!machine) throw new Error('Machine not found');

    const startReading = machine.current_reading;
    const diff = endReading - startReading;
    
    if (diff < 0) {
      throw new Error('Leitura final não pode ser menor que a inicial');
    }

    const amount = calculateAmount(diff, machine.type as MachineType);
    const factor = FACTORS[machine.type as MachineType];

    // Check if reading already exists for this machine in this cycle
    const existingReading = db.prepare('SELECT id FROM readings WHERE machine_id = ? AND cycle_id = ?').get(machineId, cycle.id);
    if (existingReading) {
      throw new Error('Esta máquina já foi lida neste ciclo');
    }

    // Insert reading
    db.prepare(`
      INSERT INTO readings (machine_id, cycle_id, start_reading, end_reading, factor, amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(machineId, cycle.id, startReading, endReading, factor, amount);

    // Update machine state for next reading
    db.prepare('UPDATE machines SET current_reading = ? WHERE id = ?').run(endReading, machineId);

    return { amount, diff };
  });

  try {
    const body = await req.json();
    const result = transaction(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cycleId = searchParams.get('cycleId');

    if (!cycleId) return NextResponse.json({ error: 'Cycle ID required' }, { status: 400 });

    const readings = db.prepare(`
      SELECT r.*, m.number, m.type 
      FROM readings r
      JOIN machines m ON r.machine_id = m.id
      WHERE r.cycle_id = ?
    `).all(cycleId);

    return NextResponse.json(readings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch readings' }, { status: 500 });
  }
}
