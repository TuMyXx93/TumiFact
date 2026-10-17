import { useState } from 'react';
import { Button } from './Button';

export function TicketModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Ver ticket
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 text-slate-900 shadow-2xl">
            <h3 className="text-lg font-bold">Tique térmico</h3>
            <p className="mt-2 text-sm">Preview del ticket (80mm).</p>
            <Button className="mt-4 w-full" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
