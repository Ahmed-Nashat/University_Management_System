import { Op } from "sequelize";
import { CourseModel, DepartmentModel } from "../../db/model/index.js";

export const createCourse = async (courseData) => {
  const { name, code, departmentId } = courseData;

  const department = await DepartmentModel.findByPk(departmentId);

  if (!department) {
    throw new Error("Department not found", { cause: 404 });
  }

  const exists = await CourseModel.findOne({
    where: {
      [Op.or]: [{ name }, { code }],
    },
    paranoid: false,
  });

  if (exists) {
    throw new Error("Course code or name already exists", { cause: 409 });
  }

  return await CourseModel.create(courseData);
};

export const updateCourse = async ({ code: courseCode, courseData }) => {
  const { id, code, name, ...allowedUpdates } = courseData;

  const course = await CourseModel.findOne({
    where: {
      code: courseCode,
    },
  });
  if (!course) {
    throw new Error("Course not found", { cause: 404 });
  }

  if (Object.hasOwn(courseData, "departmentId")) {
    const department = await DepartmentModel.findByPk(courseData.departmentId);

    if (!department) {
      throw new Error("Department not found", { cause: 404 });
    }
  }
  return await course.update(allowedUpdates);
};

export const deleteCourse = async (courseCode, hard) => {
  const course = await CourseModel.findOne({
    where: { code: courseCode },
    paranoid: !hard,
  });
  if (!course) throw new Error("Course not found", { cause: 404 });

  return await course.destroy({
    force: hard ? true : false,
  });
};

export const getAllCourses = async (data = {}) => {
  let { page, limit } = data;

  page = isNaN(Number(page)) || Number(page) < 1 ? 1 : Number(page);
  limit = isNaN(Number(limit)) || Number(limit) < 1 ? 10 : Number(limit);
  const offset = (page - 1) * limit;

  const { count, rows } = await CourseModel.findAndCountAll({
    limit,
    offset,
    include: [
      {
        model: DepartmentModel,
        as: "department",
        attributes: ["name"],
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
