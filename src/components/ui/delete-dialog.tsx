"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReactNode } from "react";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string | ReactNode;
  isLoading?: boolean;
}

export function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  isLoading,
}: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md rounded-xl border-border/50 shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            {typeof description === 'string' ? (
              <div className="whitespace-pre-line text-sm text-muted-foreground">{description}</div>
            ) : (
              <div className="text-sm text-muted-foreground">{description}</div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel disabled={isLoading} className="rounded-lg">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-lg bg-destructive text-white hover:bg-destructive/90 border-0 shadow-sm"
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
