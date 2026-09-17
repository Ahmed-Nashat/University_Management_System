import { updateGrades } from "../professor/grade.service.js";
import { checkExisting } from "../../common/index.js";
import {
  CourseModel,
  EnrollmentModel,
  SectionModel,
  StudentModel,
} from "../../db/model/index.js";

const enrollmentIncludes = [
  {
    model: StudentModel,
    attributes: ["id", "studentNumber", "firstName", "lastName", "email"],
  },
  {
    model: SectionModel,
    attributes: [
      "id",
      "sectionCode",
      "room",
      "schedule",
      "dayOfWeek",
      "startTime",
      "endTime",
    ],
    include: [
      {
        model: CourseModel,
        attributes: ["id", "code", "name"],
      },
    ],
  },
];

export const createEnrollment = async ({
  studentId,
  sectionId,
  enrollmentData,
}) => {
  await checkExisting({
    model: StudentModel,
    searchParameter: { id: studentId },
    msg: "Student not found",
  });

  if (!sectionId) {
    throw new Error("Section ID is required", { cause: 400 });
  }

  await checkExisting({
    model: SectionModel,
    searchParameter: { id: sectionId },
    msg: "Section not found",
  });

  await checkExisting({
    model: EnrollmentModel,
    searchParameter: { studentId, sectionId },
    msg: "This student is already enrolled in this section",
    statusCode: 409,
    isTrue: true,
  });

  delete enrollmentData?.id;

  return EnrollmentModel.create({
    ...enrollmentData,
    studentId,
    sectionId,
  });
};

export const getEnrollment = async (enrollmentId) => {
  if (!enrollmentId) {
    throw new Error("Enrollment ID is required", { cause: 400 });
  }

  const enrollment = await checkExisting({
    model: EnrollmentModel,
    searchParameter: { id: enrollmentId },
    options: { include: enrollmentIncludes },
    msg: "Enrollment not found",
  });

  return enrollment;
};

export const getAllEnrollments = async (data = {}) => {
  let { page, limit } = data;

  page = isNaN(Number(page)) || Number(page) < 1 ? 1 : Number(page);
  limit = isNaN(Number(limit)) || Number(limit) < 1 ? 10 : Number(limit);
  const offset = (page - 1) * limit;

  const { count, rows } = await EnrollmentModel.findAndCountAll({
    limit,
    offset,
    distinct: true,
    include: enrollmentIncludes,
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

export const updateEnrollment = async ({ enrollmentId, enrollmentData, professorId }) => {
  const enrollment = await checkExisting({ model: EnrollmentModel, searchParameter: { id: enrollmentId }, msg: "Enrollment not found" });
  const student = await checkExisting({ model: StudentModel, searchParameter: { id: enrollment.studentId }, msg: "Student not found" });
  return updateGrades({ professorId, sectionId: enrollment.sectionId, studentNumber: student.studentNumber, updates: enrollmentData });
};

export const deleteEnrollment = async ({ enrollmentId, hard }) => {
  if (!enrollmentId) {
    throw new Error("Enrollment ID is required", { cause: 400 });
  }

  const enrollment = await checkExisting({
    model: EnrollmentModel,
    searchParameter: { id: enrollmentId },
    msg: "Enrollment not found",
  });

  await enrollment.destroy({ force: hard });
  return enrollment;
};
