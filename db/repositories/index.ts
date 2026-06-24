export { BaseRepository } from './base-repository';
export { TaskRepository } from './task-repository';
export { ListRepository } from './list-repository';
export { LabelRepository } from './label-repository';
export { UserRepository } from './user-repository';
export { SubtaskRepository } from './subtask-repository';

// Singleton instances (lazy initialization)
let _taskRepository: TaskRepository | null = null;
let _listRepository: ListRepository | null = null;
let _labelRepository: LabelRepository | null = null;
let _userRepository: UserRepository | null = null;
let _subtaskRepository: SubtaskRepository | null = null;

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