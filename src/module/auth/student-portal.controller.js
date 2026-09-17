import { Router } from "express";
import { sequelize } from "../../db/connection.js";
import { checkExisting } from "../../common/index.js";
import {
  CourseModel,
  DepartmentModel,
  EnrollmentModel,
  ProfessorModel,
  SectionModel,
  SemesterModel,
  StudentModel,
} from "../../db/model/index.js";

export const studentPortalRouter = Router();

const timeToMinutes = (time) => {
  const [hours, minutes] = String(time).split(":").map(Number);
  return hours * 60 + minutes;
};

const hasTimeConflict = (firstSection, secondSection) => {
  if (firstSection.dayOfWeek !== secondSection.dayOfWeek) return false;

  const firstStart = timeToMinutes(firstSection.startTime);
  const firstEnd = timeToMinutes(firstSection.endTime);
  const secondStart = timeToMinutes(secondSection.startTime);
  const secondEnd = timeToMinutes(secondSection.endTime);

  return firstStart < secondEnd && firstEnd > secondStart;
};

studentPortalRouter.use((req, res, next) => {
  if (req.user.role !== "student")
    return res.status(403).json({ msg: "Student access is required." });
  next();
});

studentPortalRouter.get("/workspace", async (req, res) => {
  const [
    student,
    courses,
    professors,
    departments,
    sections,
    semesters,
    enrollments,
  ] = await Promise.all([
    StudentModel.findByPk(req.user.id, {
      attributes: ["id", "studentNumber", "firstName", "lastName", "userName"],
    }),
    CourseModel.findAll({
      attributes: ["id", "code", "name", "description", "departmentId"],
    }),
    ProfessorModel.findAll({ attributes: ["id", "name"] }),
    DepartmentModel.findAll({ attributes: ["id", "name"] }),
    SectionModel.findAll({
      attributes: [
        "id",
        "sectionCode",
        "courseId",
        "semesterId",
        "professorId",
        "room",
        "schedule",
        "dayOfWeek",
        "startTime",
        "endTime",
        "capacity",
      ],
    }),
    SemesterModel.findAll({
      attributes: ["id", "academicYear", "term", "startDate", "endDate"],
    }),
    EnrollmentModel.findAll({
      where: { studentId: req.user.id },
      attributes: [
        "id",
        "studentId",
        "sectionId",
        "status",
        "finalGrade",
        "gradeStatus",
        "enrolledAt",
      ],
    }),
  ]);
  const counts = await EnrollmentModel.findAll({
    attributes: [
      "sectionId",
      [sequelize.fn("COUNT", sequelize.col("id")), "enrollmentCount"],
    ],
    group: ["sectionId"],
    raw: true,
  });
  const occupied = new Map(
    counts.map((row) => [row.sectionId, Number(row.enrollmentCount)]),
  );
  res.json({
    data: {
      students: [student],
      courses,
      professors,
      departments,
      semesters,
      enrollments: enrollments.map((enrollment) => {
        const enrollmentData = enrollment.toJSON();
        if (enrollmentData.gradeStatus !== "published") {
          enrollmentData.finalGrade = null;
        }
        delete enrollmentData.gradeStatus;
        return enrollmentData;
      }),
      sections: sections.map((section) => ({
        ...section.toJSON(),
        occupied: occupied.get(section.id) || 0,
      })),
    },
  });
});

studentPortalRouter.post("/enroll", async (req, res) => {
  const sectionId = Number(req.body?.sectionId);
  if (!Number.isSafeInteger(sectionId) || sectionId < 1)
    return res.status(400).json({ msg: "Choose a valid section." });
  const enrollment = await sequelize.transaction(async (transaction) => {
    await checkExisting({ model: StudentModel, searchParameter: { id: req.user.id }, msg: "Student not found", options: { transaction, lock: transaction.LOCK.UPDATE } });
    const section = await checkExisting({
      model: SectionModel,
      msg: "Section not found.",
      searchParameter: { id: sectionId },
      options: { transaction, lock: transaction.LOCK.UPDATE },
    });

    const semester = await checkExisting({
      model: SemesterModel,
      msg: "Semester not found.",
      searchParameter: { id: section.semesterId },
      options: { transaction },
    });
    if (new Date(semester.endDate) < new Date())
      throw new Error("Enrollment for this semester has closed.", {
        cause: 409,
      });

    await checkExisting({
      model: EnrollmentModel,
      msg: "You are already enrolled in this section.",
      statusCode: 409,
      searchParameter: { studentId: req.user.id, sectionId },
      options: { transaction },
      isTrue: true,
    });

    if (!section.dayOfWeek || !section.startTime || !section.endTime) {
      throw new Error("This section does not have a complete timetable.", {
        cause: 400,
      });
    }

    if (timeToMinutes(section.startTime) >= timeToMinutes(section.endTime)) {
      throw new Error("This section has an invalid timetable.", { cause: 400 });
    }

    const enrolledSections = await SectionModel.findAll({
      where: {
        semesterId: section.semesterId,
        dayOfWeek: section.dayOfWeek,
      },
      include: [
        {
          model: EnrollmentModel,
          required: true,
          where: { studentId: req.user.id },
          attributes: [],
        },
      ],
      transaction,
    });

    if (enrolledSections.some((enrolledSection) => hasTimeConflict(section, enrolledSection))) {
      throw new Error(
        "This class conflicts with another class in your timetable.",
        { cause: 409 },
      );
    }

    const count = await EnrollmentModel.count({
      where: { sectionId },
      transaction,
    });
    if (count >= section.capacity)
      throw new Error("This section is full.", { cause: 409 });
    return EnrollmentModel.create(
      {
        studentId: req.user.id,
        sectionId,
        enrolledAt: new Date(),
        status: "pending",
        finalGrade: null,
      },
      { transaction },
    );
  });
  res.status(201).json({ data: enrollment, msg: "Enrollment created." });
});
