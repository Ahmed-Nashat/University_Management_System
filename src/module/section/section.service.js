import { checkExisting, isTheOwner } from "../../common/index.js";
import {
  CourseModel,
  EnrollmentModel,
  ProfessorModel,
  SectionModel,
  SemesterModel,
  StudentModel,
} from "../../db/model/index.js";

export const addSection = async (sectionData) => {
  const { professorId, courseId, semesterId, sectionCode } = sectionData;

  await checkExisting({
    model: SectionModel,
    searchParameter: { sectionCode, courseId, semesterId },
    msg: "Section already exists for this course and semester",
    statusCode: 409,
    isTrue: true,
  });

  const professor = await checkExisting({
    model: ProfessorModel,
    searchParameter: { id: professorId },
    msg: "Professor not found",
  });
  const course = await checkExisting({
    model: CourseModel,
    searchParameter: { id: courseId },
    msg: "Course not found",
  });

  const semester = await checkExisting({
    model: SemesterModel,
    searchParameter: { id: semesterId },
    msg: "Semester not found",
  });

  const section = await SectionModel.create(sectionData);
  await section.reload({
    include: [
      {
        model: ProfessorModel,
        as: "professor",
        attributes: ["name"],
      },
    ],
  });
  return section;
};

export const deleteSection = async (sectionId) => {
  const section = await checkExisting({
    model: SectionModel,
    searchParameter: { id: sectionId },
    msg: "Section not found",
  });

  const deletedSection = await section.reload({
    include: [
      {
        model: ProfessorModel,
        as: "professor",
        attributes: ["name"],
      },
    ],
  });

  return await deletedSection.destroy();
};

export const hardDeleteSection = async (sectionId) => {
  const section = await checkExisting({
    model: SectionModel,
    searchParameter: { id: sectionId },
    msg: "Section not found",
  });

  const deletedSection = await section.reload({
    include: [
      {
        model: ProfessorModel,
        as: "professor",
        attributes: ["name"],
      },
    ],
  });

  return await deletedSection.destroy({ force: true });
};

export const updateSection = async ({ sectionData, id: sectionId }) => {
  const section = await checkExisting({
    model: SectionModel,
    searchParameter: { id: sectionId },
    msg: "Section not found",
  });

  const {
    id: ignoredId,
    sectionCode: ignoredSectionCode,
    ...updates
  } = sectionData;

  if (Object.hasOwn(updates, "professorId")) {
    if (!updates.professorId) {
      throw new Error("Professor ID is required", { cause: 400 });
    }
    await checkExisting({
      model: ProfessorModel,
      searchParameter: { id: updates.professorId },
      msg: "Professor not found",
    });
  }

  if (Object.hasOwn(updates, "courseId")) {
    if (!updates.courseId) {
      throw new Error("Course ID is required", { cause: 400 });
    }
    await checkExisting({
      model: CourseModel,
      searchParameter: { id: updates.courseId },
      msg: "Course not found",
    });
  }

  if (Object.hasOwn(updates, "semesterId")) {
    if (!updates.semesterId) {
      throw new Error("Semester ID is required", { cause: 400 });
    }
    await checkExisting({
      model: SemesterModel,
      searchParameter: { id: updates.semesterId },
      msg: "Semester not found",
    });
  }

  const updatedSection = await section.update(updates);
  await updatedSection.reload({
    include: [
      {
        model: ProfessorModel,
        as: "professor",
        attributes: ["name", "email"],
      },
    ],
  });
  return updatedSection;
};

export const getAllSections = async (data = {}) => {
  let { page, limit } = data;
  const { admin } = data;

  page = isNaN(Number(page)) || Number(page) < 1 ? 1 : Number(page);
  limit = isNaN(Number(limit)) || Number(limit) < 1 ? 10 : Number(limit);
  const offset = (page - 1) * limit;

  const { count, rows } = await SectionModel.findAndCountAll({
    limit,
    offset,
    paranoid: admin ? false : true,
    include: [
      {
        model: ProfessorModel,
        as: "professor",
        attributes: ["name"],
      },
    ],
    attributes: {
      exclude: [],
    },
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

export const getSectionsRoaster = async ({
  professorId,
  sectionId,
  page,
  limit,
}) => {
  page = isNaN(Number(page)) || Number(page) < 1 ? 1 : Number(page);
  limit = isNaN(Number(limit)) || Number(limit) < 1 ? 10 : Number(limit);
  const offset = (page - 1) * limit;

  const section = await checkExisting({
    model: SectionModel,
    searchParameter: { id: sectionId },
    msg: "Section not found",
  });

  isTheOwner({ section, professorId });

  const { count, rows } = await EnrollmentModel.findAndCountAll({
    where: {
      sectionId,
    },
    limit,
    offset,
    distinct: true,
    order: [["id", "ASC"]],
    attributes: ["id", "status", "finalGrade", "gradeStatus", "enrolledAt"],
    include: [
      {
        model: StudentModel,
        attributes: ["id", "studentNumber", "firstName", "lastName", "userName", "email"],
      },
    ],
  });

  return {
    rows,
    meta: {
      totalCount: count,
      totalPage: Math.ceil(count / limit),
      currentPage: page,
    },
  };
};
