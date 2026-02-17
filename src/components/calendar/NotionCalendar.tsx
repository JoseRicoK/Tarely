"use client";

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Search,
  ArrowLeft,
  ListTodo,
} from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { MiniCalendar } from './MiniCalendar';
import type { Task, Workspace } from '@/lib/types';

interface NotionCalendarProps {
  tasks: Task[];
  workspaces: Workspace[];
  selectedWorkspace?: string;
  onTaskClick?: (taskId: string, workspaceId: string) => void;
}

export function NotionCalendar({
  tasks,
  workspaces,
  selectedWorkspace,
  onTaskClick,
}: NotionCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  useEffect(() => {
    checkGoogleConnection();
  }, []);

  useEffect(() => {
    if (isGoogleConnected) {
      fetchGoogleEvents();
    }
  }, [currentDate, isGoogleConnected]);

  async function checkGoogleConnection() {
    try {
      const res = await fetch('/api/google-calendar/status');
      const data = await res.json();
      setIsGoogleConnected(data.connected && !data.isExpired);
    } catch (error) {
      console.error('Error checking Google Calendar:', error);
    }
  }

  async function fetchGoogleEvents() {
    try {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      
      const res = await fetch(
        `/api/google-calendar/events?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}`
      );
      
      if (res.ok) {
        const data = await res.json();
        setGoogleEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching Google events:', error);
    }
  }

  const handlePrevWeek = () => {
    setCurrentDate(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate(prev => addWeeks(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateSelect = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className="hidden md:block w-64 border-r border-border/30 p-4 space-y-6 bg-muted/20">
        <MiniCalendar 
          selectedDate={currentDate}
          onDateSelect={handleDateSelect}
        />
        
        {/* Calendars list */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Calendarios
          </h3>
          {isGoogleConnected && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Google Calendar</span>
            </div>
          )}
          {workspaces.map(workspace => (
            <div key={workspace.id} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: workspace.color || '#888' }}
              />
              <span>{workspace.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border/30 px-3 md:px-6 py-3 flex items-center justify-between bg-background/50">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href="/app">
                <ListTodo className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevWeek}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextWeek}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <h2 className="text-base md:text-lg font-semibold capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="h-7 md:h-8 text-xs md:text-sm"
            >
              Hoy
            </Button>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar eventos..."
                className="pl-9 h-8 w-40 md:w-64 bg-muted/30"
              />
            </div>
            
            <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
              <Button
                variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
                className="h-6 md:h-7 text-[10px] md:text-xs px-2 md:px-3"
              >
                Semana
              </Button>
              <Button
                variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
                className="h-6 md:h-7 text-[10px] md:text-xs px-2 md:px-3"
              >
                Mes
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar view */}
        <div className="flex-1 overflow-auto">
          {viewMode === 'week' ? (
            <WeekView
              currentDate={currentDate}
              tasks={tasks}
              workspaces={workspaces}
              googleEvents={googleEvents}
              onTaskClick={onTaskClick}
            />
          ) : (
            <MonthView
              currentDate={currentDate}
              tasks={tasks}
              workspaces={workspaces}
              googleEvents={googleEvents}
              onTaskClick={onTaskClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}
