const buckets = new Map()

const pruneBucket = (key, window_ms, now) => {
    const entries = buckets.get(key) || []
    const fresh = entries.filter((timestamp) => now - timestamp < window_ms)
    if (fresh.length) {
        buckets.set(key, fresh)
    } else {
        buckets.delete(key)
    }
    return fresh
}

export const rateLimit = ({
    window_ms = 60_000,
    max = 10,
    key_generator = (req) => req.decoded?.id || req.ip,
    message = 'Too many attempts. Please try again later.',
} = {}) => {
    return (req, res, next) => {
        const now = Date.now()
        const key = String(key_generator(req) || 'anonymous')
        const attempts = pruneBucket(key, window_ms, now)

        if (attempts.length >= max) {
            return res.status(429).json({
                success: false,
                message,
            })
        }

        attempts.push(now)
        buckets.set(key, attempts)
        next()
    }
}
