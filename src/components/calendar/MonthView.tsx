"use client";

import { useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isSameMonth,
  isSaturday,
  isSunday,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2 } from 'lucide-react';
import type { Task, Workspace } from '@/lib/types';
import type { SelectedCalendarEvent } from './EventDetailPanel';
import { cn } from '@/lib/utils';

interface MonthViewProps {
  currentDate: Date;
  tasks: Task[];
  workspaces: Workspace[];
  googleEvents: any[];
  googleCalendars?: { id: string; summary: string; backgroundColor: string }[];
  onEventClick?: (event: SelectedCalendarEvent) => void;
  onTaskClick?: (taskId: string, workspaceId: string) => void;
  onDateClick?: (date: Date) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  color: string;
  type: 'task' | 'google';
  task?: Task;
  workspace?: Workspace;
  googleEvent?: any;
  calendarName?: string;
}

export function MonthView({
  currentDate,
  tasks,
  workspaces,
  googleEvents,
  googleCalendars = [],
  onEventClick,
  onTaskClick,
  onDateClick,
}: MonthViewProps) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const events = useMemo((): CalendarEvent[] => {
    const taskEvents: CalendarEvent[] = tasks
      .filter(task => task.dueDate)
      .map(task => {
        const workspace = workspaces.find(w => w.id === task.workspaceId);
        return {
          id: task.id,
          title: task.title,
          start: parseISO(task.dueDate!),
          color: workspace?.color || '#888',
          type: 'task' as const,
          task,
          workspace,
        };
      });

    const googleEventsFormatted: CalendarEvent[] = googleEvents.map(event => {
      const calInfo = googleCalendars.find(c => c.id === event._calendarId);
      return {
        id: event.id,
        title: event.summary || 'Evento de Google',
        start: new Date(event.start?.dateTime || event.start?.date),
        color: calInfo?.backgroundColor || '#4285f4',
        type: 'google' as const,
        googleEvent: event,
        calendarName: calInfo?.summary,
      };
    });

    return [...taskEvents, ...googleEventsFormatted];
  }, [tasks, workspaces, googleEvents, googleCalendars]);

  const getEventsForDay = (day: Date) =>
    events.filter(event => isSameDay(event.start, day));

  const handleEventClick = (event: CalendarEvent) => {
    if (onEventClick) {
      onEventClick({
        type: event.type,
        id: event.id,
        title: event.title,
        start: event.start,
        end: new Date(event.start.getTime() + 60 * 60 * 1000),
        color: event.color,
        task: event.task,
        workspace: event.workspace,
        googleEvent: event.googleEvent,
        calendarName: event.calendarName,
      });
    } else if (event.type === 'task' && event.task && onTaskClick) {
      onTaskClick(event.task.id, event.task.workspaceId);
    }
  };

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Week days header */}
      <div className="grid grid-cols-7 border-b border-border/20 bg-background sticky top-0 z-10">
        {weekDays.map((day, i) => {
          const isWeekendCol = i >= 5;
          return (
            <div
              key={day}
              className={cn(
                "py-1.5 text-center text-[10px] font-medium uppercase tracking-wide border-r border-border/20 last:border-r-0",
                isWeekendCol ? "text-muted-foreground/40" : "text-muted-foreground/70"
              )}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Days grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-[minmax(80px,1fr)]">
        {days.map(day => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          const isWeekend = isSaturday(day) || isSunday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "border-r border-b border-border/10 p-1.5 min-h-[80px]",
                !isCurrentMonth && "bg-muted/10",
                isCurrentDay && "bg-primary/5",
                isWeekend && !isCurrentDay && !isCurrentMonth && "bg-muted/20",
                isWeekend && isCurrentMonth && !isCurrentDay && "bg-muted/10",
                "cursor-pointer hover:bg-muted/5 transition-colors"
              )}
              onDoubleClick={() => onDateClick?.(startOfDay(day))}
              onTouchStart={() => {
                // simple long press simulation
                const timer = setTimeout(() => {
                  onDateClick?.(startOfDay(day));
                }, 500);
                (day as any)._touchTimer = timer;
              }}
              onTouchEnd={() => {
                if ((day as any)._touchTimer) clearTimeout((day as any)._touchTimer);
              }}
              onTouchMove={() => {
                if ((day as any)._touchTimer) clearTimeout((day as any)._touchTimer);
              }}
            >
              <div className="mb-1">
                <span
                  className={cn(
                    "text-xs font-medium inline-flex items-center justify-center",
                    !isCurrentMonth && "text-muted-foreground/30",
                    isWeekend && isCurrentMonth && !isCurrentDay && "text-muted-foreground/50",
                    isCurrentDay && "bg-primary text-primary-foreground w-5 h-5 rounded-full text-[10px] font-semibold"
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded cursor-pointer hover:brightness-110 transition-all flex items-center gap-1",
                      event.type === 'task'
                        ? "border-l-2 pl-1"
                        : "text-white"
                    )}
                    style={
                      event.type === 'task'
                        ? { borderLeftColor: event.color, backgroundColor: `${event.color}18`, color: event.color }
                        : { backgroundColor: event.color }
                    }
                    onClick={() => handleEventClick(event)}
                  >
                    {event.type === 'task' && (
                      <CheckCircle2 className="h-2 w-2 flex-shrink-0 opacity-70" />
                    )}
                    <span className="truncate">{event.title}</span>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground/60 pl-1">
                    +{dayEvents.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
