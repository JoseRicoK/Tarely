"use client";

import { useState, useCallback } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Repeat, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecurrenceRule, RecurrenceFrequency } from "@/lib/types";
import {
  getRecurrenceLabel,
  RECURRENCE_PRESETS,
  FREQUENCY_OPTIONS,
  DAYS_OF_WEEK,
} from "@/lib/recurrence";

interface RecurrenceSelectorProps {
  value?: RecurrenceRule | null;
  onChange: (rule: RecurrenceRule | null) => void;
  compact?: boolean;
  disabled?: boolean;
}

export function RecurrenceSelector({
  value,
  onChange,
  compact = false,
  disabled = false,
}: RecurrenceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  
  // Estado local para edición personalizada
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    value?.frequency || "weekly"
  );
  const [interval, setInterval] = useState(value?.interval || 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    value?.daysOfWeek || []
  );
  const [dayOfMonth, setDayOfMonth] = useState<number | undefined>(
    value?.dayOfMonth
  );
  const [monthOfYear, setMonthOfYear] = useState<number | undefined>(
    value?.monthOfYear
  );
  const [dayOfYearly, setDayOfYearly] = useState<number | undefined>(
    value?.dayOfMonth
  );

  const hasRecurrence = !!value;

  const handlePresetSelect = useCallback(
    (rule: RecurrenceRule) => {
      // Si la frecuencia necesita más configuración, abrir el editor personalizado
      const needsConfig = rule.frequency === 'weekly' || rule.frequency === 'monthly' || rule.frequency === 'yearly';
      
      if (needsConfig) {
        // Cargar la regla en el editor personalizado
        setFrequency(rule.frequency);
        setInterval(rule.interval);
        setDaysOfWeek(rule.daysOfWeek || []);
        setDayOfMonth(rule.dayOfMonth);
        setMonthOfYear(undefined);
        setDayOfYearly(undefined);
        setShowCustom(true);
      } else {
        // Frecuencias sin config extra (daily) se aplican directamente
        onChange(rule);
        setOpen(false);
        setShowCustom(false);
      }
    },
    [onChange]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
      setShowCustom(false);
    },
    [onChange]
  );

  const handleCustomApply = useCallback(() => {
    const rule: RecurrenceRule = {
      frequency,
      interval: Math.max(1, interval),
    };

    if (frequency === "weekly" && daysOfWeek.length > 0) {
      rule.daysOfWeek = daysOfWeek;
    }

    if (frequency === "monthly" && dayOfMonth) {
      rule.dayOfMonth = dayOfMonth;
    }

    if (frequency === "yearly") {
      if (dayOfYearly) rule.dayOfMonth = dayOfYearly;
      if (monthOfYear) rule.monthOfYear = monthOfYear;
    }

    onChange(rule);
    setOpen(false);
  }, [frequency, interval, daysOfWeek, dayOfMonth, dayOfYearly, monthOfYear, onChange]);

  const toggleDayOfWeek = useCallback(
    (day: number) => {
      setDaysOfWeek((prev) =>
        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
      );
    },
    []
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen);
      if (isOpen && value) {
        // Sincronizar estado local con valor actual
        setFrequency(value.frequency);
        setInterval(value.interval);
        setDaysOfWeek(value.daysOfWeek || []);
        setDayOfMonth(value.dayOfMonth);
        setMonthOfYear(value.monthOfYear);
        setDayOfYearly(value.frequency === 'yearly' ? value.dayOfMonth : undefined);
        setShowCustom(true);
      } else if (isOpen) {
        setShowCustom(false);
      }
    },
    [value]
  );

  // Modo compacto (para TaskCard y contextos inline)
  if (compact) {
    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant={hasRecurrence ? "secondary" : "ghost"}
                  size="sm"
                  disabled={disabled}
                  className={cn(
                    "h-7 gap-1.5 text-xs",
                    hasRecurrence
                      ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 border border-violet-500/20"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Repeat className="h-3 w-3" />
                  {hasRecurrence ? (
                    <>
                      <span className="hidden sm:inline max-w-[120px] truncate">
                        {getRecurrenceLabel(value)}
                      </span>
                      <span
                        role="button"
                        aria-label="Quitar recurrencia"
                        onClick={(e) => { e.stopPropagation(); handleRemove(e); }}
                        className="ml-0.5 hover:bg-violet-500/20 rounded-full p-0.5 cursor-pointer"
                      >
                        <X className="h-2.5 w-2.5" />
                      </span>
                    </>
                  ) : null}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              {hasRecurrence
                ? getRecurrenceLabel(value)
                : "Añadir recurrencia"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <PopoverContent className="w-72 p-0" align="start">
          <RecurrencePopoverContent
            showCustom={showCustom}
            setShowCustom={setShowCustom}
            frequency={frequency}
            setFrequency={setFrequency}
            interval={interval}
            setInterval={setInterval}
            daysOfWeek={daysOfWeek}
            toggleDayOfWeek={toggleDayOfWeek}
            dayOfMonth={dayOfMonth}
            setDayOfMonth={setDayOfMonth}
            monthOfYear={monthOfYear}
            setMonthOfYear={setMonthOfYear}
            dayOfYearly={dayOfYearly}
            setDayOfYearly={setDayOfYearly}
            onPresetSelect={handlePresetSelect}
            onCustomApply={handleCustomApply}
            onRemove={value ? handleRemove : undefined}
          />
        </PopoverContent>
      </Popover>
    );
  }

  // Modo Normal (para TaskDialog, Task Detail)
  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between",
            hasRecurrence &&
              "border-violet-500/30 bg-violet-500/5 text-violet-700 dark:text-violet-300"
          )}
        >
          <div className="flex items-center gap-2">
            <Repeat className={cn("h-4 w-4", hasRecurrence && "text-violet-500")} />
            <span>
              {hasRecurrence ? getRecurrenceLabel(value) : "Sin recurrencia"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {hasRecurrence && (
              <span
                role="button"
                aria-label="Quitar recurrencia"
                onClick={(e) => { e.stopPropagation(); handleRemove(e); }}
                className="hover:bg-violet-500/20 rounded-full p-1 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <RecurrencePopoverContent
          showCustom={showCustom}
          setShowCustom={setShowCustom}
          frequency={frequency}
          setFrequency={setFrequency}
          interval={interval}
          setInterval={setInterval}
          daysOfWeek={daysOfWeek}
          toggleDayOfWeek={toggleDayOfWeek}
          dayOfMonth={dayOfMonth}
          setDayOfMonth={setDayOfMonth}
          monthOfYear={monthOfYear}
          setMonthOfYear={setMonthOfYear}
          dayOfYearly={dayOfYearly}
          setDayOfYearly={setDayOfYearly}
          onPresetSelect={handlePresetSelect}
          onCustomApply={handleCustomApply}
          onRemove={value ? handleRemove : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}

// ============= Contenido del Popover =============

interface RecurrencePopoverContentProps {
  showCustom: boolean;
  setShowCustom: (v: boolean) => void;
  frequency: RecurrenceFrequency;
  setFrequency: (v: RecurrenceFrequency) => void;
  interval: number;
  setInterval: (v: number) => void;
  daysOfWeek: number[];
  toggleDayOfWeek: (day: number) => void;
  dayOfMonth: number | undefined;
  setDayOfMonth: (v: number | undefined) => void;
  monthOfYear: number | undefined;
  setMonthOfYear: (v: number | undefined) => void;
  dayOfYearly: number | undefined;
  setDayOfYearly: (v: number | undefined) => void;
  onPresetSelect: (rule: RecurrenceRule) => void;
  onCustomApply: () => void;
  onRemove?: (e: React.MouseEvent) => void;
}

const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

function RecurrencePopoverContent({
  showCustom,
  setShowCustom,
  frequency,
  setFrequency,
  interval,
  setInterval,
  daysOfWeek,
  toggleDayOfWeek,
  dayOfMonth,
  setDayOfMonth,
  monthOfYear,
  setMonthOfYear,
  dayOfYearly,
  setDayOfYearly,
  onPresetSelect,
  onCustomApply,
  onRemove,
}: RecurrencePopoverContentProps) {
  if (showCustom) {
    return (
      <div className="p-3 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Personalizar</h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setShowCustom(false)}
          >
            ← Presets
          </Button>
        </div>

        {/* Cada N frecuencia */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Cada</span>
          <Input
            type="number"
            min={1}
            max={365}
            value={interval}
            onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
            className="w-16 h-8 text-sm"
          />
          <Select
            value={frequency}
            onValueChange={(v) => setFrequency(v as RecurrenceFrequency)}
          >
            <SelectTrigger className="h-8 text-sm flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Días de la semana (solo para weekly) */}
        {frequency === "weekly" && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Días de la semana
            </label>
            <div className="flex gap-1">
              {DAYS_OF_WEEK.map(({ value: day, label }) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDayOfWeek(day)}
                  className={cn(
                    "h-8 w-8 rounded-full text-xs font-medium transition-all",
                    daysOfWeek.includes(day)
                      ? "bg-violet-500 text-white shadow-sm"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Día del mes (solo para monthly) */}
        {frequency === "monthly" && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Día del mes
            </label>
            <Input
              type="number"
              min={1}
              max={31}
              value={dayOfMonth || ""}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                setDayOfMonth(isNaN(v) ? undefined : Math.min(31, Math.max(1, v)));
              }}
              placeholder="Mismo día"
              className="h-8 text-sm"
            />
          </div>
        )}

        {/* Mes y día del año (solo para yearly) */}
        {frequency === "yearly" && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Fecha del año
            </label>
            <div className="flex items-center gap-2">
              <Select
                value={monthOfYear?.toString() || ""}
                onValueChange={(v) => setMonthOfYear(v ? parseInt(v) : undefined)}
              >
                <SelectTrigger className="h-8 text-sm flex-1">
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={1}
                max={31}
                value={dayOfYearly || ""}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  setDayOfYearly(isNaN(v) ? undefined : Math.min(31, Math.max(1, v)));
                }}
                placeholder="Día"
                className="w-16 h-8 text-sm"
              />
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-2">
          <Button size="sm" onClick={onCustomApply} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">
            Aplicar
          </Button>
          {onRemove && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRemove}
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              Quitar
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Vista de presets
  return (
    <div className="p-1">
      <div className="px-2 py-1.5">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Repetir
        </h4>
      </div>
      {RECURRENCE_PRESETS.map((preset, i) => (
        <button
          key={i}
          className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
          onClick={() => onPresetSelect(preset.rule)}
        >
          <Repeat className="h-3.5 w-3.5 text-violet-500" />
          {preset.label}
        </button>
      ))}
      <div className="border-t mt-1 pt-1">
        <button
          className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
          onClick={() => setShowCustom(true)}
        >
          <span className="text-violet-500 font-medium">⚙</span>
          Personalizar...
        </button>
      </div>
      {onRemove && (
        <div className="border-t mt-1 pt-1">
          <button
            className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-destructive/10 text-destructive transition-colors text-left"
            onClick={onRemove}
          >
            <X className="h-3.5 w-3.5" />
            Quitar recurrencia
          </button>
        </div>
      )}
    </div>
  );
}

// ============= Badge de indicador visual para listas =============

interface RecurrenceBadgeProps {
  recurrence: RecurrenceRule;
  compact?: boolean;
}

export function RecurrenceBadge({ recurrence, compact = false }: RecurrenceBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "gap-1 border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium",
              compact ? "text-[10px] md:text-xs px-1.5 py-0 h-5 md:h-[22px]" : "text-xs px-2 py-0.5"
            )}
          >
            <Repeat className={cn(compact ? "h-3 w-3" : "h-3 w-3")} />
            {!compact && (
              <span className="max-w-[100px] truncate">
                {getRecurrenceLabel(recurrence)}
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getRecurrenceLabel(recurrence)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
