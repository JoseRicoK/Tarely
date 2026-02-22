"use client";

import { useState } from 'react';
import { X, CheckCircle2, Circle, Clock, MapPin, ExternalLink, Tag, CalendarIcon, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Task, Workspace } from '@/lib/types';

export interface SelectedCalendarEvent {
  type: 'task' | 'google';
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  isAllDay?: boolean;
  task?: Task;
  workspace?: Workspace;
  googleEvent?: any;
  calendarName?: string;
}

interface EventDetailPanelProps {
  event: SelectedCalendarEvent | null;
  upcomingTasks: Task[];
  workspaces: Workspace[];
  onClose: () => void;
  onTaskToggle: (taskId: string, completed: boolean) => void;
}

export function EventDetailPanel({
  event,
  upcomingTasks,
  workspaces,
  onClose,
  onTaskToggle,
}: EventDetailPanelProps) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    if (!event?.task) return;
    setToggling(true);
    try {
      await onTaskToggle(event.task.id, !event.task.completed);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="w-72 border-l border-border/20 bg-background/95 backdrop-blur-sm flex flex-col overflow-hidden">
      {event ? (
        <>
          {/* Detail header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {event.type === 'task' ? 'Tarea' : 'Evento'}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Detail content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Color bar + title */}
            <div className="flex items-start gap-3">
              <div
                className="w-1 rounded-full flex-shrink-0 mt-1"
                style={{ backgroundColor: event.color, minHeight: '36px' }}
              />
              <div className="flex-1 min-w-0">
                <h2 className={cn(
                  "font-semibold text-sm leading-snug",
                  event.task?.completed && "line-through text-muted-foreground"
                )}>
                  {event.title}
                </h2>
                {event.task?.completed && (
                  <Badge variant="secondary" className="mt-1.5 text-[10px] h-4 px-1.5">
                    Completada
                  </Badge>
                )}
              </div>
            </div>

            {/* Time */}
            <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <div>
                {event.isAllDay ? (
                  <span>{format(event.start, "EEEE, d 'de' MMMM", { locale: es })}</span>
                ) : (
                  <>
                    <div>{format(event.start, "EEEE, d 'de' MMMM", { locale: es })}</div>
                    <div className="text-muted-foreground/70">
                      {format(event.start, 'h:mm a')} – {format(event.end, 'h:mm a')}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Task-specific fields */}
            {event.type === 'task' && event.task && (
              <>
                {event.workspace && (
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Tag className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{event.workspace.name}</span>
                  </div>
                )}

                {event.task.importance > 7 && (
                  <div className="flex items-center gap-2.5 text-xs text-amber-500">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>Importancia alta ({event.task.importance}/10)</span>
                  </div>
                )}

                {event.task.description && (
                  <p className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3 leading-relaxed">
                    {event.task.description}
                  </p>
                )}

                {event.task.subtasks && event.task.subtasks.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Subtareas ({event.task.subtasks.filter(s => s.completed).length}/{event.task.subtasks.length})
                    </p>
                    {event.task.subtasks.map(sub => (
                      <div key={sub.id} className="flex items-center gap-2 text-xs">
                        {sub.completed
                          ? <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                          : <Circle className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                        }
                        <span className={cn(sub.completed && "line-through text-muted-foreground/60")}>
                          {sub.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Overdue warning */}
                {!event.task.completed && isPast(event.end) && (
                  <div className="text-[11px] text-red-400 bg-red-500/10 rounded-md px-3 py-2">
                    Vencida {formatDistanceToNow(event.end, { locale: es, addSuffix: true })}
                  </div>
                )}

                <Button
                  className="w-full h-8 text-xs"
                  variant={event.task.completed ? 'outline' : 'default'}
                  size="sm"
                  disabled={toggling}
                  onClick={handleToggle}
                >
                  {event.task.completed ? (
                    <><Circle className="h-3.5 w-3.5 mr-2" />Marcar como pendiente</>
                  ) : (
                    <><CheckCircle2 className="h-3.5 w-3.5 mr-2" />Completar tarea</>
                  )}
                </Button>
              </>
            )}

            {/* Google event-specific fields */}
            {event.type === 'google' && event.googleEvent && (
              <>
                {event.calendarName && (
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <CalendarIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{event.calendarName}</span>
                  </div>
                )}

                {event.googleEvent.location && (
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="leading-snug">{event.googleEvent.location}</span>
                  </div>
                )}

                {event.googleEvent.description && (
                  <p className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3 leading-relaxed">
                    {event.googleEvent.description.replace(/<[^>]+>/g, '')}
                  </p>
                )}

                {event.googleEvent.htmlLink && (
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs" asChild>
                    <a href={event.googleEvent.htmlLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-2" />
                      Abrir en Google Calendar
                    </a>
                  </Button>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Upcoming tasks panel */}
          <div className="px-4 py-3 border-b border-border/20">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Próximas tareas
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {upcomingTasks.length === 0 ? (
              <div className="p-4 text-xs text-muted-foreground/60 text-center mt-8">
                No hay tareas con fecha próximas
              </div>
            ) : (
              <div className="divide-y divide-border/10">
                {upcomingTasks.map(task => {
                  const workspace = workspaces.find(w => w.id === task.workspaceId);
                  const due = task.dueDate ? new Date(task.dueDate) : null;
                  const isOverdue = due && !task.completed && isPast(due);
                  return (
                    <div key={task.id} className="px-4 py-3 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: workspace?.color || '#888' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-xs font-medium leading-snug truncate",
                            task.completed && "line-through text-muted-foreground/60"
                          )}>
                            {task.title}
                          </p>
                          {due && (
                            <p className={cn(
                              "text-[10px] mt-0.5",
                              isOverdue ? "text-red-400" : "text-muted-foreground/60"
                            )}>
                              {isOverdue
                                ? `Vencida ${formatDistanceToNow(due, { locale: es, addSuffix: true })}`
                                : format(due, "d MMM, h:mm a", { locale: es })
                              }
                            </p>
                          )}
                        </div>
                        <button
                          className="flex-shrink-0 mt-0.5 opacity-40 hover:opacity-100 transition-opacity"
                          onClick={() => onTaskToggle(task.id, !task.completed)}
                        >
                          {task.completed
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            : <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                          }
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
