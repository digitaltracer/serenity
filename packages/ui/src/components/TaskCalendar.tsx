import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Task } from '@serenity/core';
import { cn } from '../utils/cn';
// Base CSS imports removed because FullCalendar v6 packages don't export CSS via ESM in this setup.
// We provide custom styling below to ensure a polished look without direct CSS imports.

export interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onDateChange?: (taskId: string, newDate: Date) => void;
  className?: string;
}

const TaskCalendar: React.FC<TaskCalendarProps> = ({
  tasks,
  onTaskClick,
  onDateChange,
  className,
}) => {
  // Convert tasks to calendar events
  const events = useMemo(() => {
    return tasks
      .filter(task => task.dueDate)
      .map(task => ({
        id: task.id,
        title: task.title,
        start: task.dueDate,
        allDay: true,
        classNames: [
          'serenity-event',
          task.completed ? 'is-completed' : `priority-${task.priority}`,
        ],
        extendedProps: {
          task,
        },
      }));
  }, [tasks]);

  const renderEventContent = (eventInfo: any) => {
    const t = eventInfo.event.extendedProps?.task as Task | undefined;
    const completed = t?.completed;

    const priorityClass = completed ? 'is-completed' : t?.priority ? `priority-${t.priority}` : 'priority-low';

    // Get text color class for light theme visibility
    const getTextColorClass = () => {
      if (completed) return 'line-through text-emerald-700 dark:text-gray-400';
      switch (t?.priority) {
        case 'high': return 'text-red-700 dark:text-red-300';
        case 'medium': return 'text-amber-800 dark:text-amber-300';
        case 'low': return 'text-slate-700 dark:text-slate-300';
        default: return 'text-slate-700 dark:text-slate-300';
      }
    };

    return (
      <div className="serenity-event-content flex items-center gap-2 px-2 py-1 w-full">
        <span className={cn('event-dot', priorityClass)} />
        <span
          className={cn(
            'truncate flex-1 text-[11px] font-medium',
            getTextColorClass()
          )}
        >
          {eventInfo.event.title}
        </span>
      </div>
    );
  };

  const handleEventClick = (info: any) => {
    const task = info.event.extendedProps.task;
    if (onTaskClick && task) {
      onTaskClick(task);
    }
  };

  const handleEventDrop = (info: any) => {
    const task = info.event.extendedProps.task;
    const newDate = info.event.start;
    
    if (onDateChange && task && newDate) {
      onDateChange(task.id, newDate);
    }
  };

  return (
    <div className={cn('task-calendar', className)}>
      <style>{`
        /* ========= BASE CALENDAR STYLES ========= */
        .task-calendar .fc {
          --fc-border-color: rgb(226 232 240);
          --fc-page-bg-color: rgb(255 255 255);
          --fc-neutral-bg-color: rgb(248 250 252);
          --fc-neutral-text-color: rgb(100 116 139);
          --fc-today-bg-color: rgba(59, 130, 246, 0.08);
          font-family: inherit;
        }
        
        .task-calendar {
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
          background: white;
        }
        
        /* ========= DARK THEME BASE ========= */
        .dark .task-calendar {
          background: rgb(30 41 59);
          box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
        }
        
        .dark .task-calendar .fc {
          --fc-border-color: rgb(51 65 85);
          --fc-page-bg-color: rgb(30 41 59);
          --fc-neutral-bg-color: rgb(39 50 69);
          --fc-neutral-text-color: rgb(148 163 184);
          --fc-today-bg-color: rgba(59, 130, 246, 0.15);
        }

        /* ========= TOOLBAR & BUTTONS ========= */
        .task-calendar .fc-toolbar {
          padding: 1.25rem 1.5rem;
          margin-bottom: 0 !important;
          background: linear-gradient(to bottom, rgb(248 250 252), rgb(241 245 249));
          border-bottom: 1px solid rgb(226 232 240);
        }
        
        .dark .task-calendar .fc-toolbar {
          background: linear-gradient(to bottom, rgb(39 50 69), rgb(30 41 59));
          border-bottom: 1px solid rgb(51 65 85);
        }

        .task-calendar .fc .fc-button {
          background: rgb(255 255 255);
          color: rgb(51 65 85);
          border: 1px solid rgb(226 232 240);
          padding: 0.375rem 0.75rem;
          font-size: 0.8125rem;
          font-weight: 600;
          border-radius: 9999px;
          box-shadow: none;
          text-shadow: none;
        }
        
        /* Navigation buttons with proper arrows */
        .task-calendar .fc .fc-prev-button,
        .task-calendar .fc .fc-next-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .task-calendar .fc .fc-prev-button .fc-icon,
        .task-calendar .fc .fc-next-button .fc-icon {
          font-family: Arial, sans-serif;
          font-size: 1rem;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .task-calendar .fc .fc-prev-button .fc-icon::before {
          content: '\u2039';
        }

        .task-calendar .fc .fc-next-button .fc-icon::before {
          content: '\u203a';
        }
        
        .task-calendar .fc .fc-button:hover:not(:disabled) {
          background: linear-gradient(to bottom, rgb(37 99 235), rgb(29 78 216));
          box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3), 0 2px 4px rgba(0,0,0,0.1);
          transform: translateY(-1px);
        }
        
        .task-calendar .fc .fc-button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(59, 130, 246, 0.2);
        }
        
        .task-calendar .fc .fc-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
        }
        
        .task-calendar .fc .fc-button-primary:not(:disabled).fc-button-active {
          background: linear-gradient(to bottom, rgb(29 78 216), rgb(30 64 175));
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .task-calendar .fc-toolbar-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: rgb(15 23 42);
          letter-spacing: -0.025em;
        }
        
        .dark .task-calendar .fc-toolbar-title {
          color: rgb(248 250 252);
        }
        
        /* ========= DAY HEADERS ========= */
        .task-calendar .fc-col-header {
          background: linear-gradient(to bottom, rgb(241 245 249), rgb(226 232 240));
          border-bottom: 2px solid rgb(203 213 225) !important;
        }
        
        .dark .task-calendar .fc-col-header {
          background: linear-gradient(to bottom, rgb(39 50 69), rgb(30 41 59));
          border-bottom: 2px solid rgb(71 85 105) !important;
        }
        
        .task-calendar .fc-col-header-cell {
          padding: 0.875rem 0.5rem;
        }
        
        .task-calendar .fc-col-header-cell-cushion {
          color: rgb(71 85 105);
          font-weight: 700;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .dark .task-calendar .fc-col-header-cell-cushion {
          color: rgb(148 163 184);
        }
        
        /* ========= DAY CELLS ========= */
        .task-calendar .fc-theme-standard td,
        .task-calendar .fc-theme-standard th {
          border-color: rgb(226 232 240);
        }
        
        .dark .task-calendar .fc-theme-standard td,
        .dark .task-calendar .fc-theme-standard th {
          border-color: rgb(51 65 85);
        }
        
        .task-calendar .fc-daygrid-day-frame {
          min-height: 110px;
          padding: 0.5rem;
        }
        
        .task-calendar .fc-daygrid-day-number {
          color: rgb(71 85 105);
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.5rem 0.625rem;
        }
        
        .dark .task-calendar .fc-daygrid-day-number {
          color: rgb(203 213 225);
        }
        
        /* Today highlight */
        .task-calendar .fc-daygrid-day.fc-day-today {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%) !important;
        }
        
        .task-calendar .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          background: linear-gradient(135deg, rgb(59 130 246), rgb(37 99 235));
          color: white;
          border-radius: 0.5rem;
          padding: 0.375rem 0.625rem;
          font-weight: 700;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
        }
        
        /* Weekends */
        .task-calendar .fc-day-sat,
        .task-calendar .fc-day-sun {
          background-color: rgba(148, 163, 184, 0.03);
        }
        
        .dark .task-calendar .fc-day-sat,
        .dark .task-calendar .fc-day-sun {
          background-color: rgba(0, 0, 0, 0.15);
        }
        
        /* ========= EVENT CARDS ========= */
        .task-calendar .fc-event {
          cursor: pointer;
          border-radius: 0.5rem;
          padding: 0;
          font-size: 0.8125rem;
          font-weight: 500;
          margin-bottom: 0.375rem;
          border: none !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        
        .task-calendar .fc-event:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1);
          z-index: 10;
        }
        
        /* High Priority Events */
        .task-calendar .fc .serenity-event.priority-high {
          background: linear-gradient(135deg, rgb(239 68 68) 0%, rgb(220 38 38) 100%);
          color: white;
          border-left: 3px solid rgb(185 28 28);
        }
        
        .task-calendar .fc .serenity-event.priority-high:hover {
          background: linear-gradient(135deg, rgb(220 38 38) 0%, rgb(185 28 28) 100%);
          box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
        }
        
        /* Medium Priority Events */
        .task-calendar .fc .serenity-event.priority-medium {
          background: linear-gradient(135deg, rgb(245 158 11) 0%, rgb(217 119 6) 100%);
          color: rgb(30 27 75);
          border-left: 3px solid rgb(180 83 9);
        }
        
        .task-calendar .fc .serenity-event.priority-medium:hover {
          background: linear-gradient(135deg, rgb(217 119 6) 0%, rgb(180 83 9) 100%);
          color: white;
          box-shadow: 0 4px 8px rgba(245, 158, 11, 0.4);
        }
        
        /* Low Priority Events */
        .task-calendar .fc .serenity-event.priority-low {
          background: linear-gradient(135deg, rgb(100 116 139) 0%, rgb(71 85 105) 100%);
          color: white;
          border-left: 3px solid rgb(51 65 85);
        }
        
        .task-calendar .fc .serenity-event.priority-low:hover {
          background: linear-gradient(135deg, rgb(71 85 105) 0%, rgb(51 65 85) 100%);
          box-shadow: 0 4px 8px rgba(100, 116, 139, 0.4);
        }
        
        /* Completed Events */
        .task-calendar .fc .serenity-event.is-completed {
          background: linear-gradient(135deg, rgb(16 185 129) 0%, rgb(5 150 105) 100%);
          color: white;
          border-left: 3px solid rgb(4 120 87);
          opacity: 0.85;
        }
        
        .task-calendar .fc .serenity-event.is-completed:hover {
          background: linear-gradient(135deg, rgb(5 150 105) 0%, rgb(4 120 87) 100%);
          opacity: 1;
          box-shadow: 0 4px 8px rgba(16, 185, 129, 0.4);
        }
        
        /* Event dragging state */
        .task-calendar .fc-event-dragging {
          opacity: 0.6;
          cursor: move;
        }
        
        /* ========= MORE LINK ========= */
        .task-calendar .fc .fc-more-link {
          color: rgb(59 130 246);
          font-weight: 600;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          background: rgba(59, 130, 246, 0.1);
          transition: all 0.2s;
          text-decoration: none;
        }
        
        .task-calendar .fc .fc-more-link:hover {
          background: rgba(59, 130, 246, 0.2);
          color: rgb(37 99 235);
        }
        
        .dark .task-calendar .fc .fc-more-link {
          color: rgb(147 197 253);
          background: rgba(59, 130, 246, 0.15);
        }
        
        .dark .task-calendar .fc .fc-more-link:hover {
          background: rgba(59, 130, 246, 0.25);
          color: rgb(191 219 254);
        }

        /* ========= POPOVER (MORE EVENTS) ========= */
        .task-calendar .fc-popover {
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          overflow: hidden;
          box-shadow: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);
        }
        
        .dark .task-calendar .fc-popover {
          border-color: rgb(51 65 85);
          background: rgb(30 41 59);
          box-shadow: 0 10px 15px rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.2);
        }
        
        .task-calendar .fc-popover .fc-popover-header {
          background: linear-gradient(to bottom, rgb(241 245 249), rgb(226 232 240));
          padding: 0.75rem 1rem;
          font-weight: 600;
          color: rgb(30 41 59);
        }
        
        .dark .task-calendar .fc-popover .fc-popover-header {
          background: linear-gradient(to bottom, rgb(39 50 69), rgb(30 41 59));
          color: rgb(248 250 252);
        }
        
        .task-calendar .fc-popover-body {
          padding: 0.5rem;
        }
        
        /* ========= TIME GRID (WEEK/DAY VIEW) ========= */
        .task-calendar .fc-timegrid-slot {
          height: 3rem;
        }
        
        .task-calendar .fc-timegrid-slot-label {
          color: rgb(100 116 139);
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .dark .task-calendar .fc-timegrid-slot-label {
          color: rgb(148 163 184);
        }
        
        .task-calendar .fc-timegrid-now-indicator-line {
          border-color: rgb(239 68 68);
          border-width: 2px;
        }
        
        .task-calendar .fc-timegrid-now-indicator-arrow {
          border-color: rgb(239 68 68);
        }
        
        /* ========= SCROLLBARS ========= */
        .task-calendar .fc-scroller::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .task-calendar .fc-scroller::-webkit-scrollbar-track {
          background: rgb(241 245 249);
        }
        
        .dark .task-calendar .fc-scroller::-webkit-scrollbar-track {
          background: rgb(30 41 59);
        }
        
        .task-calendar .fc-scroller::-webkit-scrollbar-thumb {
          background: rgb(203 213 225);
          border-radius: 4px;
        }
        
        .dark .task-calendar .fc-scroller::-webkit-scrollbar-thumb {
          background: rgb(71 85 105);
        }
        
        .task-calendar .fc-scroller::-webkit-scrollbar-thumb:hover {
          background: rgb(148 163 184);
        }
        
        .dark .task-calendar .fc-scroller::-webkit-scrollbar-thumb:hover {
          background: rgb(100 116 139);
        }

        /* ===== Enterprise overrides (minimalist, neutral) ===== */
        .task-calendar {
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          box-shadow: none;
        }
        .dark .task-calendar { border-color: rgb(51 65 85); }

        .task-calendar .fc-toolbar {
          padding: 0.875rem 1rem;
          background: transparent;
          border-bottom: 1px solid var(--fc-border-color);
        }
        .task-calendar .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .task-calendar .fc .fc-button {
          background: rgb(255 255 255);
          color: rgb(51 65 85);
          border: 1px solid rgb(226 232 240);
          padding: 0.375rem 0.75rem;
          font-size: 0.8125rem;
          font-weight: 600;
          border-radius: 0.5rem;
          box-shadow: none;
          text-shadow: none;
        }
        .task-calendar .fc .fc-button:hover:not(:disabled) {
          background: rgb(248 250 252);
          border-color: rgb(203 213 225);
        }
        .task-calendar .fc .fc-button-primary:not(:disabled).fc-button-active {
          background: rgb(248 250 252);
          border-color: rgb(203 213 225);
          color: rgb(30 41 59);
        }
        .dark .task-calendar .fc .fc-button {
          background: rgb(51 65 85);
          color: rgb(226 232 240);
          border: 1px solid rgb(71 85 105);
        }
        .dark .task-calendar .fc .fc-button:hover:not(:disabled) {
          background: rgb(71 85 105);
          border-color: rgb(100 116 139);
        }

        .task-calendar .fc-col-header {
          background: transparent;
          border-bottom: 1px solid var(--fc-border-color) !important;
        }

        .task-calendar .fc-daygrid-day.fc-day-today { background: var(--fc-today-bg-color) !important; }
        .task-calendar .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          background: rgba(59, 130, 246, 0.12);
          color: rgb(30 64 175);
          border-radius: 0.375rem;
        }
        .dark .task-calendar .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          background: rgba(59, 130, 246, 0.2);
          color: rgb(147 197 253);
        }

        .task-calendar .fc-event { box-shadow: none; }
        .task-calendar .fc .serenity-event.priority-high { background: rgba(239, 68, 68, 0.08); border-left: 3px solid rgb(239 68 68); }
        .task-calendar .fc .serenity-event.priority-medium { background: rgba(245, 158, 11, 0.08); border-left: 3px solid rgb(245 158 11); }
        .task-calendar .fc .serenity-event.priority-low { background: rgba(100, 116, 139, 0.08); border-left: 3px solid rgb(100 116 139); }
        .task-calendar .fc .serenity-event.is-completed { background: rgba(16, 185, 129, 0.08); border-left: 3px solid rgb(16 185 129); }
        .task-calendar .serenity-event .event-dot { width: 8px; height: 8px; border-radius: 9999px; display: inline-block; }
        .task-calendar .serenity-event.priority-high .event-dot { background: rgb(239 68 68); }
        .task-calendar .serenity-event.priority-medium .event-dot { background: rgb(245 158 11); }
        .task-calendar .serenity-event.priority-low .event-dot { background: rgb(100 116 139); }
        .task-calendar .serenity-event.is-completed .event-dot { background: rgb(16 185 129); }
      `}</style>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        buttonIcons={{
          prev: 'chevron-left',
          next: 'chevron-right',
        }}
        events={events}
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        editable={true}
        droppable={true}
        height="auto"
        aspectRatio={1.8}
        firstDay={1} // Start week on Monday
        eventDisplay="block"
        dayMaxEvents={3}
        moreLinkText={(num) => `+${num} more`}
        nowIndicator={true}
        stickyHeaderDates={true}
        dayHeaderFormat={{ weekday: 'short' }}
        titleFormat={{ year: 'numeric', month: 'long' }}
        buttonText={{ today: 'Today', month: 'Month', week: 'Week', day: 'Day' }}
      />
    </div>
  );
};

export { TaskCalendar };

