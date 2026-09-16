import { Router } from "express";
import * as semesterService from "./semester.service.js";
import { response } from "../../common/index.js";

export const semesterRouter = Router();

semesterRouter.post("/create", async (req, res, next) => {
  try {
    const semester = await semesterService.createSemester(req.body);
    return response({
      res,
      msg: "Semester created",
      data: semester,
      status: 201,
    });
  } catch (e) {
    next(e);
  }
});

semesterRouter.patch("/update", async (req, res, next) => {
  const { semesterId } = req.query,
    { id, ...semesterData } = req.body;
  try {
    if (!semesterId) {
      throw new Error("Semester ID is required", { cause: 400 });
    }

    const semester = await semesterService.updateSemester({
      semesterId,
      semesterData,
    });
    return response({
      res,
      msg: "Semester updated",
      data: semester,
      status: 200,
    });
  } catch (e) {
    next(e);
  }
});

semesterRouter.delete("/delete", async (req, res, next) => {
  const { semesterId, hard } = req.query;
  try {
    if (!semesterId) {
      throw new Error("Semester ID is required", { cause: 400 });
    }

    const isHardDelete = hard === "true";
    const semester = await semesterService.deleteSemester({
      semesterId,
      hard: isHardDelete,
    });
    return response({
      res,
      msg: isHardDelete ? "Semester hard deleted" : "Semester soft deleted",
      data: semester,
      status: 200,
    });
  } catch (e) {
    next(e);
  }
});

semesterRouter.get("/", async (req, res, next) => {
  const { page, limit } = req.query;
  try {
    const semesters = await semesterService.getAllSemesters({ page, limit });
    const semesterCount = semesters.semesters.length;

    return response({
      res,
      msg:
        semesterCount === 0
          ? "No semesters found"
          : semesterCount === 1
            ? "Semester fetched"
            : "Semesters fetched",
      data: semesters,
    });
  } catch (e) {
    next(e);
  }
});
