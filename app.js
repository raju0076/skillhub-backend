import express from "express";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import courseRoutes from "./src/routes/course.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import InstructorRoutes from "./src/routes/instructor.routes.js";
import studentRoutes from "./src/routes/student.routes.js";
import analyticRoutes from "./src/routes/analytics.routes.js";


const app = express();

app.use(cors());
app.use(express.json());
app.use(compression());
app.use(morgan("dev"));

app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/instructor", InstructorRoutes);
app.use("/api/v1/students",studentRoutes)
app.use("/api/v1/analytics",analyticRoutes)
console.log("Course routes registered");


export default app;
