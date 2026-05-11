import { FastifyInstance } from 'fastify';
import { addSSEClient, removeSSEClient } from '../services/sseManager';

export function registerEventsRoutes(app: FastifyInstance) {
  app.get('/api/events', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    reply.raw.write('event: connected\ndata: {}\n\n');

    addSSEClient(reply);

    request.raw.on('close', () => {
      removeSSEClient(reply);
    });

    // Keep the connection open indefinitely
    return new Promise(() => {});
  });
}
