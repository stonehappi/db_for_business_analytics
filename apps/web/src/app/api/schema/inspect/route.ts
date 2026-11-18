import { NextResponse } from 'next/server';
import { sandboxAdminPool } from '@db-platform/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const client = await sandboxAdminPool.connect();
  try {
    const tablesRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const columnsRes = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `);

    const tables = tablesRes.rows.map((t) => ({
      name: t.table_name,
      columns: columnsRes.rows
        .filter((c) => c.table_name === t.table_name)
        .map((c) => ({
          name: c.column_name,
          type: c.data_type,
          nullable: c.is_nullable === 'YES',
        })),
    }));

    return NextResponse.json({ tables });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
