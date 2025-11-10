"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseQuickInput = parseQuickInput;
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
function clampDateToLocalNoon(d) {
    const nd = new Date(d);
    nd.setHours(12, 0, 0, 0);
    return nd;
}
function nextWeekday(target) {
    const today = new Date();
    const day = today.getDay();
    let diff = (target + 7 - day) % 7;
    if (diff === 0)
        diff = 7; // next, not today
    const dt = new Date();
    dt.setDate(today.getDate() + diff);
    return clampDateToLocalNoon(dt);
}
function parseExplicitDate(s) {
    // Try YYYY-MM-DD
    const m1 = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m1) {
        const d = new Date(Number(m1[1]), Number(m1[2]) - 1, Number(m1[3]));
        if (!isNaN(d.getTime()))
            return clampDateToLocalNoon(d);
    }
    // Try Month Day[, Year]
    const m2 = s.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:,?\s*(\d{4}))?/i);
    if (m2) {
        const monthStr = m2[1].toLowerCase();
        const monthMap = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'];
        let month = monthMap.indexOf(monthStr);
        // Handle September special case properly
        if (month === -1 && monthStr === 'sept') {
            month = 8; // September is index 8
        }
        if (month !== -1) {
            const day = Number(m2[2]);
            const year = m2[3] ? Number(m2[3]) : new Date().getFullYear();
            const d = new Date(year, month, day);
            if (!isNaN(d.getTime()))
                return clampDateToLocalNoon(d);
        }
    }
    // Try day/month formats like "15/3" or "15/03/2024"
    const m3 = s.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
    if (m3) {
        const day = Number(m3[1]);
        const month = Number(m3[2]) - 1; // Month is 0-indexed
        let year = m3[3] ? Number(m3[3]) : new Date().getFullYear();
        // Handle 2-digit years
        if (year < 100) {
            year += year < 50 ? 2000 : 1900;
        }
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime()))
            return clampDateToLocalNoon(d);
    }
    return undefined;
}
function parseRelativeDate(s) {
    const text = s.toLowerCase();
    // Today variations
    if (/\b(today|eod|now)\b/.test(text))
        return clampDateToLocalNoon(new Date());
    // Tomorrow variations
    if (/\b(tomorrow|tmr|tmrw)\b/.test(text)) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return clampDateToLocalNoon(d);
    }
    // Yesterday (for journal entries)
    if (/\b(yesterday|ytd)\b/.test(text)) {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return clampDateToLocalNoon(d);
    }
    // This/next week
    if (/\b(this|next)\s+week\b/.test(text)) {
        const d = new Date();
        const offset = text.includes('next') ? 7 : 0;
        d.setDate(d.getDate() + 7 - d.getDay() + offset); // Next Sunday
        return clampDateToLocalNoon(d);
    }
    // In X days/weeks/months
    const mIn = text.match(/\bin\s+(\d+)\s*(day|days|week|weeks|month|months)\b/);
    if (mIn) {
        const n = Number(mIn[1]);
        const unit = mIn[2];
        const d = new Date();
        if (unit.startsWith('week')) {
            d.setDate(d.getDate() + 7 * n);
        }
        else if (unit.startsWith('month')) {
            d.setMonth(d.getMonth() + n);
        }
        else {
            d.setDate(d.getDate() + n);
        }
        return clampDateToLocalNoon(d);
    }
    // Next/this weekday
    const mNext = text.match(/\b(next|this)\s+(mon|monday|tue|tuesday|wed|wednesday|thu|thursday|fri|friday|sat|saturday|sun|sunday)\b/);
    if (mNext) {
        const dayName = mNext[2];
        const fullDay = dayName.length === 3 ?
            ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].indexOf(dayName)] :
            dayName;
        const fullDayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const idx = fullDayNames.indexOf(fullDay.length === 3 ?
            ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(dayName)] :
            fullDay);
        if (idx >= 0) {
            const today = new Date();
            const currentDay = today.getDay();
            let diff = (idx - currentDay + 7) % 7;
            if (mNext[1] === 'this' && diff === 0) {
                diff = 0; // This [weekday] means today if it's the same day
            }
            else if (mNext[1] === 'next' || diff === 0) {
                diff = diff === 0 ? 7 : diff; // Next [weekday] means next occurrence
            }
            const d = new Date();
            d.setDate(today.getDate() + diff);
            return clampDateToLocalNoon(d);
        }
    }
    return parseExplicitDate(text);
}
function detectPriority(s) {
    const text = s.toLowerCase();
    // High priority indicators
    if (/(p1|high|urgent|asap|!!!|\bcritical\b|\bimportant\b|\btop\s+priority\b|\basap\b)/.test(text)) {
        return 'high';
    }
    // Medium priority indicators
    if (/(p2|medium|!!|\bnormal\b|\bstandard\b)/.test(text)) {
        return 'medium';
    }
    // Low priority indicators
    if (/(p3|low|!\b|\bminor\b|\bwhen\s+i\s+have\s+time\b|\blater\b|\bsomeday\b)/.test(text)) {
        return 'low';
    }
    return undefined;
}
function extractTags(s) {
    const tags = new Set();
    // Enhanced regex to support more tag formats
    const re = /#([a-z0-9_-]+|\d+[a-z0-9_-]*|[a-z][a-z0-9_-]*)/gi;
    let m;
    while ((m = re.exec(s))) {
        const tag = m[1].toLowerCase();
        // Filter out tags that are too short or just numbers
        if (tag.length > 1 && !/^\d+$/.test(tag)) {
            tags.add(tag);
        }
    }
    return Array.from(tags);
}
function extractProject(s) {
    // Look for patterns like "for project X", "in project X", "project: X"
    // Note: Keep original case for project names, but search case-insensitive
    const projectPatterns = [
        /\b(?:for|in)\s+(?:project|proj)\s+"([^"]+)"/i, // "for project 'name with spaces'"
        /\b(?:for|in)\s+(?:project|proj)\s+'([^']+)'/i, // "for project 'name with spaces'"
        /\b(?:for|in)\s+(?:project|proj)\s+([a-z0-9_-]+)/i, // "for project name"
        /\bproject[:\s]+"([^"]+)"/i, // "project: 'name'"
        /\bproject[:\s]+'([^']+)'/i, // "project: 'name'"
        /\bproject[:\s]+([a-z0-9_\s-]+?)(?:\s|$|#|!)/i, // "project: name with spaces"
        /\[@([^\]]+)\]/i, // [@project name] format
        /\b(?:under|within)\s+([a-z0-9_\s-]+?)(?:\s|$|#|!)/i, // "under project name"
    ];
    for (const pattern of projectPatterns) {
        const match = s.match(pattern);
        if (match && match[1]) {
            const projectName = match[1].trim();
            // Don't return very short or common words as project names
            if (projectName.length > 1 && !/^(a|an|the|and|or|but|in|on|at|to|for|of|with|by)$/i.test(projectName)) {
                return projectName;
            }
        }
    }
    return undefined;
}
function stripControlPhrases(s) {
    let out = s
        // Strip entry type indicators
        .replace(/\b(journal|note|log)\b[:,-]?\s*/i, '')
        // Strip due date phrases - enhanced to handle more patterns
        .replace(/\b(by|due|on|before|until)\s+[^#]*?(?=\s*(?:#|\b(?:p1|p2|p3|high|medium|low|urgent|priority|project)\b|$))/i, '')
        // Strip tags
        .replace(/#([a-z0-9_-]+)/gi, '')
        // Strip priority indicators - enhanced
        .replace(/\b(p1|p2|p3|high|medium|low|urgent|priority|important|critical|asap|normal|standard|minor|later|someday)\b/gi, '')
        // Strip date references - enhanced
        .replace(/\b(today|tomorrow|tmr|tmrw|yesterday|ytd|now|eod|this\s+week|next\s+week)/gi, '')
        .replace(/\b(next|this)\s+(mon|monday|tue|tuesday|wed|wednesday|thu|thursday|fri|friday|sat|saturday|sun|sunday)\b/gi, '')
        .replace(/\bin\s+\d+\s+(day|days|week|weeks|month|months)\b/gi, '')
        // Strip project references - enhanced to handle quoted names
        .replace(/\b(?:for|in|under|within)\s+(?:project|proj)\s+"[^"]+"/gi, '')
        .replace(/\b(?:for|in|under|within)\s+(?:project|proj)\s+'[^']+'/gi, '')
        .replace(/\b(?:for|in|under|within)\s+(?:project|proj)\s+[a-z0-9_-]+/gi, '')
        .replace(/\bproject[:\s]+"[^"]+"/gi, '')
        .replace(/\bproject[:\s]+'[^']+'/gi, '')
        .replace(/\bproject[:\s]+[a-z0-9_\s-]+?(?=\s|$|#|!)/gi, '')
        .replace(/\[@[^\]]+\]/gi, '')
        // Clean up extra whitespace
        .replace(/\s{2,}/g, ' ');
    return out.trim();
}
function decideKind(s) {
    const t = s.toLowerCase();
    // Strong journal indicators
    if (/^(journal|note|log|dear\s+diary|reflection|thoughts?)\b/.test(t)) {
        return 'journal';
    }
    // Journal content patterns
    if (/\b(journal|note|log|reflection|thoughts?|feeling|felt|remember|today\s+was|yesterday\s+was)\b/.test(t) && !/\b(task|todo|remind|do|buy|call|email|meeting)\b/.test(t)) {
        return 'journal';
    }
    // Strong task indicators override journal detection
    if (/\b(task|todo|remind|do|buy|call|email|meeting|appointment|deadline|schedule)\b/.test(t)) {
        return 'task';
    }
    // Default to task for action-oriented language
    if (/\b(need\s+to|have\s+to|must|should|will|going\s+to)\b/.test(t)) {
        return 'task';
    }
    return 'task';
}
function parseQuickInput(input) {
    const raw = input.trim();
    const kind = decideKind(raw);
    // due phrase heuristics
    let due;
    const duePhraseMatch = raw.match(/\b(?:by|due|on)\b\s+([^#]+?)(?=$|#|\bpriority\b|p[123]\b)/i);
    if (duePhraseMatch) {
        due = parseRelativeDate(duePhraseMatch[1]);
    }
    else {
        // also allow bare relative date words
        due = parseRelativeDate(raw);
    }
    const priority = detectPriority(raw) ?? 'medium';
    const tags = extractTags(raw);
    const project = extractProject(raw);
    const cleaned = stripControlPhrases(raw);
    if (kind === 'journal') {
        const entry = {
            title: undefined,
            content: cleaned || raw,
            date: new Date(),
            tags,
            pinned: false,
        };
        return { kind: 'journal', entry, debug: { due, priority, project } };
    }
    const task = {
        title: cleaned || raw,
        description: undefined,
        completed: false,
        priority,
        dueDate: due,
        projectId: undefined,
        tags,
        subtasks: [],
        recurring: undefined,
        userId: undefined,
    };
    return { kind: 'task', task, debug: { project } };
}
