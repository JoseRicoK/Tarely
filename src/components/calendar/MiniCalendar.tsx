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
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export function MiniCalendar({ selectedDate, onDateSelect }: MiniCalendarProps) {
  const [displayMonth, setDisplayMonth] = useState(selectedDate);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(displayMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(displayMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [displayMonth]);

  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDisplayMonth(prev => subMonths(prev, 1))}
          className="h-6 w-6"
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        
        <div className="text-sm font-medium">
          {format(displayMonth, 'MMMM yyyy', { locale: es })}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDisplayMonth(prev => addMonths(prev, 1))}
          className="h-6 w-6"
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div
            key={day}
            className="text-center text-[10px] text-muted-foreground font-medium h-6 flex items-center justify-center"
          >
            {day}
          </div>
        ))}
        
        {days.map(day => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);
          const isCurrentMonth = isSameMonth(day, displayMonth);
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={cn(
                "h-6 text-xs rounded hover:bg-accent transition-colors",
                !isCurrentMonth && "text-muted-foreground/40",
                isCurrentDay && "font-bold",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
