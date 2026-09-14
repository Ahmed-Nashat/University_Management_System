import { Router } from "express";
import * as departmentService from "./department.service.js";
import { response } from "../../common/index.js";

export const departmentRouter = Router();

departmentRouter.post("/create", async (req, res) => {
  const department = await departmentService.createDepartment(req.body);
  return response({
    res,
    msg: "Department created",
    data: department,
    status: 201,
  });
});

departmentRouter.patch("/update", async (req, res) => {
  const { id } = req.query,
    departmentData = req.body;
  const department = await departmentService.updateDepartment({
    id,
    departmentData,
  });

  return response({
    res,
    msg: "Department updated",
    data: department,
    status: 200,
  });
});

departmentRouter.delete("/delete", async (req, res) => {
  const { id } = req.query;
  const department = await departmentService.deleteDepartment(
    id,
    req.query?.hard,
  );

  return response({
    res,
    msg: department.isSoftDeleted()
      ? "Department soft deleted"
      : "Department hard deleted",
    data: department,
    status: 200,
  });
});

departmentRouter.get("/", async (req, res) => {
  const department = await departmentService.getAllDepartments(req.query);

  return response({
    res,
    msg: "Departments fetched",
    data: department,
    status: 200,
  });
});
