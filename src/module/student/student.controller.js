import { Router } from "express";
import { response } from "../../common/utils/index.js";
import * as studentService from "./student.service.js";

export const studentRouter = Router();

studentRouter.post("/addStudent", async (req, res, next) => {
  try {
    const student = await studentService.addStudent(req.body);

    return response({
      res,
      msg: "Student created",
      data: student,
      status: 201,
    });
  } catch (e) {
    next(e);
  }
});

studentRouter.delete("/deleteStudent", async (req, res, next) => {
  try {
    console.log(req.query.studentNumber);

    const student = await studentService.deleteStudent(req.query.studentNumber);

    return response({
      res,
      msg: "Student deleted",
      data: student,
      status: 200,
    });
  } catch (e) {
    next(e);
  }
});

studentRouter.patch("/updateStudent", async (req, res, next) => {
  try {
    const studentNumber = req.query.studentNumber,
      studentData = req.body;
    const student = await studentService.updateStudent(
      studentNumber,
      studentData,
    );

    return response({
      res,
      msg: "Student updated",
      data: student,
      status: 200,
    });
  } catch (e) {
    next(e);
  }
});

studentRouter.patch("/assignAcademicAdvisor", async (req, res, next) => {
  try {
    const studentNumber = req.query.studentNumber,
      { academicAdvisorId } = req.body;
    const student = await studentService.assignAcademicAdvisor(
      studentNumber,
      academicAdvisorId,
    );

    return response({
      res,
      msg: "Academic advisor assigned",
      data: student,
      status: 200,
    });
  } catch (e) {
    next(e);
  }
});

studentRouter.get("/", async (req, res) => {
  const students = await studentService.getAllStudents(req.query);

  return response({
    data: students,
    msg: "Students retrieved successfully",
    status: 200,
    res,
  });
});
