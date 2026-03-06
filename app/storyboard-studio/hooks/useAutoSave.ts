import { useEffect, useRef, useState } from 'react';

interface AutoSaveOptions {
  data: any;
  onSave: (data: any) => Promise<void>;
  interval?: number; // milliseconds, default 30000 (30 seconds)
  enabled?: boolean;
}

export function useAutoSave({ data, onSave, interval = 30000, enabled = true }: AutoSaveOptions) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dataRef = useRef(data);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Update ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Auto-save logic
  useEffect(() => {
    if (!enabled) return;

    const performSave = async () => {
      try {
        setIsSaving(true);
        setSaveError(null);
        await onSave(dataRef.current);
        setLastSaved(new Date());
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Save failed');
        console.error('Auto-save error:', error);
      } finally {
        setIsSaving(false);
      }
    };

    // Set up interval
    timerRef.current = setInterval(performSave, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [enabled, interval, onSave]);

  // Manual save function
  const saveNow = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      await onSave(dataRef.current);
      setLastSaved(new Date());
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Save failed');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    lastSaved,
    isSaving,
    saveError,
    saveNow,
  };
}

// Format last saved time for display
export function formatLastSaved(date: Date | null): string {
  if (!date) return 'Never';
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  
  return date.toLocaleDateString();
}
