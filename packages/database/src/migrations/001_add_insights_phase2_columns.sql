-- Migration: Add Phase 2 columns to ai_insights and ai_recaps tables
-- Date: 2025-10-21
-- Description: Adds user feedback, visualization, and actionability columns for Insights Hub Phase 2

-- Add missing columns to ai_insights table (SQLite allows ALTER TABLE ADD COLUMN)
-- Note: SQLite does not support CHECK constraints in ALTER TABLE, so we add them without constraints

-- Add updated_at if it doesn't exist
ALTER TABLE ai_insights ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Add user feedback fields
ALTER TABLE ai_insights ADD COLUMN user_rating INTEGER;
ALTER TABLE ai_insights ADD COLUMN dismissed INTEGER DEFAULT 0;
ALTER TABLE ai_insights ADD COLUMN marked_helpful INTEGER DEFAULT 0;
ALTER TABLE ai_insights ADD COLUMN user_notes TEXT;

-- Add visualization and actionability fields
ALTER TABLE ai_insights ADD COLUMN visualization_data TEXT;
ALTER TABLE ai_insights ADD COLUMN actionability_suggestions TEXT DEFAULT '[]';

-- Add missing columns to ai_recaps table
ALTER TABLE ai_recaps ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE ai_recaps ADD COLUMN viewed INTEGER DEFAULT 0;
ALTER TABLE ai_recaps ADD COLUMN favorited INTEGER DEFAULT 0;
ALTER TABLE ai_recaps ADD COLUMN exported INTEGER DEFAULT 0;
