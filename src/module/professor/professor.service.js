import { updateGrades, publishSectionGrades } from "./grade.service.js";
import { Op } from "sequelize";
import {
  hashing,
  comparing,
  checkExisting,
  isTheOwner,
} from "../../common/index.js";
import {
  ProfessorModel,
  SectionModel,
  StudentModel,
  EnrollmentModel,
} from "../../db/model/index.js";

export const addProfessor = async (pfoessorData) => {
  const { password } = pfoessorData;

  const professor = await ProfessorModel.create(
    {
      ...pfoessorData,
      password: await hashing(password),
    },
    {},
  );
  return professor;
};

export const getAllProfessors = async (data = {}) => {
  let { limit, page } = data;

  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);

  page = isNaN(Number(page)) || Number(page) < 1 ? 1 : parsedPage;
  limit = isNaN(Number(limit)) || Number(limit) < 1 ? 10 : parsedLimit;
  const offset = (page - 1) * limit;

  const { count, rows } = await ProfessorModel.findAndCountAll({
    limit,
    offset,
    paranoid: false,
    include: [
      {
        model: SectionModel,
        as: "sections",
        attributes: ["sectionCode"],
      },
    ],
    attributes: {
      exclude: ["password"],
    },
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

export const updateProfessor = async (professorEmail, professorData) => {
  const { password, id, email, ...updates } = professorData;

  if (!password) {
    throw new Error("Current password is required", { cause: 400 });
  }

  const professor = await checkExisting({
    model: ProfessorModel,
    msg: "Professor not found",
    searchParameter: { email: professorEmail },
  });

  const isPasswordCorrect = await comparing({
    plainText: password,
    cipherText: professor.password,
  });
  if (!isPasswordCorrect) {
    throw new Error("Invalid password", { cause: 401 });
  }

  await professor.update(updates);
  await professor.reload({
    include: [
      {
        model: SectionModel,
        as: "sections",
        attributes: ["sectionCode"],
      },
    ],
  });
  return professor;
};

export const assignSection = async (sectionCode, professorId) => {
  const section = await checkExisting({
    model: SectionModel,
    msg: "Section not found",
    searchParameter: { sectionCode },
  });

  await checkExisting({
    model: ProfessorModel,
    msg: "Professor not found",
    searchParameter: { id: professorId },
  });

  await section.update({ professorId });
  await section.reload({
    include: [
      {
        model: ProfessorModel,
        as: "professor",
        attributes: ["name"],
      },
    ],
  });

  const {
    professorId: ignoredProfessorId,
    professor,
    ...sectionData
  } = section.toJSON();

  return {
    ...sectionData,
    professorName: professor?.name ?? null,
  };
};

export const updatePassword = async (email, oldPassword, newPassword) => {
  if (!oldPassword || !newPassword) {
    throw new Error("Old and new passwords are required", { cause: 400 });
  }

  const professor = await checkExisting({
    model: ProfessorModel,
    msg: "Professor not found",
    searchParameter: { email },
  });

  const isCorrectPassword = await comparing({
    plainText: oldPassword,
    cipherText: professor.password,
  });
  if (!isCorrectPassword)
    throw new Error("Invalid old password", { cause: 401 });

  await professor.update({
    password: await hashing(newPassword),
  });

  return professor;
};

export const deleteProfessor = async (search) => {
  const professor = await checkExisting({
    model: ProfessorModel,
    msg: "Professor not found",
    searchParameter: {
      [Op.or]: [{ email: search }, { phoneNumber: search }],
    },
  });

  return await professor.destroy();
};

export const updateFinalGrade = ({ professorId, sectionId, studentNumber, finalGrade }) =>
  updateGrades({ professorId, sectionId, studentNumber, updates: { finalGrade } });

export const udpateStatus = ({ professorId, sectionId, studentNumber, status }) =>
  updateGrades({ professorId, sectionId, studentNumber, updates: { status } });

export const publishGrades = publishSectionGrades;
