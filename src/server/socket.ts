import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { CORS_ORIGINS } from '../config/security';

export let io: SocketIOServer | null = null;

export const SOCKET_EVENTS = {
  // Facturación
  FACTURA_CREADA: 'factura:creada',
  // Caja
  CAJA_ABIERTA: 'caja:abierta',
  CAJA_CERRADA: 'caja:cerrada',
  // Separados
  SEPARADO_CREADO: 'separado:creado',
  ABONO_REGISTRADO: 'separado:abono',
  SEPARADO_COMPLETADO: 'separado:completado',
  // Inventario
  STOCK_CRITICO: 'inventario:stock_critico',
  STOCK_ACTUALIZADO: 'inventario:actualizado',
  // Devoluciones
  DEVOLUCION_CREADA: 'devolucion:creada'
} as const;

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: CORS_ORIGINS,
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    // console.log(`🔌 Cliente conectado a Socket.io: ${socket.id}`);

    socket.on('disconnect', () => {
      // console.log(`🔌 Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}

export function emitEvent(event: string, payload: any) {
  if (io) {
    io.emit(event, payload);
  }
}
