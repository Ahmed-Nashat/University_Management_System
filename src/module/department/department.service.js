import { Op } from "sequelize";
import {
  CourseModel,
  DepartmentModel,
  ProfessorModel,
  SectionModel,
} from "../../db/model/index.js";

export const createDepartment = async (departmentData) => {
  const { name, phoneNumber } = departmentData;
  const exists = await DepartmentModel.findOne({
    where: {
      [Op.or]: [{ name }, { phoneNumber }],
    },
  });

  if (exists) {
    throw new Error("This department is already exists", { cause: 409 });
  }
  return await DepartmentModel.create(departmentData);
};

export const updateDepartment = async ({
  departmentData,
  id: departmentId,
}) => {
  const department = await DepartmentModel.findByPk(departmentId);

  if (!department) {
    throw new Error("Department not found", { cause: 404 });
  }
  if (Object.hasOwn(departmentData, "id")) {
    delete departmentData.id;
    console.log(departmentData);
  }

  return await department.update(departmentData);
};

export const deleteDepartment = async (departmentId, hard) => {
  const department = await DepartmentModel.findByPk(departmentId);
  if (!department) throw new Error("Department not found", { cause: 404 });

  return await department.destroy({
    force: hard ? true : false,
  });
};

export const getAllDepartments = async (data = {}) => {
  let { page, limit } = data;

  page = isNaN(Number(page)) || Number(page) < 1 ? 1 : Number(page);
  limit = isNaN(Number(limit)) || Number(limit) < 1 ? 10 : Number(limit);
  const offset = (page - 1) * limit;

  const { count, rows } = await DepartmentModel.findAndCountAll({
    limit,
    offset,
    include: [
      {
        model: CourseModel,
        as: "courses",
        attributes: ["code", "name", "description"],
      },
      {
        model: ProfessorModel,
        as: "professors",
        attributes: ["name", "email"],
      },
    ],
  });
  const totalPage = Math.ceil(count / limit);
  return {
    rows,
    meta: {
      totalCount: count,
      totalPage,
      currentPage: page,
      pageLeft: totalPage >= page ? totalPage - page : "No page left",
    },
  };
};
