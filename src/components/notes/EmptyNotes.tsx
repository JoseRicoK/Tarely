"use client";

import { FileText, FolderPlus, FilePlus, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface EmptyNotesProps {
  hasWorkspace: boolean;
  onCreateNote: () => void;
  onCreateFolder: () => void;
  onOpenTemplates: () => void;
}

export function EmptyNotes({ hasWorkspace, onCreateNote, onCreateFolder, onOpenTemplates }: EmptyNotesProps) {
  const t = useTranslations('notes');
  
  if (!hasWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{t('selectWorkspace')}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {t('selectWorkspaceHint')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-ta)]/10 to-[var(--color-ta-secondary)]/10 flex items-center justify-center mb-6">
        <FileText className="h-10 w-10 text-[var(--color-ta)]/60" />
      </div>
      <h3 className="text-xl font-bold mb-2">{t('emptyTitle')}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-8">
        {t('emptyDescription')}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={onCreateNote} className="gap-2">
          <FilePlus className="h-4 w-4" />
          {t('newNote')}
        </Button>
        <Button variant="outline" onClick={onCreateFolder} className="gap-2">
          <FolderPlus className="h-4 w-4" />
          {t('newFolder')}
        </Button>
        <Button variant="outline" onClick={onOpenTemplates} className="gap-2">
          <Layout className="h-4 w-4" />
          {t('fromTemplate')}
        </Button>
      </div>
    </div>
  );
}
