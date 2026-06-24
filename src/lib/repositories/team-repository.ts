/**
 * Team Repository
 * Handles all database operations related to teams and team members
 */

import { getDb } from '../../db/index';
import type { Team, TeamMember } from '@/types/index';

export class TeamRepository {
  private db = getDb();

  // Team operations
  findAll(): Team[] {
    return this.db.prepare(
      'SELECT * FROM teams ORDER BY created_at DESC'
    ).all() as Team[];
  }

  findById(id: string): Team | undefined {
    return this.db.prepare('SELECT * FROM teams WHERE id = ?').get(id) as Team | undefined;
  }

  create(data: { name: string; description?: string }): Team {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO teams (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, data.name, data.description || '', now, now);

    return this.findById(id)!;
  }

  update(id: string, data: Partial<{ name: string; description: string }>): Team {
    const updates: string[] = [];
    const values: string[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
    values.push(id);

    this.db.prepare(`UPDATE teams SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return this.findById(id)!;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM teams WHERE id = ?').run(id);
  }

  // Team member operations
  getMembers(teamId: string): TeamMember[] {
    return this.db.prepare(
      `SELECT tm.*, u.name as user_name, u.email
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ?
       ORDER BY tm.joined_at DESC`
    ).all(teamId) as TeamMember[];
  }

  getMember(teamId: string, userId: string): TeamMember | undefined {
    return this.db.prepare(
      'SELECT * FROM team_members WHERE team_id = ? AND user_id = ?'
    ).get(teamId, userId) as TeamMember | undefined;
  }

  addMember(teamId: string, userId: string, role: 'viewer' | 'editor' | 'admin' = 'viewer'): TeamMember {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO team_members (id, team_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, teamId, userId, role, now);

    return this.getMember(teamId, userId)!;
  }

  removeMember(teamId: string, userId: string): void {
    this.db.prepare(
      'DELETE FROM team_members WHERE team_id = ? AND user_id = ?'
    ).run(teamId, userId);
  }

  updateMemberRole(teamId: string, userId: string, role: 'viewer' | 'editor' | 'admin'): void {
    this.db.prepare(
      'UPDATE team_members SET role = ? WHERE team_id = ? AND user_id = ?'
    ).run(role, teamId, userId);
  }

  getTeamsForUser(userId: string): Team[] {
    return this.db.prepare(
      `SELECT t.* FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = ?
       ORDER BY t.created_at DESC`
    ).all(userId) as Team[];
  }
}

let teamRepository: TeamRepository | null = null;

export function getTeamRepository(): TeamRepository {
  if (!teamRepository) {
    teamRepository = new TeamRepository();
  }
  return teamRepository;
}