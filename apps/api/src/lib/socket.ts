import { Server as SocketIOServer } from 'socket.io';

export let io: SocketIOServer | null = null;

export function initSocketIO(server: any) {
  io = new SocketIOServer(server, {
    cors: { origin: '*', credentials: true },
  });
  io.on('connection', (socket) => {
    socket.on('disconnect', () => {});
  });
  return io;
}

export function emitEvent(event: string, payload: unknown) {
  if (io) io.emit(event, payload);
}
