import { RefObject, useEffect } from 'react';

export interface UseDismissableMenuOptions {
  isOpen: boolean;
  onClose: () => void;
  /** The trigger button — clicks on it don't count as "outside", and Escape
   *  returns focus here. */
  triggerRef: RefObject<HTMLElement | null>;
  /** The open panel — clicks inside it don't count as "outside" either. */
  panelRef: RefObject<HTMLElement | null>;
}

/**
 * Shared outside-click + Escape-to-close-and-refocus behavior for the
 * suite's small header popovers (per-app NavMenu, AllyCodeDropdown in its
 * floating variant). Not used by MobileNavPanel: portalled to
 * `document.body`, it has its own backdrop element to click and a full-panel
 * focus-trap concern this hook doesn't try to cover.
 */
export function useDismissableMenu({
  isOpen,
  onClose,
  triggerRef,
  panelRef,
}: UseDismissableMenuOptions): void {
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef, panelRef]);
}
