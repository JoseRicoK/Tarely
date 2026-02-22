"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Search,
} from 'lucide-react';
import {
  format,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isAfter,
  isBefore,
  addDays,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { MiniCalendar } from './MiniCalendar';
import { EventDetailPanel } from './EventDetailPanel';
import type { SelectedCalendarEvent } from './EventDetailPanel';
import type { Task, Workspace } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

import { TaskDialog } from '@/components/tasks/TaskDialog';

// ... (después de GoogleCalendar)
interface GoogleCalendar {
  id: string;
  summary: string;
  backgroundColor: string;
  primary: boolean;
}

interface NotionCalendarProps {
  tasks: Task[];
  workspaces: Workspace[];
  selectedWorkspace?: string;
  onTaskClick?: (taskId: string, workspaceId: string) => void;
}

export function NotionCalendar({
  tasks: initialTasks,
  workspaces,
  selectedWorkspace,
  onTaskClick,
}: NotionCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendar[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [selectedCalendars, setSelectedCalendars] = useState<Set<string>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<SelectedCalendarEvent | null>(null);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTaskInitialData, setNewTaskInitialData] = useState<{ dueDate?: string | null; workspaceId?: string } | undefined>(undefined);

  const handleTimeSlotClick = useCallback((date: Date) => {
    setNewTaskInitialData({
      dueDate: date.toISOString(),
      workspaceId: selectedWorkspace === 'all' ? workspaces[0]?.id : selectedWorkspace,
    });
    setIsTaskDialogOpen(true);
  }, [selectedWorkspace, workspaces]);

  const handleCreateTask = async (data: any) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          workspaceId: data.workspaceId || selectedWorkspace || workspaces[0]?.id,
          source: "manual",
        }),
      });

      if (!res.ok) throw new Error("Failed to create task");
      
      const newTask = await res.json();
      setTasks(prev => [...prev, newTask]);
      setIsTaskDialogOpen(false);
      toast.success("Tarea creada");
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Error al crear la tarea");
    }
  };

  const toggleCalendar = (id: string) => {
    setSelectedCalendars(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filtrar eventos basándose en la selección
  const filteredGoogleEvents = selectedCalendars.size === 0 
    ? googleEvents 
    : googleEvents.filter(e => selectedCalendars.has(e._calendarId));

  const filteredTasks = selectedCalendars.size === 0 
    ? tasks 
    : tasks.filter(t => selectedCalendars.has(t.workspaceId));

  // Sync when parent updates tasks
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    checkGoogleConnection();
  }, []);

  async function checkGoogleConnection() {
    try {
      const res = await fetch('/api/google-calendar/status');
      const data = await res.json();
      if (data.connected && !data.isExpired) {
        setIsGoogleConnected(true);
        fetchGoogleCalendars();
      }
    } catch (error) {
      console.error('Error checking Google Calendar:', error);
    }
  }

  async function fetchGoogleCalendars() {
    try {
      const res = await fetch('/api/google-calendar/calendars');
      if (res.ok) {
        const data = await res.json();
        setGoogleCalendars(data.calendars || []);
      }
    } catch (error) {
      console.error('Error fetching Google calendars:', error);
    }
  }

  const [googleEventsCache, setGoogleEventsCache] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (isGoogleConnected) {
      fetchGoogleEvents();
    }
  }, [currentDate, isGoogleConnected, viewMode]);

  async function fetchGoogleEvents() {
    try {
      const start = viewMode === 'week'
        ? startOfWeek(currentDate, { weekStartsOn: 1 })
        : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = viewMode === 'week'
        ? endOfWeek(currentDate, { weekStartsOn: 1 })
        : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const cacheKey = `${start.toISOString()}_${end.toISOString()}`;

      if (googleEventsCache[cacheKey]) {
        setGoogleEvents(googleEventsCache[cacheKey]);
        return;
      }

      const res = await fetch(
        `/api/google-calendar/events?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}`
      );
      if (res.ok) {
        const data = await res.json();
        const events = data.events || [];
        setGoogleEvents(events);
        setGoogleEventsCache(prev => ({ ...prev, [cacheKey]: events }));
      }
    } catch (error) {
      console.error('Error fetching Google events:', error);
    }
  }

  const handlePrev = useCallback(() => {
    if (viewMode === 'week') setCurrentDate(prev => subWeeks(prev, 1));
    else setCurrentDate(prev => subMonths(prev, 1));
  }, [viewMode]);

  const handleNext = useCallback(() => {
    if (viewMode === 'week') setCurrentDate(prev => addWeeks(prev, 1));
    else setCurrentDate(prev => addMonths(prev, 1));
  }, [viewMode]);

  const handleToday = () => setCurrentDate(new Date());

  // Lógica de arrastre con trackpad (horizontal scroll)
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Solo responder a scroll horizontal dominante
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 20) {
      if (!isScrollingRef.current) {
        isScrollingRef.current = true;
        if (e.deltaX > 0) {
          handleNext();
        } else {
          handlePrev();
        }
        
        // Bloquear nuevos eventos de scroll por 500ms para evitar saltos múltiples rápidos
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          isScrollingRef.current = false;
        }, 500);
      }
    }
  }, [handleNext, handlePrev]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const handleDateSelect = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const handleEventClick = useCallback((event: SelectedCalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  const handleTaskToggle = useCallback(async (taskId: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      const updatedTask = await res.json();

      // Update local tasks state
      setTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, completed, completedAt: completed ? new Date().toISOString() : undefined } : t)
      );

      // Update selected event if it's the same task
      setSelectedEvent(prev => {
        if (prev?.task?.id === taskId) {
          return { ...prev, task: { ...prev.task!, completed, completedAt: completed ? new Date().toISOString() : undefined } };
        }
        return prev;
      });

      toast.success(completed ? 'Tarea completada' : 'Tarea marcada como pendiente');
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error('Error al actualizar la tarea');
    }
  }, []);

  // Upcoming tasks sorted by dueDate (next 30 days)
  const upcomingTasks = useMemo(() => {
    const now = new Date();
    const in30Days = addDays(now, 30);
    return tasks
      .filter(t => t.dueDate && isAfter(new Date(t.dueDate), now) && isBefore(new Date(t.dueDate), in30Days))
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 20);
  }, [tasks]);

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Left Sidebar */}
      <div className="hidden md:flex w-56 border-r border-border/20 flex-col bg-muted/10">
        <div className="p-3">
          <MiniCalendar selectedDate={currentDate} onDateSelect={handleDateSelect} />
        </div>

        {/* Calendars section */}
        <div className="px-3 pb-3 space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            Mis calendarios
          </p>

          {/* Google Calendars */}
          {isGoogleConnected && googleCalendars.map(cal => {
            const isSelected = selectedCalendars.size === 0 || selectedCalendars.has(cal.id);
            return (
              <button
                key={cal.id}
                onClick={() => toggleCalendar(cal.id)}
                className="w-full flex items-center gap-2 px-1 py-1 rounded hover:bg-muted/30 transition-colors text-left"
              >
                <div 
                  className={cn(
                    "w-2.5 h-2.5 rounded-sm flex-shrink-0 transition-opacity",
                    !isSelected && "opacity-20"
                  )} 
                  style={{ backgroundColor: cal.backgroundColor }} 
                />
                <span className={cn(
                  "text-xs truncate transition-opacity",
                  isSelected ? "text-foreground" : "text-muted-foreground/60 line-through"
                )}>
                  {cal.summary}
                </span>
              </button>
            );
          })}

          {/* Workspace calendars */}
          {workspaces.map(ws => {
            const isSelected = selectedCalendars.size === 0 || selectedCalendars.has(ws.id);
            return (
              <button
                key={ws.id}
                onClick={() => toggleCalendar(ws.id)}
                className="w-full flex items-center gap-2 px-1 py-1 rounded hover:bg-muted/30 transition-colors text-left"
              >
                <div 
                  className={cn(
                    "w-2.5 h-2.5 rounded-sm flex-shrink-0 transition-opacity",
                    !isSelected && "opacity-20"
                  )} 
                  style={{ backgroundColor: ws.color || '#888' }} 
                />
                <span className={cn(
                  "text-xs truncate transition-opacity",
                  isSelected ? "text-foreground" : "text-muted-foreground/60 line-through"
                )}>
                  {ws.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-border/20 px-3 md:px-4 py-2 flex items-center justify-between bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            {/* Back to tasks */}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" asChild>
              <Link href="/app">
                <ListTodo className="h-3.5 w-3.5" />
              </Link>
            </Button>

            <div className="w-px h-4 bg-border/40 mx-1" />

            {/* Navigation */}
            <Button variant="ghost" size="icon" onClick={handlePrev} className="h-7 w-7">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNext} className="h-7 w-7">
              <ChevronRight className="h-4 w-4" />
            </Button>

            <h2 className="text-sm font-semibold capitalize ml-1">
              {format(currentDate, viewMode === 'week' ? "d 'de' MMMM yyyy" : 'MMMM yyyy', { locale: es })}
            </h2>

            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="h-6 text-[11px] px-2 ml-1"
            >
              Hoy
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 bg-muted/30 rounded-md p-0.5">
              <Button
                variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
                className="h-6 text-[11px] px-2.5"
              >
                Semana
              </Button>
              <Button
                variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
                className="h-6 text-[11px] px-2.5"
              >
                Mes
              </Button>
            </div>

            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <Input
                placeholder="Buscar..."
                className="pl-8 h-7 w-36 md:w-48 bg-muted/30 text-xs border-border/30"
              />
            </div>
          </div>
        </div>

        {/* Calendar grid */}
        <div 
          className="flex-1 overflow-hidden flex"
          onWheel={handleWheel}
        >
          <div className="flex-1 overflow-auto">
            {viewMode === 'week' ? (
              <WeekView
                currentDate={currentDate}
                tasks={filteredTasks}
                workspaces={workspaces}
                googleEvents={filteredGoogleEvents}
                googleCalendars={googleCalendars}
                onEventClick={handleEventClick}
                onTimeSlotClick={handleTimeSlotClick}
              />
            ) : (
              <MonthView
                currentDate={currentDate}
                tasks={filteredTasks}
                workspaces={workspaces}
                googleEvents={filteredGoogleEvents}
                googleCalendars={googleCalendars}
                onEventClick={handleEventClick}
                onTaskClick={onTaskClick}
                onDateClick={handleTimeSlotClick}
              />
            )}
          </div>

          {/* Desktop Right panel */}
          <div className="hidden lg:block w-80 border-l border-border/20 bg-background/50">
            <EventDetailPanel
              event={selectedEvent}
              upcomingTasks={upcomingTasks}
              workspaces={workspaces}
              onClose={() => setSelectedEvent(null)}
              onTaskToggle={handleTaskToggle}
            />
          </div>

          {/* Mobile Right panel (Sheet) */}
          <div className="lg:hidden">
            <Sheet open={selectedEvent !== null} onOpenChange={(open) => !open && setSelectedEvent(null)}>
              <SheetContent side="right" className="p-0 w-[85vw] sm:w-96">
                <SheetTitle className="sr-only">Detalles del evento</SheetTitle>
                <div className="h-full pt-6">
                  <EventDetailPanel
                    event={selectedEvent}
                    upcomingTasks={upcomingTasks}
                    workspaces={workspaces}
                    onClose={() => setSelectedEvent(null)}
                    onTaskToggle={handleTaskToggle}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onSubmit={handleCreateTask}
        mode="create"
        workspaces={workspaces}
        initialData={newTaskInitialData as any}
      />
    </div>
  );
}
