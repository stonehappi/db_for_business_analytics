import { NextResponse } from 'next/server';
import { queryApp } from '@db-platform/db';

export async function GET() {
  try {
    const res = await queryApp(`
      SELECT id, student_id_code, email, full_name, role
      FROM users
      ORDER BY role ASC, full_name ASC;
    `);
    return NextResponse.json(res.rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
