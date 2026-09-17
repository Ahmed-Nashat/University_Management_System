import { Op } from "sequelize";
import { CourseModel, DepartmentModel } from "../../db/model/index.js";
import { checkExisting } from "../../common/index.js";

export const createCourse = async (courseData) => {
  const { name, code, departmentId } = courseData;

  await checkExisting({
    model: DepartmentModel,
    searchParameter: { id: departmentId },
    msg: "Department not found",
  });

  await checkExisting({
    model: CourseModel,
    searchParameter: { [Op.or]: [{ name }, { code }] },
    options: { paranoid: false },
    msg: "Course code or name already exists",
    statusCode: 409,
    isTrue: true,
  });

  return await CourseModel.create(courseData);
};

export const updateCourse = async ({ code: courseCode, courseData }) => {
  const { id, code, name, ...allowedUpdates } = courseData;

  const course = await checkExisting({
    model: CourseModel,
    searchParameter: { code: courseCode },
    msg: "Course not found",
  });

  if (Object.hasOwn(courseData, "departmentId")) {
    await checkExisting({
      model: DepartmentModel,
      searchParameter: { id: departmentId },
      msg: "Department not found",
    });
  }
  return await course.update(allowedUpdates);
};

export const deleteCourse = async (courseCode, hard) => {
  const course = await checkExisting({
    model: CourseModel,
    searchParameter: { code: courseCode },
    options: { paranoid: !hard },
    msg: "Course not found",
  });

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
