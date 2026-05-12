import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password) as any;

    if (user) {
      return NextResponse.json({ 
        role: user.role,
        username: user.username 
      });
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
