import express from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import courseRoutes from "./src/routes/course.routes.js";


const app = express();

app.use(cors());
app.use(express.json());
app.use(compression());
app.use(morgan("dev"));

app.use("/api/v1/courses", courseRoutes);

export default app;
