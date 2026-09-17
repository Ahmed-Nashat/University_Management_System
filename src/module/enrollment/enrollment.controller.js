import { Router } from "express";
import * as enrollmentService from "./enrollment.service.js";
import { response } from "../../common/index.js";

export const enrollmentRouter = Router();

enrollmentRouter.post("/create", async (req, res, next) => {
  const { studentId } = req.query;
  const { sectionId, ...enrollmentData } = req.body;
  try {
    const enrollment = await enrollmentService.createEnrollment({
      studentId,
      enrollmentData,
      sectionId,
    });
    return response({
      res,
      msg: "Enrollment created",
      data: enrollment,
      status: 201,
    });
  } catch (e) {
    next(e);
  }
});

enrollmentRouter.get("/getEnrollment", async (req, res, next) => {
  try {
    const enrollment = await enrollmentService.getEnrollment(
      req.query.enrollmentId,
    );

    return response({
      res,
      msg: "Enrollment fetched",
      data: enrollment,
      status: 200,
    });
  } catch (e) {
    next(e);
  }
});

enrollmentRouter.get("/", async (req, res, next) => {
  try {
    const enrollments = await enrollmentService.getAllEnrollments(req.query);

    return response({
      res,
      msg: enrollments.rows.length ? "Enrollments fetched" : "No enrollments found",
      data: enrollments,
      status: 200,
    });
  } catch (e) {
    next(e);
  }
});

enrollmentRouter.patch("/updateEnrollment", async (req, res, next) => {
  try {
    const enrollment = await enrollmentService.updateEnrollment({
      enrollmentId: req.query.enrollmentId,
      enrollmentData: req.body,
      professorId: req.user.id,
    });

    return response({
      res,
      msg: "Enrollment updated",
      data: enrollment,
      status: 200,
    });
  } catch (e) {
    next(e);
  }
});

enrollmentRouter.delete("/deleteEnrollment", async (req, res, next) => {
  try {
    const enrollment = await enrollmentService.deleteEnrollment({
      enrollmentId: req.query.enrollmentId,
      hard: false,
    });

    return response({
      res,
      msg: "Enrollment deleted",
      data: enrollment,
      status: 200,
    });
  } catch (e) {
    next(e);
  }
});

enrollmentRouter.delete("/hardDeleteEnrollment", async (req, res, next) => {
  try {
    const enrollment = await enrollmentService.deleteEnrollment({
      enrollmentId: req.query.enrollmentId,
      hard: true,
    });

    return response({
      res,
      msg: "Enrollment hard deleted",
      data: enrollment,
      status: 200,
    });
  } catch (e) {
    next(e);
  }
});
