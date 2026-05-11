// ============================================
// RATE LIMITER
// Simple token bucket per socket
// No external libraries needed
// ============================================

interface BucketEntry {
  tokens: number
  lastRefill: number
}

interface RateLimitRule {
  maxTokens: number      // max requests allowed
  refillRate: number     // tokens added per second
  refillInterval: number // ms between refills
}

class RateLimiter {
  private buckets = new Map<string, BucketEntry>()
  private rules: Map<string, RateLimitRule>

  constructor() {
    this.rules = new Map([
      // 1 roll per 2 seconds
      ["roll-dice", {
        maxTokens: 1,
        refillRate: 1,
        refillInterval: 2000,
      }],
      // 1 move per second
      ["move-token", {
        maxTokens: 1,
        refillRate: 1,
        refillInterval: 1000,
      }],
      // 5 join attempts per minute
      ["join-room", {
        maxTokens: 5,
        refillRate: 1,
        refillInterval: 12000,
      }],
      // 3 create attempts per minute
      ["create-room", {
        maxTokens: 3,
        refillRate: 1,
        refillInterval: 20000,
      }],
      // 10 ready toggles per minute
      ["player-ready", {
        maxTokens: 10,
        refillRate: 1,
        refillInterval: 6000,
      }],
    ])
  }

  // ============================================
  // CHECK IF REQUEST IS ALLOWED
  // Returns true if allowed, false if rate limited
  // ============================================

  isAllowed(socketId: string, event: string): boolean {
    const rule = this.rules.get(event)
    if (!rule) return true // No rule = allow

    const key = `${socketId}:${event}`
    const now = Date.now()
    const bucket = this.buckets.get(key)

    if (!bucket) {
      // First request — create bucket with max tokens
      // minus 1 for this request
      this.buckets.set(key, {
        tokens: rule.maxTokens - 1,
        lastRefill: now,
      })
      return true
    }

    // Refill tokens based on time elapsed
    const elapsed = now - bucket.lastRefill
    const tokensToAdd = Math.floor(elapsed / rule.refillInterval)

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(
        rule.maxTokens,
        bucket.tokens + tokensToAdd
      )
      bucket.lastRefill = now
    }

    // Check if we have tokens available
    if (bucket.tokens <= 0) {
      return false // Rate limited
    }

    // Consume a token
    bucket.tokens -= 1
    return true
  }

  // ============================================
  // CLEAR BUCKETS FOR A SOCKET
  // Called when socket disconnects
  // ============================================

  clearSocket(socketId: string): void {
    const keysToDelete: string[] = []
    this.buckets.forEach((_, key) => {
      if (key.startsWith(`${socketId}:`)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach((key) => this.buckets.delete(key))
  }

  // ============================================
  // CLEANUP OLD BUCKETS
  // Run periodically to prevent memory leak
  // ============================================

  cleanup(): void {
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutes

    this.buckets.forEach((bucket, key) => {
      if (now - bucket.lastRefill > maxAge) {
        this.buckets.delete(key)
      }
    })
  }
}

export const rateLimiter = new RateLimiter()