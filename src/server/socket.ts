import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { CORS_ORIGINS, JWT_SECRET } from '../config/security';
import { jwtVerify } from 'jose';

const secretKey = new TextEncoder().encode(JWT_SECRET);

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

  // Fase 2: Auth en handshake — evita que cualquier ws:// escuche totales de caja
  io.use(async (socket, next) => {
    try {
      const token =
        (socket.handshake.auth as any)?.token ||
        (socket.handshake.headers.cookie?.match(/(?:^|;\s*)tumifact_token=([^;]+)/)?.[1]
          ? decodeURIComponent(socket.handshake.headers.cookie.match(/(?:^|;\s*)tumifact_token=([^;]+)/)![1])
          : null) ||
        (socket.handshake.headers.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.substring(7)
          : null);

      if (!token) return next(new Error('No autorizado: token requerido para Socket.io'));

      await jwtVerify(token, secretKey);
      next();
    } catch {
      next(new Error('Token inválido para Socket.io'));
    }
  });

  io.on('connection', (socket) => {
    // console.log(`🔌 Cliente autenticado conectado: ${socket.id}`);

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
