import { listAuditLogs } from "./grade.service.js";
import { Router } from "express";
import * as professorService from "./professor.service.js";
import { response } from "../../common/index.js";

export const professorRouter = Router();

professorRouter.post("/addProfessor", async (req, res) => {
  const professor = await professorService.addProfessor(req.body);

  return response({
    res,
    msg: "Professor created",
    data: professor,
    status: 201,
  });
});

professorRouter.get("/", async (req, res) => {
  const professors = await professorService.getAllProfessors(req.query);

  return response({
    res,
    msg: "Professors fetched",
    data: professors,
  });
});

professorRouter.patch("/update", async (req, res) => {
  const { email } = req.query,
    professorData = req.body;

  const professors = await professorService.updateProfessor(
    email,
    professorData,
  );

  return response({
    res,
    msg: "Professor updated",
    data: professors,
  });
});

professorRouter.post("/assignSection", async (req, res) => {
  const { sectionCode, professorId } = req.body;

  const professor = await professorService.assignSection(
    sectionCode,
    professorId,
  );

  return response({
    res,
    msg: "Sections assigned",
    data: professor,
  });
});

professorRouter.patch("/updatePassword", async (req, res) => {
  const { oldPassword, newPassword } = req.body,
    { email } = req.query;

  const professor = await professorService.updatePassword(
    email,
    oldPassword,
    newPassword,
  );

  return response({
    res,
    msg: "Password updated",
    data: professor,
  });
});

professorRouter.delete("/delete", async (req, res) => {
  const { search } = req.query;

  const professor = await professorService.deleteProfessor(search);

  return response({
    res,
    msg: "Professor deleted",
    data: professor,
  });
});

professorRouter.put("/updateFinalGrade", async (req, res, next) => {
  const { sectionId, finalGrade, studentNumber } = req.body,
    professorId = req.user.id;

  try {
    const updatedEnrollment = await professorService.updateFinalGrade({
      sectionId,
      finalGrade,
      studentNumber,
      professorId,
    });
    return response({
      res,
      msg: "Final grade updated",
      data: updatedEnrollment,
    });
  } catch (e) {
    next(e);
  }
});

professorRouter.put("/updatStatus", async (req, res, next) => {
  const { sectionId, status, studentNumber } = req.body,
    professorId = req.user.id;

  try {
    const updatedEnrollment = await professorService.udpateStatus({
      sectionId,
      status,
      studentNumber,
      professorId,
    });
    return response({
      res,
      msg: "status updated",
      data: updatedEnrollment,
    });
  } catch (e) {
    next(e);
  }
});

professorRouter.patch("/publishGrades", async (req, res, next) => {
  const { sectionId } = req.body,
    professorId = req.user.id;

  try {
    const result = await professorService.publishGrades({
      sectionId,
      professorId,
    });
    return response({
      res,
      msg: "Grades published",
      data: result,
    });
  } catch (e) {
    next(e);
  }
});

professorRouter.get("/auditLogs", async (req, res) => {
  const data = await listAuditLogs({ ...req.query, professorId: req.user.id });
  return response({ res, msg: "Audit logs fetched", data });
});
