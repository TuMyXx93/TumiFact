import { useEffect } from 'react';

export function usePosShortcuts(handlers: {
  onSearch?: () => void;
  onDiscount?: () => void;
  onCharge?: () => void;
  onCancel?: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F2') {
        event.preventDefault();
        handlers.onSearch?.();
      }
      if (event.key === 'F4') {
        event.preventDefault();
        handlers.onDiscount?.();
      }
      if (event.key === 'F8') {
        event.preventDefault();
        handlers.onCharge?.();
      }
      if (event.key === 'Escape') {
        handlers.onCancel?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlers]);
}
