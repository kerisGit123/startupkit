import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey;
        const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey;
        const altMatch = shortcut.altKey === undefined || shortcut.altKey === event.altKey;
        const metaMatch = shortcut.metaKey === undefined || shortcut.metaKey === event.metaKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && metaMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Predefined shortcuts for Manga Studio
export const MANGA_SHORTCUTS = {
  QUICK_ACTIONS: { key: 'k', metaKey: true, description: 'Quick Actions' },
  NEW_EPISODE: { key: 'n', metaKey: true, description: 'New Episode' },
  NEW_PAGE: { key: 'p', metaKey: true, description: 'New Page' },
  NEW_PANEL: { key: 'p', metaKey: true, shiftKey: true, description: 'New Panel' },
  SAVE: { key: 's', metaKey: true, description: 'Save' },
  EXPORT: { key: 'e', metaKey: true, description: 'Export' },
  NEXT_PANEL: { key: 'Tab', description: 'Next Panel' },
  PREV_PANEL: { key: 'Tab', shiftKey: true, description: 'Previous Panel' },
  UNDO: { key: 'z', metaKey: true, description: 'Undo' },
  REDO: { key: 'z', metaKey: true, shiftKey: true, description: 'Redo' },
  HELP: { key: '?', description: 'Show Keyboard Shortcuts' },
};
