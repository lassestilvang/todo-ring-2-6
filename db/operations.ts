// === Search ===}

export function searchTasks(query: string): Task[] {
  const db = getDb();
  const parsed = parseQuery(query);
  let querySql = 'SELECT * FROM tasks WHERE 1=1'
  const values: any[] = [];

  if (parsed.priority) {
    querySql += ' AND priority = ?'
    values.push(parsed.priority)
  }
  if (parsed.status) {
    querySql += ' AND status = ?'
    values.push(parsed.status)
  }
  if (parsed.deadlineRange) {
    const { start, end } = parsed.deadlineRange
    querySql += ' AND (deadline >= ? AND deadline <= ?)'
    values.push(start, end)
  }

  // Combine with FTS5 or LIKE
  const ftsResults = db.prepare(
    `SELECT * FROM tasks WHERE (title LIKE ? OR description LIKE ?) AND ${querySql.slice(13)} ORDER BY rank, created_at DESC`
  )
  .all(query, `%${query}%`, `%${query}%`, ...values);

  if (ftsResults && ftsResults.length > 0) {
    return ftsResults.map((r: any) => {
      delete r.rowid;
      return r as Task;
    });
  }

  // Fallback if NLP parsing didn't find matches
  return db.prepare(
    'SELECT * FROM tasks WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC'
  )
  .all(`%${query}%`, `%${query}%`) as Task[];

  function parseQuery(query: string): { priority?: string; status?: string; deadlineRange?: { start?: string; end?: string } } {
    // NLP Parsing Logic
    const priority = query.match(/high|medium|low|none/i)?.[0] || 'all';

    const status = query.match(/pending|in_progress|completed|cancelled/i)?.[0] || 'all';

    const deadlineMatches = query.match(/due in ([0-9]+) (days|weeks|months)|next (week|month)|today|tomorrow|about ([0-9]+) (days|weeks|months)/i);

    if (deadlineMatches) {
      const [, count, unit, days] = deadlineMatches;
      const now = new Date().toISOString().split('T')[0];
      const start = now;
      let end = now;

      switch (unit) {
        case 'days': end = addDays(now, parseInt(days) || count); break;
        case 'weeks': end = addDays(now, parseInt(days) || count * 7); break;
        case 'months': end = addMonths(now, parseInt(days) || count); break;
      }

      return { start, end };
    }

    return { priority, status };
  }
}