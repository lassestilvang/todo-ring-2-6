import type { Meta, StoryObj } from '@storybook/react';
import { TaskCard } from './TaskCard';

const meta: Meta<typeof TaskCard> = {
  title: 'Components/TaskCard',
  component: TaskCard,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    priority: {
      control: 'select',
      options: ['high', 'medium', 'low', 'none'],
    },
    status: {
      control: 'select',
      options: ['pending', 'in_progress', 'completed', 'cancelled'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleTask = {
  id: 'task-1',
  title: 'Complete project documentation',
  description: 'Write comprehensive documentation for the TaskPlanner API and components',
  status: 'pending',
  priority: 'high',
  date: '2024-01-15',
  assigneeName: 'John Doe',
};

export const Default: Story = {
  args: {
    task: sampleTask,
  },
};

export const Completed: Story = {
  args: {
    task: {
      ...sampleTask,
      status: 'completed',
    },
  },
};

export const InProgress: Story = {
  args: {
    task: {
      ...sampleTask,
      status: 'in_progress',
      priority: 'medium',
    },
  },
};

export const HighPriority: Story = {
  args: {
    task: {
      ...sampleTask,
      priority: 'high',
      status: 'pending',
    },
  },
};

export const WithDescription: Story = {
  args: {
    task: {
      ...sampleTask,
      description: 'This is a longer description that demonstrates how the task card handles multi-line text content and shows the truncation behavior when the description is too long.',
    },
  },
};