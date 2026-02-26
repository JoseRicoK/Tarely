"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isSaturday,
  isSunday,
  parseISO,
  differenceInMinutes,
  startOfDay,
  addMinutes,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2 } from 'lucide-react';
import type { Task, Workspace } from '@/lib/types';
import type { SelectedCalendarEvent } from './EventDetailPanel';
import { cn } from '@/lib/utils';

interface WeekViewProps {
  currentDate: Date;
  tasks: Task[];
  workspaces: Workspace[];
  googleEvents: any[];
  googleCalendars: { id: string; summary: string; backgroundColor: string }[];
  onEventClick: (event: SelectedCalendarEvent) => void;
  onTimeSlotClick?: (date: Date) => void;
  onTaskMove?: (taskId: string, newDate: Date) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  type: 'task' | 'google';
  isAllDay?: boolean;
  task?: Task;
  workspace?: Workspace;
  googleEvent?: any;
  calendarName?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 48; // px per hour

interface DragState {
  event: CalendarEvent;
  grabOffsetMinutes: number;
}

export function WeekView({
  currentDate,
  tasks,
  workspaces,
  googleEvents,
  googleCalendars,
  onEventClick,
  onTimeSlotClick,
  onTaskMove,
}: WeekViewProps) {
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [dropSlot, setDropSlot] = useState<{ dayIndex: number; minutes: number } | null>(null);

  const handleTouchStart = (date: Date) => {
    touchTimerRef.current = setTimeout(() => {
      onTimeSlotClick?.(date);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
  };

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
        const end = new Date(start.getTime() + 45 * 60 * 1000);
        return {
          id: task.id,
          title: task.title,
          start,
          end,
          color: workspace?.color || '#888',
          type: 'task' as const,
          task,
          workspace,
        };
      });

    const googleEventsFormatted: CalendarEvent[] = googleEvents.map(event => {
      const isAllDay = !event.start?.dateTime;
      const calInfo = googleCalendars.find(c => c.id === event._calendarId);
      return {
        id: event.id,
        title: event.summary || 'Evento de Google',
        start: new Date(event.start?.dateTime || event.start?.date),
        end: new Date(event.end?.dateTime || event.end?.date),
        color: calInfo?.backgroundColor || '#4285f4',
        type: 'google' as const,
        isAllDay,
        googleEvent: event,
        calendarName: calInfo?.summary,
      };
    });

    return [...taskEvents, ...googleEventsFormatted];
  }, [tasks, workspaces, googleEvents, googleCalendars]);

  const getEventStyle = (event: CalendarEvent, day: Date) => {
    const dayStart = startOfDay(day);
    const eventStart = event.start > dayStart ? event.start : dayStart;
    const minutesFromStart = differenceInMinutes(eventStart, dayStart);
    const duration = Math.max(differenceInMinutes(event.end, event.start), 30);
    const top = (minutesFromStart / 60) * HOUR_HEIGHT;
    const height = Math.max((duration / 60) * HOUR_HEIGHT, 18);
    return { top: `${top}px`, height: `${height}px` };
  };

  const getEventsForDay = (day: Date) =>
    events.filter(e =>
      !e.isAllDay && (isSameDay(e.start, day) || (e.start < day && e.end > day))
    );

  const getAllDayEventsForDay = (day: Date) =>
    events.filter(e => e.isAllDay && isSameDay(e.start, day));

  const toSelectedEvent = (e: CalendarEvent): SelectedCalendarEvent => ({
    type: e.type,
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    color: e.color,
    isAllDay: e.isAllDay,
    task: e.task,
    workspace: e.workspace,
    googleEvent: e.googleEvent,
    calendarName: e.calendarName,
  });

  // ─── Drag handling ────────────────────────────────────────────────────────
  const startDrag = useCallback((e: React.MouseEvent, event: CalendarEvent) => {
    if (event.type !== 'task') return;
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const grabOffsetMinutes = ((e.clientY - rect.top) / HOUR_HEIGHT) * 60;
    setDragging({ event, grabOffsetMinutes });
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!gridRef.current || !scrollRef.current) return;
      const gridRect = gridRef.current.getBoundingClientRect();
      const x = e.clientX - gridRect.left - 52;
      const columnWidth = (gridRect.width - 52) / 7;
      const dayIndex = Math.max(0, Math.min(6, Math.floor(x / columnWidth)));
      // getBoundingClientRect already accounts for scroll — do NOT add scrollTop again
      const yInGrid = e.clientY - gridRect.top;
      const adjustedY = yInGrid - (dragging.grabOffsetMinutes / 60) * HOUR_HEIGHT;
      const rawMinutes = (adjustedY / HOUR_HEIGHT) * 60;
      const snapped = Math.max(0, Math.min(23 * 60 + 30, Math.round(rawMinutes / 15) * 15));
      setDropSlot({ dayIndex, minutes: snapped });
    };

    const onMouseUp = () => {
      if (dropSlot && dragging.event.task) {
        const targetDay = weekDays[dropSlot.dayIndex];
        const newDate = new Date(targetDay);
        newDate.setHours(Math.floor(dropSlot.minutes / 60), dropSlot.minutes % 60, 0, 0);
        onTaskMove?.(dragging.event.id, newDate);
      }
      setDragging(null);
      setDropSlot(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, dropSlot, weekDays, onTaskMove]);

  const dropSlotTimeLabel = dropSlot
    ? format(new Date(new Date().setHours(Math.floor(dropSlot.minutes / 60), dropSlot.minutes % 60, 0, 0)), 'h:mm a')
    : '';

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={cn("flex flex-col h-full", dragging && "select-none cursor-grabbing")}>
      {/* Days header */}
      <div className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-border/20 sticky top-0 bg-background z-10 pr-[var(--cal-sb)]">
        <div className="border-r border-border/20" />
        {weekDays.map(day => {
          const isWeekend = isSaturday(day) || isSunday(day);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "py-2 text-center border-r border-border/20",
                isToday(day) && "bg-primary/5",
                isWeekend && !isToday(day) && "bg-muted/20"
              )}
            >
              <div className={cn(
                "text-[10px] uppercase tracking-wide",
                isWeekend ? "text-muted-foreground/50" : "text-muted-foreground/70"
              )}>
                {format(day, 'EEE', { locale: es })}
              </div>
              <div className={cn(
                "text-sm md:text-base font-semibold mt-0.5",
                isToday(day) && "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs",
                isWeekend && !isToday(day) && "text-muted-foreground/60"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day events */}
      <div className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-border/20 bg-muted/10 pr-[var(--cal-sb)]">
        <div className="border-r border-border/20 px-1 py-1.5 text-right">
          <span className="text-[9px] text-muted-foreground/50 leading-none">todo el día</span>
        </div>
        {weekDays.map(day => {
          const allDayEvents = getAllDayEventsForDay(day);
          const isWeekend = isSaturday(day) || isSunday(day);
          return (
            <div
              key={`allday-${day.toISOString()}`}
              className={cn(
                "border-r border-border/20 p-1 min-h-[32px]",
                isToday(day) && "bg-primary/5",
                isWeekend && !isToday(day) && "bg-muted/20"
              )}
            >
              {allDayEvents.map(event => {
                const isCompleted = event.type === 'task' && event.task?.completed;
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded mb-0.5 cursor-pointer hover:brightness-110 transition-all text-white flex items-center gap-1 truncate pointer-events-auto",
                      isCompleted && "opacity-50"
                    )}
                    style={{ backgroundColor: event.color }}
                    onClick={() => onEventClick(toSelectedEvent(event))}
                  >
                    {event.type === 'task' && (
                      <CheckCircle2 className={cn("h-2.5 w-2.5 flex-shrink-0", isCompleted && "text-green-300")} />
                    )}
                    <span className={cn("truncate", isCompleted && "line-through")}>{event.title}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-[var(--cal-sb)]" ref={scrollRef}>
        <div className="grid grid-cols-[52px_repeat(7,1fr)]" style={{ minHeight: `${HOUR_HEIGHT * 24}px` }} ref={gridRef}>
          {/* Hours column */}
          <div className="border-r border-border/20">
            {HOURS.map(hour => (
              <div
                key={hour}
                className="text-right pr-1.5 border-b border-border/5"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span className="text-[9px] md:text-[10px] text-muted-foreground/40 leading-none translate-y-[-0.5em] inline-block mt-[-1px]">
                  {hour === 0 ? '' : hour < 12 ? `${hour}` : hour === 12 ? '12' : `${hour - 12}`}
                  {hour !== 0 && <span className="text-[7px] ml-px">{hour < 12 ? 'am' : 'pm'}</span>}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => {
            const isWeekend = isSaturday(day) || isSunday(day);
            const dayEvents = getEventsForDay(day);
            const isDropTarget = dragging && dropSlot?.dayIndex === dayIndex;
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "relative border-r border-border/20",
                  isToday(day) && "bg-primary/[0.03]",
                  isWeekend && !isToday(day) && "bg-muted/15",
                  isDropTarget && "bg-primary/5"
                )}
                style={{ height: `${HOUR_HEIGHT * 24}px` }}
              >
                {/* Hour slots for clicking/double-clicking */}
                <div className="absolute inset-0 z-0 flex flex-col">
                  {HOURS.map(hour => {
                    const slotDate = addMinutes(startOfDay(day), hour * 60);
                    return (
                      <div
                        key={`slot-${hour}`}
                        className="flex-1 border-b border-border/10"
                        onDoubleClick={() => !dragging && onTimeSlotClick?.(slotDate)}
                        onTouchStart={() => handleTouchStart(slotDate)}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchEnd}
                        onTouchCancel={handleTouchEnd}
                      />
                    );
                  })}
                </div>

                {/* Drop ghost */}
                {isDropTarget && dropSlot && dragging && (
                  <div
                    className="absolute left-0.5 right-0.5 rounded border-l-[2px] pl-1.5 pointer-events-none z-20 opacity-80"
                    style={{
                      top: `${(dropSlot.minutes / 60) * HOUR_HEIGHT}px`,
                      height: getEventStyle(dragging.event, day).height,
                      backgroundColor: `${dragging.event.color}44`,
                      borderLeftColor: dragging.event.color,
                      color: dragging.event.color,
                    }}
                  >
                    <div className="text-[10px] font-medium truncate py-0.5">{dragging.event.title}</div>
                    <div className="text-[9px] opacity-70">{dropSlotTimeLabel}</div>
                  </div>
                )}

                {/* Events */}
                <div className="absolute inset-0 pointer-events-none z-10">
                  {dayEvents.map(event => {
                    const style = getEventStyle(event, day);
                    const isTask = event.type === 'task';
                    const isCompleted = isTask && event.task?.completed;
                    const isDraggingThis = dragging?.event.id === event.id;
                    return (
                      <div
                        key={event.id}
                        className={cn(
                          "absolute left-0.5 right-0.5 rounded overflow-hidden pointer-events-auto",
                          "hover:brightness-110 transition-all duration-100 shadow-sm",
                          isTask ? "border-l-[2px] pl-1.5 pr-1 cursor-grab active:cursor-grabbing" : "px-1.5 cursor-pointer",
                          isDraggingThis && "opacity-30",
                          isCompleted && "opacity-50"
                        )}
                        style={{
                          ...style,
                          backgroundColor: isTask ? `${event.color}22` : event.color,
                          borderLeftColor: isTask ? event.color : undefined,
                          color: isTask ? event.color : 'white',
                        }}
                        onMouseDown={isTask ? (e) => startDrag(e, event) : undefined}
                        onClick={(e) => {
                          if (!dragging) {
                            e.stopPropagation();
                            onEventClick(toSelectedEvent(event));
                          }
                        }}
                      >
                        <div className="flex items-center gap-0.5 leading-none py-0.5">
                          {isTask && (
                            <CheckCircle2 className={cn(
                              "h-2 w-2 flex-shrink-0",
                              isCompleted ? "opacity-100" : "opacity-80"
                            )} />
                          )}
                          <span className={cn(
                            "text-[10px] font-medium truncate",
                            isCompleted && "line-through opacity-70"
                          )}>
                            {event.title}
                          </span>
                        </div>
                        {parseInt(style.height) > 28 && (
                          <div className={cn(
                            "text-[9px] opacity-60 leading-none",
                            isTask && "ml-2.5"
                          )}>
                            {format(event.start, 'h:mm a')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
