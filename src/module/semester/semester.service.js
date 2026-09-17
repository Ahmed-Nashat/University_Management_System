import { checkExisting } from "../../common/index.js";
import { SectionModel, SemesterModel } from "../../db/model/index.js";
import { Op } from "sequelize";

const validateDates = ({ startDate, endDate }) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid semester dates", { cause: 400 });
  }

  if (end <= start) {
    throw new Error("End date must be after start date", { cause: 400 });
  }
};

const ensureSemesterIsUnique = async ({ academicYear, term, semesterId }) => {
  const where = { academicYear, term };

  if (semesterId) {
    where.id = { [Op.ne]: semesterId };
  }

  await checkExisting({
    model: SemesterModel,
    searchParameter: { where },
    options: { paranoid: false },
    msg: "Semester already exists for this academic year",
    statusCode: 409,
    isTrue: true,
  });
};

export const createSemester = async (semesterData) => {
  validateDates(semesterData);

  if (semesterData.academicYear && semesterData.term) {
    await ensureSemesterIsUnique(semesterData);
  }

  return await SemesterModel.create(semesterData);
};

export const updateSemester = async ({ semesterId, semesterData }) => {
  if (!semesterId) {
    throw new Error("Semester ID is required", { cause: 400 });
  }

  const semester = await checkExisting({
    model: SemesterModel,
    searchParameter: { id: semesterId },
    msg: "Semester not found",
  });

  const updatedSemesterData = {
    ...semester.get(),
    ...semesterData,
  };

  validateDates(updatedSemesterData);
  if (
    Object.hasOwn(semesterData, "academicYear") ||
    Object.hasOwn(semesterData, "term")
  ) {
    await ensureSemesterIsUnique({
      ...updatedSemesterData,
      semesterId,
    });
  }

  delete semesterData.id;

  return await semester.update(semesterData);
};

export const deleteSemester = async ({ semesterId, hard }) => {
  if (!semesterId) {
    throw new Error("Semester ID is required", { cause: 400 });
  }

  const semester = await checkExisting({
    model: SemesterModel,
    searchParameter: { id: semesterId },
    options: { paranoid: !hard },
    msg: "Semester already exists for this academic year",
    statusCode: 409,
    isTrue: true,
  });
  return semester.destroy({ force: hard });
};

export const getAllSemesters = async ({ page, limit }) => {
  page = isNaN(Number(page)) || Number(page) < 1 ? 1 : Number(page);
  limit = isNaN(Number(limit)) || Number(limit) < 1 ? 10 : Number(limit);
  const offset = (page - 1) * limit;

  const { count, rows } = await SemesterModel.findAndCountAll({
    distinct: true,
    limit,
    offset,
    include: [
      {
        model: SectionModel,
        as: "sections",
        attributes: ["sectionCode"],
      },
    ],
  });
  const totalPage = Math.ceil(count / limit);

  return {
    semesters: rows,
    count,
    totalPage,
    currentPage: totalPage === 0 ? 1 : Math.min(page, totalPage),
  };
};
