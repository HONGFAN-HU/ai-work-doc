import type { FastifyReply } from 'fastify';

const clients = new Set<FastifyReply>();

export function addSSEClient(reply: FastifyReply) {
  clients.add(reply);
}

export function removeSSEClient(reply: FastifyReply) {
  clients.delete(reply);
}

export function sseBroadcast(event: string, data: unknown) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.raw.write(message);
    } catch {
      clients.delete(client);
    }
  }
}
