import { Counter, Registry } from 'prom-client';

export const registry = new Registry();

export const messagesCounter = new Counter({
  name: 'app_messages_total',
  help: 'Total messages processed',
  labelNames: ['role', 'channel'],
  registers: [registry],
});

export const tokensCounter = new Counter({
  name: 'app_tokens_total',
  help: 'Total tokens estimated',
  labelNames: ['provider'],
  registers: [registry],
});

