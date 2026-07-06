export { BaseRepository, QueryBuilder, Transaction, RepositoryOptions } from './base-repository';
export { TaskRepository } from './task-repository';
export { ListRepository } from './list-repository';
export { LabelRepository } from './label-repository';
export { UserRepository } from './user-repository';
export { SubtaskRepository } from './subtask-repository';
export { TimeEntryRepository } from './time-entry-repository';
export { TeamRepository } from './team-repository';
export { ThemeRepository } from './theme-repository';
export { GoalRepository } from './goal-repository';
export { CommentRepository } from './comment-repository';
export { PushSubscriptionRepository } from './push-subscription-repository';
export { SessionRepository } from './session-repository';
export { RefreshTokenRepository } from './refresh-token-repository';
export { TaskShareRepository } from './task-share-repository';
export { ListShareRepository } from './list-share-repository';
export { TaskDependencyRepository } from './task-dependency-repository';
export { CommentMentionRepository } from './comment-mention-repository';
export { HabitStreakRepository } from './habit-streak-repository';
export { RecurringExceptionRepository } from './recurring-exception-repository';

// Singleton instances (lazy initialization)
let _taskRepository: TaskRepository | null = null;
let _listRepository: ListRepository | null = null;
let _labelRepository: LabelRepository | null = null;
let _userRepository: UserRepository | null = null;
let _subtaskRepository: SubtaskRepository | null = null;
let _timeEntryRepository: TimeEntryRepository | null = null;
let _teamRepository: TeamRepository | null = null;
let _themeRepository: ThemeRepository | null = null;
let _goalRepository: GoalRepository | null = null;
let _commentRepository: CommentRepository | null = null;
let _pushSubscriptionRepository: PushSubscriptionRepository | null = null;
let _sessionRepository: SessionRepository | null = null;
let _refreshTokenRepository: RefreshTokenRepository | null = null;
let _taskShareRepository: TaskShareRepository | null = null;
let _listShareRepository: ListShareRepository | null = null;
let _taskDependencyRepository: TaskDependencyRepository | null = null;
let _commentMentionRepository: CommentMentionRepository | null = null;
let _habitStreakRepository: HabitStreakRepository | null = null;
let _recurringExceptionRepository: RecurringExceptionRepository | null = null;

export const taskRepository = () => {
  if (!_taskRepository) _taskRepository = new TaskRepository();
  return _taskRepository;
};
export const listRepository = () => {
  if (!_listRepository) _listRepository = new ListRepository();
  return _listRepository;
};
export const labelRepository = () => {
  if (!_labelRepository) _labelRepository = new LabelRepository();
  return _labelRepository;
};
export const userRepository = () => {
  if (!_userRepository) _userRepository = new UserRepository();
  return _userRepository;
};
export const subtaskRepository = () => {
  if (!_subtaskRepository) _subtaskRepository = new SubtaskRepository();
  return _subtaskRepository;
};
export const timeEntryRepository = () => {
  if (!_timeEntryRepository) _timeEntryRepository = new TimeEntryRepository();
  return _timeEntryRepository;
};
export const teamRepository = () => {
  if (!_teamRepository) _teamRepository = new TeamRepository();
  return _teamRepository;
};
export const themeRepository = () => {
  if (!_themeRepository) _themeRepository = new ThemeRepository();
  return _themeRepository;
};
export const goalRepository = () => {
  if (!_goalRepository) _goalRepository = new GoalRepository();
  return _goalRepository;
};
export const commentRepository = () => {
  if (!_commentRepository) _commentRepository = new CommentRepository();
  return _commentRepository;
};
export const pushSubscriptionRepository = () => {
  if (!_pushSubscriptionRepository) _pushSubscriptionRepository = new PushSubscriptionRepository();
  return _pushSubscriptionRepository;
};
export const sessionRepository = () => {
  if (!_sessionRepository) _sessionRepository = new SessionRepository();
  return _sessionRepository;
};
export const refreshTokenRepository = () => {
  if (!_refreshTokenRepository) _refreshTokenRepository = new RefreshTokenRepository();
  return _refreshTokenRepository;
};
export const taskShareRepository = () => {
  if (!_taskShareRepository) _taskShareRepository = new TaskShareRepository();
  return _taskShareRepository;
};
export const listShareRepository = () => {
  if (!_listShareRepository) _listShareRepository = new ListShareRepository();
  return _listShareRepository;
};
export const taskDependencyRepository = () => {
  if (!_taskDependencyRepository) _taskDependencyRepository = new TaskDependencyRepository();
  return _taskDependencyRepository;
};
export const commentMentionRepository = () => {
  if (!_commentMentionRepository) _commentMentionRepository = new CommentMentionRepository();
  return _commentMentionRepository;
};
export const habitStreakRepository = () => {
  if (!_habitStreakRepository) _habitStreakRepository = new HabitStreakRepository();
  return _habitStreakRepository;
};
export const recurringExceptionRepository = () => {
  if (!_recurringExceptionRepository) _recurringExceptionRepository = new RecurringExceptionRepository();
  return _recurringExceptionRepository;
};