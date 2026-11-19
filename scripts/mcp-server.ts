#!/usr/bin/env node
/**
 * Standalone Stdio Model Context Protocol (MCP) Server
 * Compatible with Claude Desktop, Cursor, and Antigravity plugins.
 *
 * Usage:
 *   npx -y tsx scripts/mcp-server.ts
 *
 * Environment variables:
 *   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_db
 *   SANDBOX_STUDENT_DATABASE_URL=postgresql://student_sandbox_user:sandbox_safe_pw@localhost:5435/sandbox_db
 *   MCP_API_KEY=mcp_db_platform_live_key_2026
 */

import readline from 'readline';
import { queryApp, generate16WeeksForCourse } from '../packages/db/src';
import { executeSandboxQuery } from '../packages/sandbox/src';

const MCP_API_KEY = process.env.MCP_API_KEY || 'mcp_db_platform_live_key_2026';

const MCP_TOOLS = [
  {
    name: 'list_courses',
    description: 'List all master courses with their code, title, module count, and active class count.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_course_curriculum',
    description: 'Get the full 16-week syllabus for a master course, including lecture slides, quizzes, and project business cases.',
    inputSchema: {
      type: 'object',
      properties: { courseId: { type: 'string', description: 'UUID or code of the master course (e.g. BA-101)' } },
      required: ['courseId'],
    },
  },
  {
    name: 'create_course_with_16_weeks',
    description: 'Create a new master course and automatically generate all 16 weeks of structured curriculum, interactive lecture slides, and project labs.',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Course code, e.g. "BA-501"' },
        title: { type: 'string', description: 'Course title, e.g. "Cloud Data Engineering & Analytics"' },
        description: { type: 'string', description: 'Optional course description' },
      },
      required: ['code', 'title'],
    },
  },
  {
    name: 'update_week_content',
    description: 'Update the content for a specific week module (1..16): title, description, lecture slides HTML, or quiz data.',
    inputSchema: {
      type: 'object',
      properties: {
        moduleId: { type: 'string', description: 'UUID of the master module to update' },
        title: { type: 'string', description: 'New week title' },
        description: { type: 'string', description: 'New week description / objectives' },
        lectureSlidesHtml: { type: 'string', description: 'New HTML content for presentation slides' },
        quizData: { type: 'array', description: 'Array of quiz question objects' },
      },
      required: ['moduleId'],
    },
  },
  {
    name: 'auto_generate_16_weeks',
    description: 'Auto-generate or re-populate the complete 16-week structured syllabus for an existing master course.',
    inputSchema: {
      type: 'object',
      properties: { courseId: { type: 'string', description: 'UUID or code of the master course' } },
      required: ['courseId'],
    },
  },
  {
    name: 'delete_course',
    description: 'Permanently delete a master course and all its cascaded 16 modules, assignments, and class cohorts.',
    inputSchema: {
      type: 'object',
      properties: { courseId: { type: 'string', description: 'UUID or code of the master course to delete' } },
      required: ['courseId'],
    },
  },
  {
    name: 'list_classes',
    description: 'List all active or completed class cohorts / sections with enrollment counts and status.',
    inputSchema: {
      type: 'object',
      properties: {
        courseId: { type: 'string', description: 'Optional master course UUID filter' },
        term: { type: 'string', description: 'Optional semester term filter (e.g. Fall 2026)' },
      },
      required: [],
    },
  },
  {
    name: 'create_class',
    description: 'Create a new class section / cohort for a semester term, linked to a master course.',
    inputSchema: {
      type: 'object',
      properties: {
        courseId: { type: 'string', description: 'UUID of the master course' },
        code: { type: 'string', description: 'Section code, e.g. "BA-2026-FALL-C"' },
        name: { type: 'string', description: 'Section name, e.g. "Afternoon Section C"' },
        term: { type: 'string', description: 'Semester term, e.g. "Fall 2026"' },
      },
      required: ['courseId', 'code', 'name', 'term'],
    },
  },
  {
    name: 'delete_class',
    description: 'Permanently delete a class section / cohort, removing its student enrollments, submissions, and grades.',
    inputSchema: {
      type: 'object',
      properties: { cohortId: { type: 'string', description: 'UUID or code of the class cohort to delete' } },
      required: ['cohortId'],
    },
  },
  {
    name: 'execute_sandbox_sql',
    description: 'Safely execute arbitrary analytical SQL in the isolated PostgreSQL sandbox database with read-only transaction and 3000ms timeout.',
    inputSchema: {
      type: 'object',
      properties: { sql: { type: 'string', description: 'SQL query to execute' } },
      required: ['sql'],
    },
  },
  {
    name: 'get_gradebook',
    description: 'Retrieve the final gradebook matrix for a cohort, including individual student scores, weighted percentages, and letter grades.',
    inputSchema: {
      type: 'object',
      properties: { cohortId: { type: 'string', description: 'UUID of the class cohort' } },
      required: ['cohortId'],
    },
  },
];

