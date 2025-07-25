import * as Sentry from '@sentry/node';
import { dev, env, stack } from '@/env';

Sentry.init({
  enabled: !dev,
  dsn: env.SENTRY_DSN,
  environment: stack,
  tracesSampleRate: 0.1,
  tracePropagationTargets: [],
  sendDefaultPii: true,
});
