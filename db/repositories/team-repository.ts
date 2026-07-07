import { BaseRepository } from './base-repository';
import type { Team, TeamMember } from '../../src/types/index';

export class TeamRepository extends BaseRepository<Team> {
  constructor() {
    super('teams', { timestamps: true });
  }

  /**
   * Get teams for a user
   */
  getByUserId(userId: string): Team[] {
    return this.db.prepare(`
      SELECT t.* FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ?
      ORDER BY t.created_at DESC
    `).all(userId) as Team[];
  }

  /**
   * Get team members by team ID
   */
  getMembers(teamId: string): TeamMember[] {
    return this.db.prepare(
      'SELECT * FROM team_members WHERE team_id = ? ORDER BY joined_at DESC'
    ).all(teamId) as TeamMember[];
  }

  /**
   * Add member to team
   */
  addMember(teamId: string, userId: string, role: 'viewer' | 'editor' | 'admin' = 'viewer'): TeamMember {
    const id = this.generateId();
    const now = this.now();
    this.db.prepare(
      'INSERT INTO team_members (id, team_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, teamId, userId, role, now);
    return { id, teamId, userId, role, joinedAt: now };
  }

  /**
   * Remove member from team
   */
  removeMember(teamId: string, userId: string): void {
    this.db.prepare('DELETE FROM team_members WHERE team_id = ? AND user_id = ?').run(teamId, userId);
  }

  /**
   * Update member role
   */
  updateMemberRole(teamId: string, userId: string, role: 'viewer' | 'editor' | 'admin'): TeamMember {
    this.db.prepare('UPDATE team_members SET role = ? WHERE team_id = ? AND user_id = ?').run(role, teamId, userId);
    const member = this.db.prepare(
      'SELECT * FROM team_members WHERE team_id = ? AND user_id = ?'
    ).get(teamId, userId) as TeamMember;
    return member;
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private now(): string {
    return new Date().toISOString();
  }
}