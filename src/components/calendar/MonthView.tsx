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
  parseISO,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2 } from 'lucide-react';
import type { Task, Workspace } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MonthViewProps {
  currentDate: Date;
  tasks: Task[];
  workspaces: Workspace[];
  googleEvents: any[];
  onTaskClick?: (taskId: string, workspaceId: string) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  color: string;
  type: 'task' | 'google';
  taskId?: string;
  workspaceId?: string;
}

export function MonthView({
  currentDate,
  tasks,
  workspaces,
  googleEvents,
  onTaskClick,
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
          taskId: task.id,
          workspaceId: task.workspaceId,
        };
      });

    const googleEventsFormatted: CalendarEvent[] = googleEvents.map(event => ({
      id: event.id,
      title: event.summary || 'Evento de Google',
      start: new Date(event.start?.dateTime || event.start?.date),
      color: '#4285f4',
      type: 'google' as const,
    }));

    return [...taskEvents, ...googleEventsFormatted];
  }, [tasks, workspaces, googleEvents]);

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.start, day));
  };

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Week days header */}
      <div className="grid grid-cols-7 border-b border-border/20 bg-background sticky top-0 z-10">
        {weekDays.map(day => (
          <div
            key={day}
            className="py-1.5 md:py-2 text-center text-[10px] md:text-xs font-medium text-muted-foreground uppercase border-r border-border/20 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-[minmax(60px,1fr)] md:auto-rows-[minmax(100px,1fr)]">
        {days.map(day => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "border-r border-b border-border/10 p-1 md:p-2 min-h-[60px] md:min-h-[100px]",
                !isCurrentMonth && "bg-muted/10",
                isCurrentDay && "bg-primary/5"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className={cn(
                    "text-xs md:text-sm",
                    !isCurrentMonth && "text-muted-foreground/40",
                    isCurrentDay && "bg-primary text-primary-foreground w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-semibold"
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              <div className="space-y-0.5 md:space-y-1">
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    className="text-[8px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded cursor-pointer hover:brightness-110 transition-all flex items-center gap-0.5 md:gap-1"
                    style={{ backgroundColor: event.color, color: 'white' }}
                    onClick={() => {
                      if (event.type === 'task' && event.taskId && event.workspaceId && onTaskClick) {
                        onTaskClick(event.taskId, event.workspaceId);
                      }
                    }}
                  >
                    {event.type === 'task' && (
                      <CheckCircle2 className="h-2 w-2 flex-shrink-0" />
                    )}
                    <span className="truncate">{event.title}</span>
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[8px] md:text-[10px] text-muted-foreground pl-1 md:pl-1.5">
                    +{dayEvents.length - 2}
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
