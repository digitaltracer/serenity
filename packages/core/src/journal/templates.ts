export interface JournalTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  tags: string[];
}

export const journalTemplates: JournalTemplate[] = [
  {
    id: 'daily-reflection',
    name: 'Daily Reflection',
    description: 'Reflect on your day and capture key moments',
    content: `<h2>Daily Reflection</h2>
<p><br></p>
<h3>What went well today?</h3>
<p><br></p>
<p><br></p>
<h3>What could have been better?</h3>
<p><br></p>
<p><br></p>
<h3>What did I learn?</h3>
<p><br></p>
<p><br></p>
<h3>Tomorrow's focus</h3>
<p><br></p>
<p><br></p>`,
    tags: ['reflection', 'daily'],
  },
  {
    id: 'gratitude-journal',
    name: 'Gratitude Journal',
    description: 'Practice gratitude and appreciation',
    content: `<h2>Gratitude Journal</h2>
<p><br></p>
<h3>Three things I'm grateful for today:</h3>
<ol>
<li><br></li>
<li><br></li>
<li><br></li>
</ol>
<p><br></p>
<h3>Why am I grateful for these?</h3>
<p><br></p>
<p><br></p>
<h3>Who made a positive impact on my day?</h3>
<p><br></p>
<p><br></p>
<h3>What simple pleasure did I enjoy?</h3>
<p><br></p>
<p><br></p>`,
    tags: ['gratitude', 'positivity'],
  },
  {
    id: 'goal-tracking',
    name: 'Goal Tracking',
    description: 'Track progress towards your goals',
    content: `<h2>Goal Tracking</h2>
<p><br></p>
<h3>Current Goal:</h3>
<p><br></p>
<p><br></p>
<h3>Progress Made Today:</h3>
<ul>
<li><br></li>
<li><br></li>
<li><br></li>
</ul>
<p><br></p>
<h3>Challenges Faced:</h3>
<p><br></p>
<p><br></p>
<h3>Solutions & Next Steps:</h3>
<p><br></p>
<p><br></p>
<h3>How do I feel about my progress?</h3>
<p><br></p>
<p><br></p>`,
    tags: ['goals', 'progress'],
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Capture meeting discussions and action items',
    content: `<h2>Meeting Notes</h2>
<p><br></p>
<h3>Meeting Details</h3>
<p><strong>Date:</strong> </p>
<p><strong>Attendees:</strong> </p>
<p><strong>Purpose:</strong> </p>
<p><br></p>
<h3>Discussion Points:</h3>
<ul>
<li><br></li>
<li><br></li>
<li><br></li>
</ul>
<p><br></p>
<h3>Decisions Made:</h3>
<p><br></p>
<p><br></p>
<h3>Action Items:</h3>
<ol>
<li><br></li>
<li><br></li>
<li><br></li>
</ol>
<p><br></p>
<h3>Next Meeting:</h3>
<p><br></p>`,
    tags: ['meeting', 'work'],
  },
  {
    id: 'weekly-review',
    name: 'Weekly Review',
    description: 'Review your week and plan ahead',
    content: `<h2>Weekly Review</h2>
<p><br></p>
<h3>Week of: </h3>
<p><br></p>
<h3>Highlights of the week:</h3>
<ul>
<li><br></li>
<li><br></li>
<li><br></li>
</ul>
<p><br></p>
<h3>Challenges faced:</h3>
<p><br></p>
<p><br></p>
<h3>Lessons learned:</h3>
<p><br></p>
<p><br></p>
<h3>Goals for next week:</h3>
<ol>
<li><br></li>
<li><br></li>
<li><br></li>
</ol>`,
    tags: ['weekly', 'review'],
  },
  {
    id: 'creative-writing',
    name: 'Creative Writing',
    description: 'Free-form creative expression',
    content: `<h2>Creative Writing</h2>
<p><br></p>
<h3>Today's prompt:</h3>
<blockquote>Write about a moment that changed everything...</blockquote>
<p><br></p>
<h3>Your story:</h3>
<p><br></p>
<p><br></p>
<p><br></p>`,
    tags: ['creative', 'writing'],
  },
  {
    id: 'dream-journal',
    name: 'Dream Journal',
    description: 'Record and reflect on your dreams',
    content: `<h2>Dream Journal</h2>
<p><br></p>
<h3>Date & Time:</h3>
<p><br></p>
<h3>The Dream:</h3>
<p><br></p>
<p><br></p>
<p><br></p>
<h3>Emotions felt:</h3>
<p><br></p>
<h3>Symbols & themes:</h3>
<ul>
<li><br></li>
<li><br></li>
</ul>
<p><br></p>
<h3>Possible meanings:</h3>
<p><br></p>
<p><br></p>`,
    tags: ['dreams', 'reflection'],
  },
  {
    id: 'mood-tracker',
    name: 'Mood Tracker',
    description: 'Track your mood and emotional patterns',
    content: `<h2>Mood Tracker</h2>
<p><br></p>
<h3>Overall mood today:</h3>
<p><br></p>
<h3>Energy level (1-10):</h3>
<p><br></p>
<h3>What influenced my mood:</h3>
<ul>
<li><strong>Positive factors:</strong> </li>
<li><strong>Negative factors:</strong> </li>
</ul>
<p><br></p>
<h3>Physical sensations:</h3>
<p><br></p>
<h3>Coping strategies used:</h3>
<p><br></p>
<p><br></p>`,
    tags: ['mood', 'wellness'],
  },
];

export const getTemplateById = (id: string): JournalTemplate | undefined => {
  return journalTemplates.find(template => template.id === id);
};

export const getTemplatesByTags = (tags: string[]): JournalTemplate[] => {
  return journalTemplates.filter(template =>
    template.tags.some(tag => tags.includes(tag))
  );
};

