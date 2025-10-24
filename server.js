import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./src/configs/mongo.config.js";



const PORT = process.env.PORT || 5001;

(async () => {
  await connectDB();
  app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
})();
