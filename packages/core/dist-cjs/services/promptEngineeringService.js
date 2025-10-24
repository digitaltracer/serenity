"use strict";
/**
 * Prompt Engineering Service
 * Advanced prompt generation with context injection, few-shot examples,
 * and chain-of-thought reasoning for better AI insights
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptEngineeringService = void 0;
class PromptEngineeringService {
    /**
     * Generate system prompt with rich context
     */
    static generateSystemPrompt(context) {
        let prompt = `You are an expert productivity and well-being coach with deep expertise in behavioral psychology, time management, and personal development.

Your role is to analyze user data and generate highly personalized, actionable insights that help users:
- Improve productivity without burnout
- Build sustainable habits
- Achieve their goals
- Maintain well-being and work-life balance

CRITICAL GUIDELINES:
1. Insights must be SPECIFIC and ACTIONABLE - always include concrete next steps
2. Insights must be PERSONALIZED - reference user's actual data, patterns, and context
3. Insights must be CONSTRUCTIVE - focus on growth, not criticism
4. Insights must be REALISTIC - suggest achievable changes, not overwhelming overhauls
5. Confidence scores should reflect data quality and pattern strength

OUTPUT FORMAT:
- Respond with ONLY valid JSON
- No code fences (\`\`\`json), no markdown, no explanatory text
- Follow the exact schema provided below`;
        // Add user context
        if (context) {
            prompt += '\n\nUSER CONTEXT:';
            if (context.userGoals && context.userGoals.length > 0) {
                prompt += `\n- Active Goals: ${context.userGoals.map(g => g.title).join(', ')}`;
            }
            if (context.focusAreas && context.focusAreas.length > 0) {
                prompt += `\n- Current Focus Areas: ${context.focusAreas.join(', ')}`;
            }
            if (context.workStyle) {
                const styleDescriptions = {
                    sprinter: 'prefers short bursts of intense work',
                    marathon: 'prefers steady, sustained effort',
                    balanced: 'balances intense work with regular breaks',
                };
                prompt += `\n- Work Style: ${styleDescriptions[context.workStyle]}`;
            }
            if (context.previousInsights && context.previousInsights.length > 0) {
                prompt += `\n- Recent Insights Already Provided: ${context.previousInsights.map(i => i.title).join('; ')}`;
                prompt += '\n  (Avoid repeating these insights unless new data shows significant change)';
            }
            if (context.currentPriorities && context.currentPriorities.length > 0) {
                prompt += `\n- Current Priorities: ${context.currentPriorities.join(', ')}`;
            }
            if (context.timeframe) {
                prompt += `\n- Analysis Timeframe: ${context.timeframe}`;
            }
            if (context.userPreferences) {
                if (context.userPreferences.communicationStyle === 'concise') {
                    prompt += '\n- Communication Preference: Concise (keep descriptions brief and to-the-point)';
                }
                else {
                    prompt += '\n- Communication Preference: Detailed (provide thorough explanations and context)';
                }
            }
        }
        return prompt;
    }
    /**
     * Generate few-shot examples section
     */
    static generateFewShotPrompt() {
        let prompt = '\n\nEXAMPLES OF HIGH-QUALITY INSIGHTS:\n\n';
        this.INSIGHT_EXAMPLES.forEach((example, index) => {
            prompt += `Example ${index + 1}:\n`;
            prompt += `Input: ${example.input}\n`;
            prompt += `Output: ${example.output}\n\n`;
        });
        prompt +=
            'Note: Your insights should match this level of specificity, actionability, and personalization.\n';
        return prompt;
    }
    /**
     * Generate JSON schema specification
     */
    static generateSchemaPrompt() {
        return `

JSON SCHEMA (strictly follow this structure):
{
  "insights": [
    {
      "type": "productivity" | "behavior" | "recommendation" | "warning",
      "title": "Brief, compelling title (max 80 chars)",
      "description": "Detailed, actionable explanation with specific next steps",
      "confidence": 0.0-1.0,
      "category": "tasks" | "journal" | "habits" | "goals",
      "actionable": boolean,
      "metadata": {
        "relevantData": "any relevant metrics or context",
        "nextSteps": ["step 1", "step 2"],
        "impact": "high" | "medium" | "low"
      }
    }
  ]
}`;
    }
    /**
     * Generate chain-of-thought prompt for deeper analysis
     */
    static generateChainOfThoughtPrompt() {
        return `

ANALYSIS PROCESS (think through these before generating insights):
1. PATTERNS: What patterns or trends are evident in the data?
2. CONTEXT: How do these patterns relate to the user's goals and priorities?
3. INSIGHTS: What specific, actionable insights can help the user improve?
4. IMPACT: Which insights will have the highest impact on productivity and well-being?
5. PRIORITIZATION: Order insights by impact and urgency.

After thinking through these steps, provide your final insights in the JSON format specified above.`;
    }
    /**
     * Generate comprehensive analysis prompt for tasks and journal
     */
    static generateInsightPrompt(data) {
        let prompt = this.generateSystemPrompt(data.context);
        prompt += this.generateFewShotPrompt();
        prompt += this.generateSchemaPrompt();
        prompt += this.generateChainOfThoughtPrompt();
        // Add data summary for quick overview
        if (data.dataSummary) {
            prompt += `\n\nDATA SUMMARY:\n${data.dataSummary}\n`;
        }
        // Add detailed data
        prompt += '\n\nDETAILED DATA FOR ANALYSIS:\n\n';
        if (data.dataTypes.includes('tasks') && data.tasks.length > 0) {
            prompt += '=== TASKS ===\n';
            prompt += JSON.stringify(data.tasks.map(t => ({
                id: t.id,
                title: t.title,
                description: t.summary,
                completed: t.completed,
                priority: t.priority,
                tags: t.tags,
                dueDate: t.dueDate,
                daysSinceCreated: t.daysSinceCreated,
                isOverdue: t.isOverdue,
                completionTime: t.completionTime,
                urgencyScore: t.urgencyScore,
                keyEntities: t.keyEntities,
            })), null, 2);
            prompt += '\n\n';
        }
        if (data.dataTypes.includes('journal') && data.journalEntries.length > 0) {
            prompt += '=== JOURNAL ENTRIES ===\n';
            prompt += JSON.stringify(data.journalEntries.map(e => ({
                id: e.id,
                content: e.summary,
                mood: e.mood,
                tags: e.tags,
                createdAt: e.createdAt,
                wordCount: e.wordCount,
                dayOfWeek: e.dayOfWeek,
                hourOfDay: e.hourOfDay,
                sentiment: e.sentiment,
                keyThemes: e.keyThemes,
                emotionalTone: e.emotionalTone,
            })), null, 2);
            prompt += '\n\n';
        }
        prompt += `\n\nNow, analyze this data and generate 3-7 high-quality insights following the guidelines and format above.
Focus on the most impactful patterns and actionable recommendations.
Respond with ONLY the JSON object - no additional text or formatting.`;
        return prompt;
    }
    /**
     * Generate recap prompt with enhanced context
     */
    static generateRecapPrompt(data) {
        const timeframe = data.type === 'weekly' ? 'week' : 'month';
        let prompt = `You are a thoughtful productivity coach creating a personalized ${timeframe}ly recap.

GOAL: Create an insightful, encouraging recap that helps the user:
- Celebrate accomplishments and progress
- Understand productivity patterns
- Learn from challenges
- Plan improvements for next ${timeframe}

TONE: Warm, constructive, and motivating - acknowledge both wins and areas for growth.

`;
        // Add context
        if (data.context) {
            prompt += 'USER CONTEXT:\n';
            if (data.context.userGoals && data.context.userGoals.length > 0) {
                prompt += `- Goals: ${data.context.userGoals.map(g => `${g.title} (${Math.round((g.progress?.percentage || 0) * 100)}% complete)`).join(', ')}\n`;
            }
            if (data.context.focusAreas && data.context.focusAreas.length > 0) {
                prompt += `- Focus Areas: ${data.context.focusAreas.join(', ')}\n`;
            }
            prompt += '\n';
        }
        // Add data summary
        if (data.dataSummary) {
            prompt += `DATA SUMMARY:\n${data.dataSummary}\n\n`;
        }
        // Add task data
        prompt += `TASKS (${data.period.start} to ${data.period.end}):\n`;
        prompt += JSON.stringify(data.tasks.map(t => ({
            title: t.title,
            completed: t.completed,
            priority: t.priority,
            tags: t.tags,
            completionTime: t.completionTime,
            isOverdue: t.isOverdue,
        })), null, 2);
        // Add journal data
        prompt += `\n\nJOURNAL ENTRIES:\n`;
        prompt += JSON.stringify(data.journalEntries.map(e => ({
            content: e.summary,
            sentiment: e.sentiment,
            keyThemes: e.keyThemes,
            dayOfWeek: e.dayOfWeek,
        })), null, 2);
        prompt += `\n\nJSON OUTPUT SCHEMA:
{
  "title": "Week/Month of [Date Range]",
  "summary": "2-3 sentence overall summary highlighting key theme of this period",
  "highlights": [
    "Specific achievement 1 with numbers/details",
    "Specific achievement 2 with numbers/details",
    "Specific achievement 3 with numbers/details"
  ],
  "challenges": [
    "Specific challenge 1 with context",
    "Specific challenge 2 with context"
  ],
  "recommendations": [
    "Specific, actionable recommendation 1",
    "Specific, actionable recommendation 2",
    "Specific, actionable recommendation 3"
  ],
  "metrics": {
    "tasksCompleted": number,
    "completionRate": percentage,
    "mostProductiveDay": "day name",
    "topCategories": ["category1", "category2"],
    "sentimentTrend": "improving" | "stable" | "declining",
    "momentumScore": 0-100
  }
}

Generate the recap in the exact JSON format above. Be specific, encouraging, and actionable.
Respond with ONLY the JSON object - no code fences, no additional text.`;
        return prompt;
    }
    /**
     * Optimize prompt for token efficiency
     */
    static optimizePromptTokens(prompt, maxTokens) {
        // Approximate: 1 token ≈ 4 characters
        const maxChars = maxTokens * 4;
        if (prompt.length <= maxChars) {
            return prompt;
        }
        // Strategy: Keep system prompt and schema, compress data
        const systemPromptEnd = prompt.indexOf('DETAILED DATA FOR ANALYSIS:');
        if (systemPromptEnd === -1)
            return prompt.substring(0, maxChars);
        const systemSection = prompt.substring(0, systemPromptEnd);
        const dataSection = prompt.substring(systemPromptEnd);
        // Compress data section
        const availableDataChars = maxChars - systemSection.length - 500; // Reserve 500 for closing
        const compressedData = dataSection.substring(0, availableDataChars);
        return systemSection + compressedData + '\n\nAnalyze the provided data and generate insights.';
    }
    /**
     * Generate targeted prompt for specific insight type
     */
    static generateTargetedPrompt(type, data) {
        const basePrompt = this.generateSystemPrompt(data.context);
        const typeSpecificGuidance = {
            productivity: `Focus on: task completion patterns, time management, priority handling, procrastination indicators, workflow efficiency`,
            habits: `Focus on: recurring patterns, consistency, routine optimization, time-of-day preferences, behavioral trends`,
            wellbeing: `Focus on: stress indicators, work-life balance, emotional patterns from journal, burnout risks, positive momentum`,
            goals: `Focus on: progress toward goals, alignment of tasks with objectives, goal prioritization, achievement patterns`,
        };
        return `${basePrompt}

SPECIFIC FOCUS: ${type.toUpperCase()}
${typeSpecificGuidance[type]}

${this.generateSchemaPrompt()}

DATA:
Tasks: ${JSON.stringify(data.tasks.slice(0, 20))}
Journal: ${JSON.stringify(data.journalEntries.slice(0, 10))}

Generate 2-4 high-quality ${type}-focused insights in JSON format.`;
    }
}
exports.PromptEngineeringService = PromptEngineeringService;
/**
 * High-quality few-shot examples for insights
 */
