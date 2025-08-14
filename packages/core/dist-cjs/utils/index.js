"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortTasksByPriority = exports.searchItems = exports.truncateText = exports.calculateCompletionRate = exports.isTaskUpcoming = exports.isTaskDueToday = exports.isTaskOverdue = exports.formatDate = exports.generateId = void 0;
const uuid_1 = require("uuid");
// Optimized imports for smaller bundle size - import specific functions only
const format_1 = __importDefault(require("date-fns/format"));
const isToday_1 = __importDefault(require("date-fns/isToday"));
const isPast_1 = __importDefault(require("date-fns/isPast"));
const isFuture_1 = __importDefault(require("date-fns/isFuture"));
const startOfDay_1 = __importDefault(require("date-fns/startOfDay"));
const generateId = () => (0, uuid_1.v4)();
exports.generateId = generateId;
const formatDate = (date, formatString = 'PPP') => {
    return (0, format_1.default)(date, formatString);
};
exports.formatDate = formatDate;
const isTaskOverdue = (dueDate) => {
    if (!dueDate)
        return false;
    return (0, isPast_1.default)((0, startOfDay_1.default)(dueDate)) && !(0, isToday_1.default)(dueDate);
};
exports.isTaskOverdue = isTaskOverdue;
const isTaskDueToday = (dueDate) => {
    if (!dueDate)
        return false;
    return (0, isToday_1.default)(dueDate);
};
exports.isTaskDueToday = isTaskDueToday;
const isTaskUpcoming = (dueDate) => {
    if (!dueDate)
        return false;
    return (0, isFuture_1.default)(dueDate) && !(0, isToday_1.default)(dueDate);
};
exports.isTaskUpcoming = isTaskUpcoming;
const calculateCompletionRate = (completed, total) => {
    if (total === 0)
        return 0;
    return Math.round((completed / total) * 100);
};
exports.calculateCompletionRate = calculateCompletionRate;
const truncateText = (text, maxLength) => {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength).trim() + '...';
};
exports.truncateText = truncateText;
const searchItems = (items, query) => {
    const lowerQuery = query.toLowerCase();
    return items.filter((item) => item.title.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery));
};
exports.searchItems = searchItems;
const sortTasksByPriority = (tasks) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return [...tasks].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
};
exports.sortTasksByPriority = sortTasksByPriority;
// Export storage utilities
__exportStar(require("./storage"), exports);
__exportStar(require("./persistence"), exports);
// Export logging utilities
__exportStar(require("./logger"), exports);
// Export privacy utilities
__exportStar(require("./privacy"), exports);
// Export enhanced security utilities
__exportStar(require("./securityConfig"), exports);
__exportStar(require("./secureStorage"), exports);
__exportStar(require("./encryption"), exports);
__exportStar(require("./secureExport"), exports);
__exportStar(require("./useAutoLock"), exports);
__exportStar(require("./cryptoUtils"), exports);
// Export keyboard shortcuts utilities
__exportStar(require("./keyboardShortcuts"), exports);
// Export search engine utilities
__exportStar(require("./searchEngine"), exports);
// Export drag and drop utilities
__exportStar(require("./dragDrop"), exports);
// Export goal progress utilities
__exportStar(require("./goalProgress"), exports);
// Export standardized error handling
__exportStar(require("./errorHandler"), exports);
