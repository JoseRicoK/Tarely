import { useEffect, useCallback } from 'react';
import { autoSyncTaskOnChange } from '@/lib/sync-google-calendar';
import type { Task } from '@/lib/types';

export function useGoogleCalendarSync(task: Task | null, previousTask?: Task) {
  useEffect(() => {
    if (task && task.dueDate) {
      autoSyncTaskOnChange(task, previousTask).catch((error) => {
        console.error('Error auto-syncing task:', error);
      });
    }
  }, [task, previousTask]);
}

export function useManualSync() {
  const syncTask = useCallback(async (taskId: string, action: 'create' | 'update' | 'delete') => {
    try {
      const res = await fetch('/api/google-calendar/sync-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, action }),
      });

      if (!res.ok) {
        throw new Error('Failed to sync task');
      }

      return true;
    } catch (error) {
      console.error('Error syncing task:', error);
      return false;
    }
  }, []);

  return { syncTask };
}
