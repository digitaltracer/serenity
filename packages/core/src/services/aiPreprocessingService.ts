/**
 * AI Preprocessing Service
 * Intelligent data preprocessing for AI analysis with smart summarization,
 * quality scoring, and temporal weighting
 */

import { Task, JournalEntry } from '../types';
import { logger } from '../utils/logger';

export interface PreprocessedTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  
  // Derived analysis fields
  daysSinceCreated: number;
  isOverdue: boolean;
  completionTime: number | null;
  
  // Enhanced fields
  qualityScore: number;
  temporalWeight: number;
  summary: string;
  keyEntities: string[];
  urgencyScore: number;
}

export interface PreprocessedJournalEntry {
  id: string;
  content: string;
  mood?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Derived analysis fields
  wordCount: number;
  dayOfWeek: number;
  hourOfDay: number;
  
  // Enhanced fields
  qualityScore: number;
  temporalWeight: number;
  summary: string;
  keyThemes: string[];
  emotionalTone: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface PreprocessingConfig {
  maxTaskDescriptionTokens: number;
  maxJournalContentTokens: number;
  temporalDecayDays: number;
  minQualityScore: number;
  prioritizeRecent: boolean;
}

export class AIPreprocessingService {
  private static readonly DEFAULT_CONFIG: PreprocessingConfig = {
    maxTaskDescriptionTokens: 150,
    maxJournalContentTokens: 250,
    temporalDecayDays: 90,
    minQualityScore: 0.3,
    prioritizeRecent: true,
  };

  /**
   * Extract key entities from text (dates, numbers, proper nouns, tags)
   */
  private static extractKeyEntities(text: string, tags: string[] = []): string[] {
    const entities = new Set<string>();
    
    // Add tags
    tags.forEach(tag => entities.add(tag));
    
    // Extract dates (YYYY-MM-DD, MM/DD/YYYY, etc.)
    const datePattern = /\b(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})\b/g;
    const dates = text.match(datePattern);
    if (dates) dates.forEach(d => entities.add(d));
    
    // Extract numbers with units (3 days, 5 hours, $100, etc.)
    const numericPattern = /\b(\d+\s*(?:days?|hours?|weeks?|months?|years?|tasks?|items?|$|%|dollars?))\b/gi;
    const numbers = text.match(numericPattern);
    if (numbers) numbers.forEach(n => entities.add(n.toLowerCase()));
    
    // Extract capitalized words (likely important names/terms)
    const capitalizedPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
    const capitalized = text.match(capitalizedPattern);
    if (capitalized) {
      capitalized
        .filter(word => word.length > 3 && !['This', 'That', 'There', 'When', 'Where'].includes(word))
        .forEach(w => entities.add(w));
    }
    
    return Array.from(entities).slice(0, 10); // Limit to top 10
  }

  /**
   * Calculate temporal weight (recent items get higher weight)
   */
  private static calculateTemporalWeight(date: Date, config: PreprocessingConfig): number {
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (!config.prioritizeRecent) return 1.0;
    
    // Exponential decay: weight = e^(-days / halfLife)
    // halfLife is configured decay period
    const halfLife = config.temporalDecayDays / 2;
    const weight = Math.exp(-daysSince / halfLife);
    
    // Clamp between 0.1 and 1.0
    return Math.max(0.1, Math.min(1.0, weight));
  }

  /**
   * Calculate data quality score based on completeness and richness
   */
  private static calculateTaskQualityScore(task: Task): number {
    let score = 0.5; // Base score
    
    // Title quality
    if (task.title && task.title.length > 5) score += 0.1;
    if (task.title && task.title.length > 15) score += 0.1;
    
    // Description quality
    if (task.description && task.description.length > 20) score += 0.1;
    if (task.description && task.description.length > 100) score += 0.1;
    
    // Metadata completeness
    if (task.dueDate) score += 0.1;
    if (task.tags && task.tags.length > 0) score += 0.1;
    if (task.priority && task.priority !== 'medium') score += 0.1;
    
    // Status information
    if (task.completed && task.completedAt) score += 0.1;
    
    return Math.min(1.0, score);
  }

  /**
   * Calculate journal entry quality score
   */
  private static calculateJournalQualityScore(entry: JournalEntry): number {
    let score = 0.5; // Base score
    
    const wordCount = entry.content ? entry.content.split(/\s+/).length : 0;
    
    // Content quality
    if (wordCount > 20) score += 0.1;
    if (wordCount > 50) score += 0.1;
    if (wordCount > 150) score += 0.1;
    
    // Metadata
    if (entry.mood) score += 0.15;
    if (entry.tags && entry.tags.length > 0) score += 0.1;
    if (entry.tags && entry.tags.length >= 3) score += 0.1;
    
    // Variety of content (indicates thoughtfulness)
    const uniqueWords = new Set(entry.content.toLowerCase().split(/\s+/)).size;
    if (uniqueWords / wordCount > 0.6) score += 0.1;
    
    return Math.min(1.0, score);
  }

