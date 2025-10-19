// src/utils/redis.js
import Redis from "ioredis";

export const redisClient = new Redis({
  host: "127.0.0.1", // Memurai host
  port: 6379,        // Memurai default port
  maxRetriesPerRequest: null, 
  lazyConnect: true   // Connect when we want
});

// Event listeners
redisClient.on("connect", () => console.log("Redis connected"));
redisClient.on("error", (err) => console.error("Redis error:", err.message));

// Optional: connect immediately
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("Failed to connect Redis:", err.message);
  }
})();
