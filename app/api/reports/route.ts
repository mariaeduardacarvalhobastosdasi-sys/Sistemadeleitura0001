import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // Total do Dia (Último ciclo fechado ou o atual se estiver no meio)
    // Vamos pegar o total do último ciclo concluído
    const lastCycle = db.prepare(`
      SELECT SUM(amount) as total 
      FROM readings 
      WHERE cycle_id = (SELECT id FROM cycles ORDER BY id DESC LIMIT 1)
    `).get() as any;

    // Total da Semana (Últimos 7 dias)
    const weeklyTotal = db.prepare(`
      SELECT SUM(amount) as total 
      FROM readings r
      JOIN cycles c ON r.cycle_id = c.id
      WHERE c.closed_at >= date('now', '-7 days')
    `).get() as any;

    // Total do Mês (Mês atual)
    const monthlyTotal = db.prepare(`
      SELECT SUM(amount) as total 
      FROM readings r
      JOIN cycles c ON r.cycle_id = c.id
      WHERE strftime('%m', c.closed_at) = strftime('%m', 'now')
      AND strftime('%Y', c.closed_at) = strftime('%Y', 'now')
    `).get() as any;

    // Histórico de Ciclos
    const history = db.prepare(`
      SELECT c.*, SUM(r.amount) as total_amount
      FROM cycles c
      LEFT JOIN readings r ON c.id = r.cycle_id
      GROUP BY c.id
      ORDER BY c.id DESC
      LIMIT 20
    `).all();

    return NextResponse.json({
      day: lastCycle?.total || 0,
      week: weeklyTotal?.total || 0,
      month: monthlyTotal?.total || 0,
      history
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}
