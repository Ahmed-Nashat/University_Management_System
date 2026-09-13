import { ProfessorModel } from "../../db/model/professor.model.js";
import { StudentModel } from "../../db/model/student.model.js";

export const addStudent = async (studentData) => {
  const student = await StudentModel.create(studentData);
  await student.reload({
    include: [
      {
        model: ProfessorModel,
        as: "academicAdvisor",
        attributes: ["name"],
      },
    ],
  });
  const { academicAdvisorId, academicAdvisor, ...studentResponse } =
    student.toJSON();

  return {
    ...studentResponse,
    academicAdvisorName: academicAdvisor?.name ?? null,
  };
};

export const deleteStudent = async (studentNumber) => {
  const exists = await StudentModel.findOne({
    where: {
      student_number: studentNumber,
    },
  });

  if (!exists) throw new Error("Student not found", { cause: 404 });

  return await exists.destroy();
};

export const updateStudent = async (studentNumber, studentData) => {
  const student = await StudentModel.findOne({
    where: {
      student_number: studentNumber,
    },
  });
  if (!student) {
    throw new Error("Student not found", { cause: 404 });
  }

  delete studentData.id;
  delete studentData.studentNumber;

  await student.update(studentData);

  await student.reload({
    include: [
      {
        model: ProfessorModel,
        as: "academicAdvisor",
        attributes: ["name"],
      },
    ],
  });

  const { academicAdvisorId, academicAdvisor, ...studentResponse } =
    student.toJSON();

  return {
    ...studentResponse,
    academicAdvisorName: academicAdvisor?.name ?? null,
  };
};

export const assignAcademicAdvisor = async (
  studentNumber,
  newAcademicAdvisorId,
) => {
  const student = await StudentModel.findOne({
    where: {
      student_number: studentNumber,
    },
  });
  if (!student) {
    throw new Error("Student not found", { cause: 404 });
  }

  const professor = await ProfessorModel.findOne({
    where: {
      id: newAcademicAdvisorId,
    },
  });
  if (!professor) {
    throw new Error("Professor not found", { cause: 404 });
  }

  const updatedStudent = await student.update({
    academic_advisor_id: newAcademicAdvisorId,
  });

  await student.reload({
    include: [
      {
        model: ProfessorModel,
        as: "academicAdvisor",
        attributes: ["name"],
      },
    ],
  });
  const { academicAdvisor } = updatedStudent.toJSON();

  return { newAcademicAdvisor: academicAdvisor?.name ?? null };
};

export const getAllStudents = async (data = {}) => {
  let { page, limit } = data;

  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);

  page = isNaN(parsedPage) || Number(parsedPage) < 1 ? 1 : parsedPage;
  limit = isNaN(parsedLimit) || parsedLimit < 1 ? 5 : parsedLimit;
  const offset = (page - 1) * limit;

  let { count, rows } = await StudentModel.findAndCountAll({
    limit,
    offset,
    paranoid: false,
    include: [
      {
        model: ProfessorModel,
        as: "academicAdvisor",
        attributes: ["name"],
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
