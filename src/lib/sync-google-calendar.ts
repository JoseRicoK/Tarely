import type { Task } from './types';

export async function syncTaskToGoogleCalendar(
  taskId: string,
  action: 'create' | 'update' | 'delete'
): Promise<boolean> {
  try {
    const res = await fetch('/api/google-calendar/sync-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, action }),
    });

    return res.ok;
  } catch (error) {
    console.error('Error syncing task to Google Calendar:', error);
    return false;
  }
}

export async function shouldSyncTask(task: Task): Promise<boolean> {
  if (!task.dueDate) return false;

  try {
    const res = await fetch('/api/google-calendar/status');
    const data = await res.json();
    return data.connected && !data.isExpired;
  } catch {
    return false;
  }
}

export async function autoSyncTaskOnChange(
  task: Task,
  previousTask?: Task
): Promise<void> {
  const isConnected = await shouldSyncTask(task);
  
  if (!isConnected) return;

  if (!previousTask) {
    if (task.dueDate) {
      await syncTaskToGoogleCalendar(task.id, 'create');
    }
    return;
  }

  const hadDueDate = !!previousTask.dueDate;
  const hasDueDate = !!task.dueDate;

  if (!hadDueDate && hasDueDate) {
    await syncTaskToGoogleCalendar(task.id, 'create');
  } else if (hadDueDate && !hasDueDate) {
    await syncTaskToGoogleCalendar(task.id, 'delete');
  } else if (hadDueDate && hasDueDate) {
    if (
      task.dueDate !== previousTask.dueDate ||
      task.title !== previousTask.title ||
      task.description !== previousTask.description
    ) {
      await syncTaskToGoogleCalendar(task.id, 'update');
    }
  }
}
