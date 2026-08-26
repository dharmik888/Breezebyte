type CounterName = 'http_requests_total' | 'http_errors_total' | 'dispatch_requests_total';

const counters: Record<CounterName, number> = {
  http_requests_total: 0,
  http_errors_total: 0,
  dispatch_requests_total: 0,
};

const startedAt = Date.now();

export function incrementCounter(name: CounterName) {
  counters[name] += 1;
}

export function getMetricsSnapshot() {
  return {
    startedAt: new Date(startedAt).toISOString(),
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    counters: { ...counters },
    memory: process.memoryUsage(),
    nodeVersion: process.version,
  };
}