  /**
   * Calculate urgency score for tasks
   */
  private static calculateUrgencyScore(task: Task): number {
    let urgency = 0.5; // Base urgency
    
    // Priority-based urgency
    if (task.priority === 'high') urgency += 0.3;
    if (task.priority === 'low') urgency -= 0.2;
    
    // Due date-based urgency
    if (task.dueDate && !task.completed) {
      const now = new Date();
      const dueDate = new Date(task.dueDate);
      const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue < 0) {
        // Overdue - very urgent
        urgency += 0.4;
      } else if (daysUntilDue <= 1) {
        // Due today/tomorrow
        urgency += 0.3;
      } else if (daysUntilDue <= 7) {
        // Due this week
        urgency += 0.2;
      }
    }
    
    // Recently created but incomplete
    const daysSinceCreated = task.createdAt
      ? Math.floor((Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    if (!task.completed && daysSinceCreated > 30) {
      // Long-pending task
      urgency += 0.1;
    }
    
    return Math.max(0.1, Math.min(1.0, urgency));
  }

  /**
   * Detect sentiment in journal entry
   */
  private static detectSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const lowerText = text.toLowerCase();
    
    const positiveWords = [
      'happy', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'good', 
      'accomplished', 'achieved', 'success', 'proud', 'grateful', 'excited', 'love',
      'joy', 'progress', 'better', 'improved', 'win', 'breakthrough'
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'awful', 'difficult', 'hard', 'struggle', 'failed', 
      'frustrated', 'worried', 'anxious', 'stress', 'overwhelming', 'tired',
      'exhausted', 'problem', 'issue', 'challenge', 'setback', 'disappointed'
    ];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });
    
    const diff = positiveCount - negativeCount;
    
    if (diff > 1) return 'positive';
    if (diff < -1) return 'negative';
    return 'neutral';
  }

  /**
   * Extract key themes from journal entry
   */
  private static extractKeyThemes(entry: JournalEntry): string[] {
    const themes = new Set<string>();
    
    // Add explicit tags
    if (entry.tags) {
      entry.tags.forEach(tag => themes.add(tag));
    }
    
    // Add mood as a theme
    if (entry.mood) {
      themes.add(`mood:${entry.mood}`);
    }
    
    // Extract common productivity/reflection themes
    const themeKeywords = {
      work: ['work', 'project', 'task', 'meeting', 'deadline', 'client', 'team'],
      personal: ['family', 'friend', 'relationship', 'home', 'personal'],
      health: ['exercise', 'sleep', 'health', 'fitness', 'energy', 'tired'],
      learning: ['learn', 'study', 'read', 'course', 'skill', 'practice'],
      reflection: ['think', 'realize', 'understand', 'reflect', 'insight', 'notice'],
      goals: ['goal', 'plan', 'achieve', 'accomplish', 'progress', 'target'],
    };
    
    const lowerContent = entry.content.toLowerCase();
    
    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      const matchCount = keywords.filter(kw => lowerContent.includes(kw)).length;
      if (matchCount >= 2) {
        themes.add(theme);
      }
    });
    
    return Array.from(themes).slice(0, 8);
  }

  /**
   * Create smart summary using extractive method
   */
  private static smartSummarize(text: string, maxTokens: number): string {
    if (!text || text.length === 0) return '';
    
    // Approximate: 1 token ≈ 4 characters
    const maxChars = maxTokens * 4;
    
    if (text.length <= maxChars) {
      return text;
    }
    
    // Split into sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 1) {
      // Single long sentence - truncate intelligently
      return text.substring(0, maxChars - 3) + '...';
    }
    
    // Score sentences by importance
    const scoredSentences = sentences.map(sentence => {
      let score = 0;
      
      // Prefer sentences at the beginning (often most important)
      if (sentences.indexOf(sentence) === 0) score += 3;
      if (sentences.indexOf(sentence) === sentences.length - 1) score += 2;
      
      // Prefer sentences with numbers or dates
      if (/\d/.test(sentence)) score += 2;
      
      // Prefer sentences with action words
      const actionWords = ['need', 'must', 'should', 'will', 'plan', 'want', 'going'];
      if (actionWords.some(w => sentence.toLowerCase().includes(w))) score += 2;
      
      // Prefer longer sentences (more information)
      if (sentence.length > 50) score += 1;
      
      return { sentence, score };
    });
    
    // Sort by score and take top sentences
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.sentence);
    
    // Join and trim to max length
    let summary = topSentences.join('. ').trim();
    
    if (summary.length > maxChars) {
      summary = summary.substring(0, maxChars - 3) + '...';
    }
    
    return summary;
  }

  /**
   * Preprocess tasks with enhanced intelligence
   */
  static preprocessTasks(
    tasks: Task[],
    config: Partial<PreprocessingConfig> = {}
  ): PreprocessedTask[] {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    return tasks
      .map(task => {
        const daysSinceCreated = task.createdAt
          ? Math.floor((Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        
        const isOverdue = task.dueDate && !task.completed
          ? new Date(task.dueDate) < new Date()
          : false;
        
        const completionTime = task.completed && task.updatedAt && task.createdAt
          ? Math.floor(
              (new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null;
        
        const qualityScore = this.calculateTaskQualityScore(task);
        const temporalWeight = this.calculateTemporalWeight(
          task.updatedAt ? new Date(task.updatedAt) : new Date(task.createdAt),
          finalConfig
        );
        const urgencyScore = this.calculateUrgencyScore(task);
        
        // Smart summarization
        const fullText = `${task.title}. ${task.description || ''}`;
        const summary = this.smartSummarize(fullText, finalConfig.maxTaskDescriptionTokens);
        const keyEntities = this.extractKeyEntities(fullText, task.tags);
        
        return {
          id: task.id,
          title: task.title,
          description: summary,
          completed: task.completed,
          priority: task.priority,
          tags: task.tags || [],
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          dueDate: task.dueDate,
          daysSinceCreated,
          isOverdue,
          completionTime,
          qualityScore,
          temporalWeight,
          summary,
          keyEntities,
          urgencyScore,
        };
      })
      .filter(task => task.qualityScore >= finalConfig.minQualityScore)
      .sort((a, b) => {
        // Sort by composite score (quality * temporal * urgency)
        const scoreA = a.qualityScore * a.temporalWeight * (a.urgencyScore || 0.5);
        const scoreB = b.qualityScore * b.temporalWeight * (b.urgencyScore || 0.5);
        return scoreB - scoreA;
      });
  }

  /**
   * Preprocess journal entries with enhanced intelligence
   */
  static preprocessJournalEntries(
    entries: JournalEntry[],
    config: Partial<PreprocessingConfig> = {}
  ): PreprocessedJournalEntry[] {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    return entries
      .map(entry => {
        const wordCount = entry.content ? entry.content.split(/\s+/).length : 0;
        const createdDate = new Date(entry.createdAt);
        const dayOfWeek = createdDate.getDay();
        const hourOfDay = createdDate.getHours();
        
        const qualityScore = this.calculateJournalQualityScore(entry);
        const temporalWeight = this.calculateTemporalWeight(createdDate, finalConfig);
        
        // Smart summarization
        const summary = this.smartSummarize(entry.content, finalConfig.maxJournalContentTokens);
        const keyThemes = this.extractKeyThemes(entry);
        const sentiment = this.detectSentiment(entry.content);
        const emotionalTone = entry.mood || sentiment;
        
        return {
          id: entry.id,
          content: summary,
          mood: entry.mood,
          tags: entry.tags || [],
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          wordCount,
          dayOfWeek,
          hourOfDay,
          qualityScore,
          temporalWeight,
          summary,
          keyThemes,
          emotionalTone,
          sentiment,
        };
      })
      .filter(entry => entry.qualityScore >= finalConfig.minQualityScore)
      .sort((a, b) => {
        // Sort by composite score (quality * temporal)
        const scoreA = a.qualityScore * a.temporalWeight;
        const scoreB = b.qualityScore * b.temporalWeight;
        return scoreB - scoreA;
      });
  }

  /**
   * Prepare data summary for prompt context
   */
  static prepareDataSummary(
    preprocessedTasks: PreprocessedTask[],
    preprocessedEntries: PreprocessedJournalEntry[]
  ): string {
    const summary = {
      overview: {
        totalTasks: preprocessedTasks.length,
        completedTasks: preprocessedTasks.filter(t => t.completed).length,
        overdueTasks: preprocessedTasks.filter(t => t.isOverdue).length,
        highPriorityTasks: preprocessedTasks.filter(t => t.priority === 'high').length,
        journalEntries: preprocessedEntries.length,
        avgWordCount:
          preprocessedEntries.length > 0
            ? Math.round(
                preprocessedEntries.reduce((sum, e) => sum + e.wordCount, 0) /
                  preprocessedEntries.length
              )
            : 0,
      },
      patterns: {
        commonTags: this.getTopItems(
          [...preprocessedTasks, ...preprocessedEntries]
            .flatMap(item => item.tags)
            .filter(Boolean),
          5
        ),
        keyThemes: this.getTopItems(
          preprocessedEntries.flatMap(e => e.keyThemes),
          5
        ),
        sentimentDistribution: {
          positive: preprocessedEntries.filter(e => e.sentiment === 'positive').length,
          neutral: preprocessedEntries.filter(e => e.sentiment === 'neutral').length,
          negative: preprocessedEntries.filter(e => e.sentiment === 'negative').length,
        },
      },
      temporal: {
        recentTasks: preprocessedTasks.filter(t => t.daysSinceCreated <= 7).length,
        staleTasks: preprocessedTasks.filter(t => !t.completed && t.daysSinceCreated > 30).length,
        recentEntries: preprocessedEntries.filter(
          e => Math.floor((Date.now() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60 * 24)) <= 7
        ).length,
      },
    };
    
    return JSON.stringify(summary, null, 2);
  }

  /**
   * Helper to get top N items by frequency
   */
  private static getTopItems(items: string[], topN: number): string[] {
    const counts = new Map<string, number>();
    items.forEach(item => {
      counts.set(item, (counts.get(item) || 0) + 1);
    });
    
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([item]) => item);
  }
}

export default AIPreprocessingService;

