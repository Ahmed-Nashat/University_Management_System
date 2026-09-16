import express from "express";
import config from "./config/config.service.js";
import { checkdb } from "./db/connection.js";
import { setupAssociations } from "./db/model/index.js";
import { errorHandler } from "./common/index.js";
import * as routers from "./module/index.js";
import { authRouter, requireSession } from "./module/auth/auth.controller.js";
import { studentPortalRouter } from "./module/auth/student-portal.controller.js";
import { protectWrites, requireProfessor } from "./module/auth/session.js";

const app = express();
const port = config.port;

app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use(protectWrites);

setupAssociations();
await checkdb();

app.use("/auth", authRouter);
app.use(requireSession);
app.use("/portal", studentPortalRouter);
app.use(requireProfessor);

app.use("/students", routers.studentRouter);
app.use("/professors", routers.professorRouter);
app.use("/sections", routers.sectionRouter);
app.use("/departments", routers.departmentRouter);
app.use("/courses", routers.courseRouter);
app.use("/semesters", routers.semesterRouter);
app.use("/enrollments", routers.enrollmentRouter);

app.use(errorHandler);
app.listen(port, () => {
  console.log("Server is running on port:", port);
});
