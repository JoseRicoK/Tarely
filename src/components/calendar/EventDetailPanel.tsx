"use client";

import { useState, useEffect } from 'react';
import {
  X, CheckCircle2, Circle, Clock, MapPin, ExternalLink, Tag,
  CalendarIcon, Pencil, Check, RotateCcw
} from 'lucide-react';
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
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

export function EventDetailPanel({
  event,
  upcomingTasks,
  workspaces,
  onClose,
  onTaskToggle,
  onTaskUpdate,
}: EventDetailPanelProps) {
  const [toggling, setToggling] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImportance, setEditImportance] = useState(5);
  const [editWorkspaceId, setEditWorkspaceId] = useState('');

  useEffect(() => {
    if (event?.task) {
      setEditTitle(event.task.title ?? '');
      setEditDescription(event.task.description ?? '');
      setEditImportance(event.task.importance ?? 5);
      setEditWorkspaceId(event.task.workspaceId ?? '');
    }
    setIsEditing(false);
  }, [event?.id]);

  const handleToggle = async () => {
    if (!event?.task) return;
    setToggling(true);
    try {
      await onTaskToggle(event.task.id, !event.task.completed);
    } finally {
      setToggling(false);
    }
  };

  const handleSave = async () => {
    if (!event?.task || !onTaskUpdate) return;
    setSaving(true);
    try {
      await onTaskUpdate(event.task.id, {
        title: editTitle.trim() || event.task.title,
        description: editDescription,
        importance: editImportance,
        workspaceId: editWorkspaceId,
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (event?.task) {
      setEditTitle(event.task.title ?? '');
      setEditDescription(event.task.description ?? '');
      setEditImportance(event.task.importance ?? 5);
      setEditWorkspaceId(event.task.workspaceId ?? '');
    }
    setIsEditing(false);
  };

  const importanceBarColor = (val: number) => {
    if (val >= 8) return 'bg-red-500';
    if (val >= 5) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden w-full">
      {event ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {event.type === 'task' ? 'Tarea' : 'Evento'}
            </span>
            <div className="flex items-center gap-1">
              {event.type === 'task' && onTaskUpdate && !isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsEditing(true)}
                  title="Editar tarea"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
              {isEditing && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={handleCancelEdit}
                    title="Cancelar"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-emerald-500 hover:text-emerald-400"
                    onClick={handleSave}
                    disabled={saving}
                    title="Guardar"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Title */}
            <div className="flex items-start gap-3">
              <div
                className="w-1 rounded-full flex-shrink-0 mt-1"
                style={{ backgroundColor: event.color, minHeight: '36px' }}
              />
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input
                    autoFocus                  title="Título de la tarea"
                  placeholder="Título de la tarea"                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancelEdit(); }}
                    className="w-full bg-muted/30 border border-border/40 rounded px-2 py-1 text-sm font-semibold outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  />
                ) : (
                  <h2 className={cn(
                    "font-semibold text-sm leading-snug",
                    event.task?.completed && "line-through text-muted-foreground"
                  )}>
                    {event.title}
                  </h2>
                )}
                {!isEditing && event.task?.completed && (
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
                {/* Workspace - always read-only */}
                {event.workspace && (
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Tag className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{event.workspace.name}</span>
                  </div>
                )}

                {/* Importance - always visible */}
                {isEditing ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        Importancia
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        editImportance >= 8 ? "text-red-400 bg-red-500/10" :
                        editImportance >= 5 ? "text-amber-400 bg-amber-500/10" :
                        "text-emerald-400 bg-emerald-500/10"
                      )}>
                        {editImportance}/10
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(val => (
                        <button
                          key={val}
                          onClick={() => setEditImportance(val)}
                          className={cn(
                            "flex-1 h-1.5 rounded-full transition-all",
                            val <= editImportance
                              ? importanceBarColor(editImportance)
                              : "bg-muted/40 hover:bg-muted/60"
                          )}
                          title={`${val}`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {(() => {
                      const imp = event.task?.importance ?? 5;
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              Importancia
                            </span>
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded",
                              imp >= 8 ? "text-red-400 bg-red-500/10" :
                              imp >= 5 ? "text-amber-400 bg-amber-500/10" :
                              "text-emerald-400 bg-emerald-500/10"
                            )}>
                              {imp}/10
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {Array.from({ length: 10 }, (_, i) => i + 1).map(val => (
                              <div
                                key={val}
                                className={cn(
                                  "flex-1 h-1.5 rounded-full",
                                  val <= imp ? importanceBarColor(imp) : "bg-muted/30"
                                )}
                              />
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Description */}
                {isEditing ? (
                  <div className="space-y-1">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Descripción
                    </span>
                    <textarea
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      rows={3}
                      placeholder="Añadir descripción…"
                      className="w-full bg-muted/30 border border-border/40 rounded px-2 py-1.5 text-xs outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none text-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                ) : event.task.description ? (
                  <p className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3 leading-relaxed">
                    {event.task.description}
                  </p>
                ) : null}

                {/* Subtasks (read-only) */}
                {!isEditing && event.task.subtasks && event.task.subtasks.length > 0 && (
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
                {!isEditing && !event.task.completed && isPast(event.end) && (
                  <div className="text-[11px] text-red-400 bg-red-500/10 rounded-md px-3 py-2">
                    Vencida {formatDistanceToNow(event.end, { locale: es, addSuffix: true })}
                  </div>
                )}

                {/* Action buttons */}
                {isEditing ? (
                  <div className="flex gap-2 pt-1">
                    <Button className="flex-1 h-8 text-xs" variant="outline" size="sm" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>
                    <Button className="flex-1 h-8 text-xs" size="sm" disabled={saving} onClick={handleSave}>
                      {saving ? 'Guardando…' : 'Guardar'}
                    </Button>
                  </div>
                ) : (
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
                )}
              </>
            )}

            {/* Google event fields */}
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
