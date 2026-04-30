import { createApp } from './app';

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';

const app = createApp();

app.listen({ port, host }).then(() => {
  app.log.info(`AI Work Doc server running at http://${host}:${port}`);
}).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
