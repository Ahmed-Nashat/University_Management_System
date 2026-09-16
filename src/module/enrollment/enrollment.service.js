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
    attributes: ["id", "sectionCode", "room", "schedule"],
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
  const student = await StudentModel.findByPk(studentId);
  if (!student) throw new Error("Student not found", { cause: 404 });

  if (!sectionId) {
    throw new Error("Section ID is required", { cause: 400 });
  }

  const section = await SectionModel.findByPk(sectionId);
  if (!section) throw new Error("Section not found", { cause: 404 });

  const enrollment = await EnrollmentModel.findOne({
    where: { studentId, sectionId },
  });
  if (enrollment) {
    throw new Error("This student is already enrolled in this section", {
      cause: 409,
    });
  }
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

  const enrollment = await EnrollmentModel.findByPk(enrollmentId, {
    include: enrollmentIncludes,
  });
  if (!enrollment) throw new Error("Enrollment not found", { cause: 404 });

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

export const updateEnrollment = async ({ enrollmentId, enrollmentData }) => {
  if (!enrollmentId) {
    throw new Error("Enrollment ID is required", { cause: 400 });
  }

  const enrollment = await EnrollmentModel.findByPk(enrollmentId);
  if (!enrollment) throw new Error("Enrollment not found", { cause: 404 });

  const updates = {};
  if (Object.hasOwn(enrollmentData, "status")) {
    updates.status = enrollmentData.status;
  }
  if (Object.hasOwn(enrollmentData, "finalGrade")) {
    updates.finalGrade = enrollmentData.finalGrade;
  }

  if (!Object.keys(updates).length) {
    throw new Error("Only status and finalGrade can be updated", { cause: 400 });
  }

  await enrollment.update(updates);
  await enrollment.reload({ include: enrollmentIncludes });

  return enrollment;
};

export const deleteEnrollment = async ({ enrollmentId, hard }) => {
  if (!enrollmentId) {
    throw new Error("Enrollment ID is required", { cause: 400 });
  }

  const enrollment = await EnrollmentModel.findByPk(enrollmentId, {
    paranoid: !hard,
  });
  if (!enrollment) throw new Error("Enrollment not found", { cause: 404 });

  await enrollment.destroy({ force: hard });
  return enrollment;
};
