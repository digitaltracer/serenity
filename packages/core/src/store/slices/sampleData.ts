import { Task, Project, JournalEntry } from '../../types';
import { generateId } from '../../utils';

export const sampleProjects: Project[] = [
  {
    id: generateId(),
    name: 'Marketing',
    description: 'Marketing campaigns and content creation',
    color: '#3B82F6',
    icon: '📢',
    archived: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: generateId(),
    name: 'Development',
    description: 'Software development and technical tasks',
    color: '#10B981',
    icon: '💻',
    archived: false,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: generateId(),
    name: 'Design',
    description: 'UI/UX design and creative work',
    color: '#8B5CF6',
    icon: '🎨',
    archived: false,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
];

export const sampleTasks: Task[] = [
  {
    id: generateId(),
    title: 'Review quarterly marketing metrics',
    description: 'Analyze Q4 performance data and prepare insights for the team meeting',
    completed: false,
    priority: 'high',
    dueDate: new Date('2024-12-20'),
    projectId: sampleProjects[0].id,
    tags: ['analysis', 'quarterly'],
    createdAt: new Date('2024-12-15'),
    updatedAt: new Date('2024-12-15'),
  },
  {
    id: generateId(),
    title: 'Update project documentation',
    description: 'Revise API documentation for the new endpoints',
    completed: true,
    priority: 'medium',
    dueDate: new Date('2024-12-23'),
    projectId: sampleProjects[1].id,
    tags: ['documentation', 'api'],
    createdAt: new Date('2024-12-16'),
    updatedAt: new Date('2024-12-17'),
  },
  {
    id: generateId(),
    title: 'Team standup',
    description: 'Daily team sync meeting',
    completed: false,
    priority: 'medium',
    dueDate: new Date(),
    projectId: sampleProjects[1].id,
    tags: ['meeting', 'daily'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: 'Design system color palette',
    description: 'Create a cohesive color scheme for the new design system',
    completed: false,
    priority: 'low',
    projectId: sampleProjects[2].id,
    tags: ['design', 'colors'],
    createdAt: new Date('2024-12-14'),
    updatedAt: new Date('2024-12-14'),
  },
];

export const sampleJournalEntries: JournalEntry[] = [
  {
    id: generateId(),
    title: 'Morning Reflections',
    content: 'Started the day with a 20-minute meditation session. Feeling centered and ready to tackle the challenges ahead. The new...',
    date: new Date('2024-12-16'),
    tags: ['meditation', 'planning'],
    pinned: true,
    mood: 'happy',
    createdAt: new Date('2024-12-16'),
    updatedAt: new Date('2024-12-16'),
  },
  {
    id: generateId(),
    title: 'Team Meeting Insights',
    content: 'Today\'s standup revealed some interesting perspectives on our current sprint. Sarah\'s suggestion about automating the testing...',
    date: new Date('2024-12-17'),
    tags: ['meetings', 'automation'],
    pinned: false,
    mood: 'excited',
    createdAt: new Date('2024-12-17'),
    updatedAt: new Date('2024-12-17'),
  },
  {
    id: generateId(),
    title: 'Weekend Learning Goals',
    content: 'Planning to dive deeper into React 18 features this weekend. Concurrent features and Suspense patterns look particularly...',
    date: new Date('2024-12-16'),
    tags: ['learning', 'react'],
    pinned: false,
    mood: 'excited',
    createdAt: new Date('2024-12-16'),
    updatedAt: new Date('2024-12-16'),
  },
  {
    id: generateId(),
    title: 'Design System Progress',
    content: 'Made significant progress on the component library today. Completed the button variants and input components. The new co...',
    date: new Date('2024-12-15'),
    tags: ['design', 'components'],
    pinned: false,
    mood: 'happy',
    createdAt: new Date('2024-12-15'),
    updatedAt: new Date('2024-12-15'),
  },
];

export const initializeWithSampleData = (dispatch: any) => {
  // Add sample projects
  sampleProjects.forEach(project => {
    dispatch({ type: 'projects/setProjects', payload: sampleProjects });
  });

  // Add sample tasks
  dispatch({ type: 'tasks/setTasks', payload: sampleTasks });

  // Add sample journal entries
  dispatch({ type: 'journal/setEntries', payload: sampleJournalEntries });
};