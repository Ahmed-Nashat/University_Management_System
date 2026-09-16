import { Router } from "express";
import { sequelize } from "../../db/connection.js";
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
      enrollments,
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
    const section = await SectionModel.findByPk(sectionId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!section) throw new Error("Section not found.", { cause: 404 });
    const semester = await SemesterModel.findByPk(section.semesterId, {
      transaction,
    });
    if (!semester || new Date(semester.endDate) < new Date())
      throw new Error("Enrollment for this semester has closed.", {
        cause: 409,
      });
    const existing = await EnrollmentModel.findOne({
      where: { studentId: req.user.id, sectionId },
      transaction,
    });
    if (existing)
      throw new Error("You are already enrolled in this section.", {
        cause: 409,
      });
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
