type RateLimitPayload = {
  title: string;
  message: string;
  retryAfter: number; // seconds
  hard: boolean;
};

let listener: ((p: RateLimitPayload) => void) | null = null;

export function registerRateLimitListener(
  fn: (p: RateLimitPayload) => void
) {
  listener = fn;
}

export function emitRateLimit(payload: RateLimitPayload) {
  if (listener) listener(payload);
}
