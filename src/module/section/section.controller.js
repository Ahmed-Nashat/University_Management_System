import { Router } from "express";
import * as sectionService from "./section.service.js";
import { response } from "../../common/index.js";

export const sectionRouter = Router();

sectionRouter.post("/createSection", async (req, res) => {
  const sectionData = req.body;
  const section = await sectionService.addSection(sectionData);

  return response({
    res,
    data: section,
    msg: "Section created",
    status: 201,
  });
});

sectionRouter.delete("/deleteSection", async (req, res) => {
  const { sectionId } = req.query;
  const section = await sectionService.deleteSection(sectionId);

  return response({
    res,
    data: section,
    msg: "Section deleted",
    status: 200,
  });
});

sectionRouter.delete("/hardDeleteSection", async (req, res) => {
  const { sectionId } = req.query;
  const section = await sectionService.hardDeleteSection(sectionId);

  return response({
    res,
    data: section,
    msg: "Section deleted",
    status: 200,
  });
});

sectionRouter.get("/", async (req, res) => {
  const section = await sectionService.getAllSections(req.query);

  return response({
    res,
    data: section,
    msg:
      section.meta.pageLeft === "No page left"
        ? "No section found"
        : "Sections fetched",
    status: 200,
  });
});

sectionRouter.patch("/updateSection", async (req, res) => {
  const { id } = req.query,
    sectionData = req.body;
  const section = await sectionService.updateSection({ id, sectionData });

  return response({
    res,
    data: section,
    msg: "Section updated",
    status: 200,
  });
});
