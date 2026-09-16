import { Router } from "express";
import * as courseService from "./course.service.js";
import { response } from "../../common/index.js";

export const courseRouter = Router();

courseRouter.post("/create", async (req, res) => {
  const course = await courseService.createCourse(req.body);
  return response({
    res,
    msg: "Course created",
    data: course,
    status: 201,
  });
});

courseRouter.patch("/update", async (req, res) => {
  if (!req.query.code) {
    throw new Error("Course code is required", { cause: 400 });
  }

  const course = await courseService.updateCourse({
    code: req.query.code,
    courseData: req.body,
  });

  return response({
    res,
    msg: "Course updated",
    data: course,
  });
});

courseRouter.delete("/delete", async (req, res) => {
  if (!req.query.code) {
    throw new Error("Course code is required", { cause: 400 });
  }

  const course = await courseService.deleteCourse(
    req.query.code,
    req.query.hard === "true",
  );

  return response({
    res,
    msg: req.query.hard === "true" ? "Course hard deleted" : "Course soft deleted",
    data: course,
  });
});

courseRouter.get("/", async (req, res) => {
  const courses = await courseService.getAllCourses(req.query);

  return response({
    res,
    msg: "Courses fetched",
    data: courses,
  });
});
