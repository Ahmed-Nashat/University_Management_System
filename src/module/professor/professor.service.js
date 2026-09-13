import { Op } from "sequelize";
import { hashing, comparing } from "../../common/index.js";
import { ProfessorModel } from "../../db/model/professor.model.js";
import { SectionModel } from "../../db/model/section.model.js";

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

  const professor = await ProfessorModel.findOne({
    where: { email: professorEmail },
  });
  if (!professor) throw new Error("Professor not found", { cause: 404 });

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
  const sectionExists = await SectionModel.findOne({
    where: {
      sectionCode,
    },
  });
  if (!sectionExists) throw new Error("Section not found", { cause: 404 });

  const professorExists = await ProfessorModel.findByPk(professorId);
  if (!professorExists)
    throw new Error("Professor not found", { cause: 404 });

  await sectionExists.update({ professorId });
  await sectionExists.reload({
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
  } = sectionExists.toJSON();

  return {
    ...sectionData,
    professorName: professor?.name ?? null,
  };
};

export const updatePassword = async (email, oldPassword, newPassword) => {
  if (!oldPassword || !newPassword) {
    throw new Error("Old and new passwords are required", { cause: 400 });
  }

  const professor = await ProfessorModel.findOne({ where: { email } });
  if (!professor) throw new Error("Professor not found", { cause: 404 });

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
  const professor = await ProfessorModel.findOne({
    where: {
      [Op.or]: [{ email: search }, { phoneNumber: search }],
    },
  });
  if (!professor) throw new Error("Professor not found", { cause: 404 });

  return await professor.destroy();
};
