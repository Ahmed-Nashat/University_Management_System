import {
  CourseModel,
  ProfessorModel,
  SectionModel,
  SemesterModel,
} from "../../db/model/index.js";

export const addSection = async (sectionData) => {
  const { professorId, courseId, semesterId, sectionCode } = sectionData;

  const isSection = await SectionModel.findOne({
    where: { sectionCode, courseId, semesterId },
  });
  if (isSection) {
    throw new Error("Section already exists for this course and semester", {
      cause: 409,
    });
  }

  const professor = await ProfessorModel.findByPk(professorId);
  if (!professor) throw new Error("Professor not found", { cause: 404 });

  const course = await CourseModel.findByPk(courseId);
  if (!course) throw new Error("Course not found", { cause: 404 });

  const semester = await SemesterModel.findByPk(semesterId);
  if (!semester) throw new Error("Semester not found", { cause: 404 });

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
  const section = await SectionModel.findByPk(sectionId);
  if (!section) throw new Error("Section not found", { cause: 404 });

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
  const section = await SectionModel.findByPk(sectionId);
  if (!section) throw new Error("Section not found", { cause: 404 });

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
  const section = await SectionModel.findByPk(sectionId);
  if (!section) throw new Error("Section not found", { cause: 404 });

  const { id: ignoredId, sectionCode: ignoredSectionCode, ...updates } =
    sectionData;

  if (Object.hasOwn(updates, "professorId")) {
    if (!updates.professorId) {
      throw new Error("Professor ID is required", { cause: 400 });
    }

    const professor = await ProfessorModel.findByPk(updates.professorId);
    if (!professor) throw new Error("Professor not found", { cause: 404 });
  }

  if (Object.hasOwn(updates, "courseId")) {
    if (!updates.courseId) {
      throw new Error("Course ID is required", { cause: 400 });
    }

    const course = await CourseModel.findByPk(updates.courseId);
    if (!course) throw new Error("Course not found", { cause: 404 });
  }

  if (Object.hasOwn(updates, "semesterId")) {
    if (!updates.semesterId) {
      throw new Error("Semester ID is required", { cause: 400 });
    }

    const semester = await SemesterModel.findByPk(updates.semesterId);
    if (!semester) throw new Error("Semester not found", { cause: 404 });
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
      exclude: ["professorId"],
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