async function handleToolCall(toolName: string, args: any) {
  switch (toolName) {
    case 'list_courses': {
      const res = await queryApp(`
        SELECT 
          mc.id, mc.code, mc.title, mc.description,
          COUNT(DISTINCT c.id)::int AS class_count,
          COUNT(DISTINCT mm.id)::int AS module_count,
          COUNT(DISTINCT ce.student_id)::int AS student_count
        FROM master_courses mc
        LEFT JOIN cohorts c ON c.course_id = mc.id
        LEFT JOIN master_modules mm ON mm.course_id = mc.id
        LEFT JOIN cohort_enrollments ce ON ce.cohort_id = c.id
        GROUP BY mc.id
        ORDER BY mc.code ASC;
      `);
      return res.rows;
    }

    case 'get_course_curriculum': {
      const courseCheck = await queryApp(
        `SELECT id, code, title FROM master_courses WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [args.courseId]
      );
      if (courseCheck.rowCount === 0) throw new Error(`Course not found: ${args.courseId}`);
      const actualCourse = courseCheck.rows[0];

      const modulesRes = await queryApp(
        `SELECT id, title, slug, description, week_number, sort_order, lecture_slides_html, quiz_data
         FROM master_modules WHERE course_id = $1 ORDER BY week_number ASC`,
        [actualCourse.id]
      );

      const assignmentsRes = await queryApp(
        `SELECT id, module_id, title, slug, type, language, max_score, weight_percentage
         FROM master_assignments ORDER BY sort_order ASC`
      );

      return {
        course: actualCourse,
        totalWeeks: modulesRes.rowCount,
        weeks: modulesRes.rows.map((m: any) => ({
          ...m,
          assignments: assignmentsRes.rows.filter((a: any) => a.module_id === m.id),
        })),
      };
    }

    case 'create_course_with_16_weeks': {
      const { code, title, description = '' } = args;
      if (!code || !title) throw new Error('code and title are required');

      const cleanCode = String(code).trim().toUpperCase();
      const teacherRes = await queryApp(`SELECT id FROM users WHERE role = 'teacher' LIMIT 1`);
      const teacherId = teacherRes.rows[0]?.id;

      const res = await queryApp(
        `INSERT INTO master_courses (code, title, description, teacher_id) VALUES ($1, $2, $3, $4) RETURNING *`,
        [cleanCode, String(title).trim(), description, teacherId]
      );
      const newCourse = res.rows[0];
      const generated = await generate16WeeksForCourse(newCourse.id, cleanCode);

      return {
        course: newCourse,
        generatedWeeks: generated.length,
        message: `Successfully created course ${cleanCode} with 16 auto-generated weeks!`,
      };
    }

    case 'update_week_content': {
      const { moduleId, title, description, lectureSlidesHtml, quizData } = args;
      if (!moduleId) throw new Error('moduleId is required');

      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (title !== undefined) {
        updates.push(`title = $${idx++}`);
        values.push(title);
      }
      if (description !== undefined) {
        updates.push(`description = $${idx++}`);
        values.push(description);
      }
      if (lectureSlidesHtml !== undefined) {
        updates.push(`lecture_slides_html = $${idx++}`);
        values.push(lectureSlidesHtml);
      }
      if (quizData !== undefined) {
        updates.push(`quiz_data = $${idx++}`);
        values.push(JSON.stringify(quizData));
      }

      if (updates.length === 0) throw new Error('No fields provided to update');
      values.push(moduleId);

      const res = await queryApp(
        `UPDATE master_modules SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
        values
      );

      if (res.rowCount === 0) throw new Error(`Module with id ${moduleId} not found`);
      return res.rows[0];
    }

    case 'auto_generate_16_weeks': {
      const courseCheck = await queryApp(
        `SELECT id, code FROM master_courses WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [args.courseId]
      );
      if (courseCheck.rowCount === 0) throw new Error(`Course not found: ${args.courseId}`);
      const course = courseCheck.rows[0];
      const modules = await generate16WeeksForCourse(course.id, course.code);

      return {
        courseId: course.id,
        courseCode: course.code,
        modulesGenerated: modules.length,
        message: `Successfully populated 16 weeks for ${course.code}`,
      };
    }

    case 'delete_course': {
      const courseCheck = await queryApp(
        `SELECT id, code, title FROM master_courses WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [args.courseId]
      );
      if (courseCheck.rowCount === 0) throw new Error(`Course not found: ${args.courseId}`);
      const course = courseCheck.rows[0];

      await queryApp(`DELETE FROM master_courses WHERE id = $1`, [course.id]);
      return {
        deletedCourse: course,
        message: `Successfully deleted course ${course.code} and all cascaded modules and classes.`,
      };
    }

    case 'list_classes': {
      const { courseId, term } = args;
      const res = await queryApp(
        `
        SELECT 
          c.id, c.code, c.name, c.term, c.status,
          mc.code AS course_code, mc.title AS course_title,
          COUNT(DISTINCT ce.student_id)::int AS student_count
        FROM cohorts c
        LEFT JOIN master_courses mc ON c.course_id = mc.id
        LEFT JOIN cohort_enrollments ce ON ce.cohort_id = c.id
        WHERE ($1::text IS NULL OR c.course_id::text = $1 OR mc.code = $1)
          AND ($2::text IS NULL OR c.term = $2)
        GROUP BY c.id, mc.code, mc.title
        ORDER BY c.created_at ASC;
        `,
        [courseId || null, term || null]
      );
      return res.rows;
    }

    case 'create_class': {
      const { courseId, code, name, term } = args;
      if (!courseId || !code || !name || !term) {
        throw new Error('courseId, code, name, and term are required');
      }
      const teacherRes = await queryApp(`SELECT id FROM users WHERE role = 'teacher' LIMIT 1`);
      const teacherId = teacherRes.rows[0]?.id;

      const res = await queryApp(
        `INSERT INTO cohorts (course_id, code, name, term, teacher_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [courseId, String(code).trim().toUpperCase(), String(name).trim(), String(term).trim(), teacherId]
      );
      return res.rows[0];
    }

    case 'delete_class': {
      const cohortCheck = await queryApp(
        `SELECT id, code, name FROM cohorts WHERE id::text = $1 OR code = $1 LIMIT 1`,
        [args.cohortId]
      );
      if (cohortCheck.rowCount === 0) throw new Error(`Class not found: ${args.cohortId}`);
      const cohort = cohortCheck.rows[0];

      await queryApp(`DELETE FROM cohorts WHERE id = $1`, [cohort.id]);
      return {
        deletedCohort: cohort,
        message: `Successfully deleted class section ${cohort.code}`,
      };
    }

    case 'execute_sandbox_sql': {
      if (!args.sql) throw new Error('sql is required');
      return await executeSandboxQuery(args.sql);
    }

    case 'get_gradebook': {
      if (!args.cohortId) throw new Error('cohortId is required');
      const res = await queryApp(
        `SELECT * FROM vw_cohort_final_gradebook WHERE cohort_id::text = $1 ORDER BY student_name ASC`,
        [args.cohortId]
      );
      return res.rows;
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// Stdio JSON-RPC Loop
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

rl.on('line', async (line) => {
  if (!line.trim()) return;
  let msg: any;
  try {
    msg = JSON.parse(line);
  } catch {
    console.log(JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null }));
    return;
  }

  const { jsonrpc = '2.0', id = 1, method, params = {} } = msg;

  try {
    if (method === 'initialize') {
      console.log(
        JSON.stringify({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {}, resources: {} },
            serverInfo: { name: 'db-analytics-mcp-server', version: '1.0.0' },
          },
        })
      );
      return;
    }

    if (method === 'notifications/initialized' || method === 'ping') {
      console.log(JSON.stringify({ jsonrpc: '2.0', id, result: {} }));
      return;
    }

    if (method === 'tools/list') {
      console.log(JSON.stringify({ jsonrpc: '2.0', id, result: { tools: MCP_TOOLS } }));
      return;
    }

    if (method === 'tools/call') {
      const data = await handleToolCall(params.name, params.arguments || {});
      console.log(
        JSON.stringify({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
          },
        })
      );
      return;
    }

    console.log(
      JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32601, message: `Method not found: ${method}` },
        id,
      })
    );
  } catch (err: any) {
    console.log(
      JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32000, message: err.message || 'Execution error' },
        id,
      })
    );
  }
});
