"use client";

import { useMemo } from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameDay,
  isToday,
  parseISO,
  differenceInMinutes,
  startOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2 } from 'lucide-react';
import type { Task, Workspace } from '@/lib/types';
import { cn } from '@/lib/utils';

interface WeekViewProps {
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
  end: Date;
  color: string;
  type: 'task' | 'google';
  taskId?: string;
  workspaceId?: string;
  isAllDay?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // pixels per hour

export function WeekView({
  currentDate,
  tasks,
  workspaces,
  googleEvents,
  onTaskClick,
}: WeekViewProps) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const events = useMemo((): CalendarEvent[] => {
    const taskEvents: CalendarEvent[] = tasks
      .filter(task => task.dueDate)
      .map(task => {
        const workspace = workspaces.find(w => w.id === task.workspaceId);
        const start = parseISO(task.dueDate!);
        const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour default
        
        return {
          id: task.id,
          title: task.title,
          start,
          end,
          color: workspace?.color || '#888',
          type: 'task' as const,
          taskId: task.id,
          workspaceId: task.workspaceId,
        };
      });

    const googleEventsFormatted: CalendarEvent[] = googleEvents.map(event => {
      const isAllDay = !event.start?.dateTime; // Si no tiene dateTime, es todo el día
      return {
        id: event.id,
        title: event.summary || 'Evento de Google',
        start: new Date(event.start?.dateTime || event.start?.date),
        end: new Date(event.end?.dateTime || event.end?.date),
        color: '#4285f4',
        type: 'google' as const,
        isAllDay,
      };
    });

    return [...taskEvents, ...googleEventsFormatted];
  }, [tasks, workspaces, googleEvents]);

  const getEventStyle = (event: CalendarEvent, day: Date) => {
    const dayStart = startOfDay(day);
    const eventStart = event.start > dayStart ? event.start : dayStart;
    const minutesFromStart = differenceInMinutes(eventStart, dayStart);
    const duration = differenceInMinutes(event.end, event.start);
    
    const top = (minutesFromStart / 60) * HOUR_HEIGHT;
    const height = Math.max((duration / 60) * HOUR_HEIGHT, 30);
    
    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(event => 
      !event.isAllDay && (
        isSameDay(event.start, day) || 
        (event.start < day && event.end > day)
      )
    );
  };

  const getAllDayEventsForDay = (day: Date) => {
    return events.filter(event => 
      event.isAllDay && isSameDay(event.start, day)
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Days header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/20 sticky top-0 bg-background z-10">
        <div className="border-r border-border/20" />
        {weekDays.map(day => (
          <div
            key={day.toISOString()}
            className={cn(
              "py-2 md:py-3 text-center border-r border-border/20",
              isToday(day) && "bg-primary/5"
            )}
          >
            <div className="text-[10px] md:text-xs text-muted-foreground uppercase">
              {format(day, 'EEE', { locale: es })}
            </div>
            <div
              className={cn(
                "text-sm md:text-lg font-semibold mt-0.5 md:mt-1",
                isToday(day) && "text-primary"
              )}
            >
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* All-day events section */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/20 bg-muted/10">
        <div className="border-r border-border/20 px-2 py-2 text-right">
          <span className="text-[10px] text-muted-foreground/60">Todo el día</span>
        </div>
        {weekDays.map(day => {
          const allDayEvents = getAllDayEventsForDay(day);
          return (
            <div
              key={`allday-${day.toISOString()}`}
              className={cn(
                "border-r border-border/20 p-1 min-h-[40px]",
                isToday(day) && "bg-primary/[0.02]"
              )}
            >
              {allDayEvents.map(event => (
                <div
                  key={event.id}
                  className="text-[10px] md:text-[11px] px-1.5 py-0.5 md:py-1 rounded mb-1 cursor-pointer hover:brightness-110 transition-all text-white flex items-center gap-1"
                  style={{ backgroundColor: event.color }}
                  onClick={() => {
                    if (event.type === 'task' && event.taskId && event.workspaceId && onTaskClick) {
                      onTaskClick(event.taskId, event.workspaceId);
                    }
                  }}
                >
                  {event.type === 'task' && (
                    <CheckCircle2 className="h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0" />
                  )}
                  <span className="truncate">{event.title}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex-1 relative overflow-x-auto">
        <div className="grid grid-cols-[50px_repeat(7,minmax(80px,1fr))] md:grid-cols-[60px_repeat(7,1fr)]">
          {/* Hours column */}
          <div>
            {HOURS.map(hour => (
              <div
                key={hour}
                className="h-[60px] border-r border-border/20 px-1 md:px-2 text-right pt-1"
              >
                <span className="text-[9px] md:text-[11px] text-muted-foreground/60">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => (
            <div
              key={day.toISOString()}
              className={cn(
                "relative border-r border-border/20",
                isToday(day) && "bg-primary/[0.02]"
              )}
            >
              {/* Hour lines */}
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className="h-[60px] border-b border-border/10"
                />
              ))}

              {/* Events */}
              <div className="absolute inset-0 pointer-events-none">
                {getEventsForDay(day).map(event => {
                  const style = getEventStyle(event, day);
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "absolute left-0.5 right-0.5 rounded px-1 md:px-1.5 py-0.5 md:py-1 pointer-events-auto cursor-pointer",
                        "hover:brightness-110 transition-all duration-150",
                        "text-white overflow-hidden shadow-sm",
                        event.type === 'task' && "ring-1 ring-white/30"
                      )}
                      style={{
                        ...style,
                        backgroundColor: event.color,
                      }}
                      onClick={() => {
                        if (event.type === 'task' && event.taskId && event.workspaceId && onTaskClick) {
                          onTaskClick(event.taskId, event.workspaceId);
                        }
                      }}
                    >
                      <div className="flex items-center gap-1 text-[9px] md:text-[11px] font-medium leading-tight">
                        {event.type === 'task' && (
                          <CheckCircle2 className="h-2 w-2 md:h-2.5 md:w-2.5 flex-shrink-0" />
                        )}
                        <span className="truncate">{event.title}</span>
                      </div>
                      <div className="text-[8px] md:text-[10px] opacity-80 leading-tight hidden sm:block">
                        {format(event.start, 'h:mm a')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
