import { Card } from '../../components/ui/Card';
import { PaymentPanel } from '../../components/ui/PaymentPanel';
import { SearchInput } from '../../components/ui/SearchInput';
import { TicketModal } from '../../components/ui/TicketModal';
import { usePosShortcuts } from './usePosShortcuts';

export function PosShell() {
  usePosShortcuts({});
  return (
    <div className="grid min-h-screen grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_360px]">
      <Card className="flex min-h-[70vh] flex-col">
        <h2 className="text-lg font-bold">Catálogo</h2>
        <SearchInput className="mt-3" />
        <p className="mt-2 text-sm text-slate-400">Búsqueda y productos</p>
      </Card>

      <div className="flex flex-col gap-4">
        <Card className="flex-1">
          <h2 className="text-lg font-bold">Carrito</h2>
          <p className="mt-2 text-sm text-slate-400">Items y totales</p>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Pago</h2>
          <PaymentPanel total={0} />
          <TicketModal />
        </Card>
      </div>
    </div>
  );
}
