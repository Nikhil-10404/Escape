// utils/handleRateLimit.ts
import { emitRateLimit } from "./rateLimitBus";

export function handleRateLimit(error: any) {
  const res = error.response;
  if (!res) return false;

  // 🔴 HARD
  if (res.status === 429 && res.data?.code === "RATE_LIMIT_HARD") {
    emitRateLimit({
      title: "🛑 Spell Casting Blocked",
      message: res.data.error,
      retryAfter: res.data.retryAfter,
      hard: true,
    });
    return true;
  }

  return false;
}
