import { createClient } from "redis";

export const redisClient = createClient({
  url: "redis://default:AKM5pU6SSo8DEKqPuvYWWpV5cF1I9b5V@redis-12489.crce179.ap-south-1-1.ec2.redns.redis-cloud.com:12489"
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));

await redisClient.connect();

console.log(await redisClient.ping());


