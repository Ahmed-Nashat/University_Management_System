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
    status: 200,
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
    status: 200,
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
    status: 200,
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
    status: 200,
  });
});

professorRouter.delete("/delete", async (req, res) => {
  const { search } = req.query;

  const professor = await professorService.deleteProfessor(search);

  return response({
    res,
    msg: "Professor deleted",
    data: professor,
    status: 200,
  });
});