PromptEngineeringService.INSIGHT_EXAMPLES = [
    {
        input: `User has 8 overdue tasks, mostly high-priority. Completion rate is 45%. Recent journal entries show mentions of "overwhelmed" and "too much".`,
        output: JSON.stringify({
            insights: [
                {
                    type: 'warning',
                    title: 'Task overload detected',
                    description: 'You have 8 overdue high-priority tasks, and your journal entries indicate feeling overwhelmed. This suggests you may have taken on too much. Consider: 1) Review each overdue task and reschedule non-critical ones, 2) Delegate where possible, 3) Focus on completing just 2-3 high-impact tasks this week.',
                    confidence: 0.85,
                    category: 'tasks',
                    actionable: true,
                    metadata: {
                        overdueCount: 8,
                        completionRate: 45,
                        nextSteps: [
                            'Review and prioritize overdue tasks',
                            'Reschedule or delegate 3-4 non-critical tasks',
                            'Focus on 2-3 high-impact items',
                        ],
                    },
                },
            ],
        }),
    },
    {
        input: `User completes most tasks between 9-11am. Journal entries written at 10pm are more reflective and thoughtful. Tags show "design" appearing 15 times recently.`,
        output: JSON.stringify({
            insights: [
                {
                    type: 'productivity',
                    title: 'Morning hours are your power time',
                    description: 'Analysis shows you complete 60% of your tasks between 9-11am, suggesting this is your peak productivity window. Recommendation: Block 9-11am daily for your most important or challenging work. Save meetings and administrative tasks for afternoons.',
                    confidence: 0.9,
                    category: 'habits',
                    actionable: true,
                    metadata: {
                        peakHours: [9, 10, 11],
                        completionRate: 60,
                        suggestion: 'time-blocking',
                    },
                },
                {
                    type: 'behavior',
                    title: 'Design work is becoming a central theme',
                    description: '"Design" appears frequently in your tasks and journal. Consider: 1) Creating a dedicated "Design" project to organize this work, 2) Allocating specific time blocks for design tasks, 3) Setting a design-related goal to track progress.',
                    confidence: 0.75,
                    category: 'habits',
                    actionable: true,
                    metadata: {
                        theme: 'design',
                        frequency: 15,
                    },
                },
            ],
        }),
    },
    {
        input: `User completed 12 tasks this week (up from 8 last week). Journal shows positive sentiment increasing. Goal progress: 75% toward "Complete 10 tasks weekly".`,
        output: JSON.stringify({
            insights: [
                {
                    type: 'productivity',
                    title: 'Strong momentum: 50% productivity increase',
                    description: 'Excellent work! You completed 12 tasks this week, a 50% increase from last week. Your journal sentiment is also trending positive. You\'re at 75% toward your weekly goal. Keep this momentum by: 1) Maintaining your current routine, 2) Identifying what changed this week, 3) Celebrating this progress.',
                    confidence: 0.95,
                    category: 'goals',
                    actionable: true,
                    metadata: {
                        thisWeek: 12,
                        lastWeek: 8,
                        improvement: 50,
                        goalProgress: 75,
                    },
                },
            ],
        }),
    },
];
exports.default = PromptEngineeringService;
