"use client";

import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DatePickerProps {
  value?: string; // ISO date string
  onChange: (date: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  showTime?: boolean;
  compact?: boolean; // Modo compacto para cards
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Sin fecha",
  disabled = false,
  showTime = false,
  compact = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [time, setTime] = React.useState("23:59");

  // Parse existing date and time
  const parsedDate = React.useMemo(() => {
    if (!value) return undefined;
    try {
      const date = parseISO(value);
      return isValid(date) ? date : undefined;
    } catch {
      return undefined;
    }
  }, [value]);

  // Initialize time from existing value
  React.useEffect(() => {
    if (parsedDate) {
      const hours = parsedDate.getHours().toString().padStart(2, "0");
      const minutes = parsedDate.getMinutes().toString().padStart(2, "0");
      setTime(`${hours}:${minutes}`);
    }
  }, [parsedDate]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(null);
      return;
    }

    // Combine date with time
    const [hours, minutes] = time.split(":").map(Number);
    date.setHours(hours || 23, minutes || 59, 0, 0);
    onChange(date.toISOString());
    
    if (!showTime) {
      setOpen(false);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTime(newTime);

    if (parsedDate && newTime) {
      const [hours, minutes] = newTime.split(":").map(Number);
      const newDate = new Date(parsedDate);
      newDate.setHours(hours || 0, minutes || 0, 0, 0);
      onChange(newDate.toISOString());
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setOpen(false);
  };

  // Check if date is overdue
  const isOverdue = React.useMemo(() => {
    if (!parsedDate) return false;
    return parsedDate < new Date() && parsedDate.toDateString() !== new Date().toDateString();
  }, [parsedDate]);

  // Check if date is today
  const isToday = React.useMemo(() => {
    if (!parsedDate) return false;
    return parsedDate.toDateString() === new Date().toDateString();
  }, [parsedDate]);

  // Check if date is tomorrow
  const isTomorrow = React.useMemo(() => {
    if (!parsedDate) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return parsedDate.toDateString() === tomorrow.toDateString();
  }, [parsedDate]);

  const getDisplayText = () => {
    if (!parsedDate) return placeholder;
    
    if (isToday) {
      return showTime ? `Hoy ${format(parsedDate, "HH:mm")}` : "Hoy";
    }
    if (isTomorrow) {
      return showTime ? `Mañana ${format(parsedDate, "HH:mm")}` : "Mañana";
    }
    
    const formatStr = showTime ? "d MMM HH:mm" : "d MMM yyyy";
    return format(parsedDate, formatStr, { locale: es });
  };

  if (compact) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant={parsedDate ? "secondary" : "ghost"}
                  size="sm"
                  disabled={disabled}
                  className={cn(
                    "h-7 gap-1.5 px-2 text-xs font-normal",
                    !parsedDate && "text-muted-foreground hover:text-foreground",
                    isOverdue && "bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-500",
                    isToday && !isOverdue && "bg-orange-500/10 text-orange-500",
                    className
                  )}
                >
                  <CalendarIcon className="h-3 w-3" />
                  {parsedDate ? getDisplayText() : "Fecha"}
                  {parsedDate && (
                    <X
                      className="h-3 w-3 opacity-60 hover:opacity-100"
                      onClick={handleClear}
                    />
                  )}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{parsedDate ? `Fecha límite: ${format(parsedDate, "PPP", { locale: es })}` : "Añadir fecha límite"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={parsedDate}
            onSelect={handleDateSelect}
            initialFocus
          />
          {showTime && (
            <div className="border-t p-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                value={time}
                onChange={handleTimeChange}
                className="w-28"
              />
            </div>
          )}
          {parsedDate && (
            <div className="border-t p-2 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-destructive hover:text-destructive"
              >
                Quitar fecha
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !parsedDate && "text-muted-foreground",
            isOverdue && "border-red-500/50 text-red-500",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getDisplayText()}
          {parsedDate && (
            <X
              className="ml-auto h-4 w-4 opacity-60 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parsedDate}
          onSelect={handleDateSelect}
          initialFocus
        />
        {showTime && (
          <div className="border-t p-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input
              type="time"
              value={time}
              onChange={handleTimeChange}
              className="w-28"
            />
          </div>
        )}
        {parsedDate && (
          <div className="border-t p-2 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-destructive hover:text-destructive"
            >
              Quitar fecha
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
