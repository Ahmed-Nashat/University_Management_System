import { Op } from "sequelize";
import { sequelize } from "../../db/connection.js";
import { AuditLogModel, EnrollmentModel, ProfessorModel, SectionModel, StudentModel } from "../../db/model/index.js";
import { checkExisting, isTheOwner } from "../../common/index.js";

const snapshot = (row) => ({ finalGrade: row.finalGrade, status: row.status, gradeStatus: row.gradeStatus });
async function owner(professorId, sectionId, transaction) {
  const section = await checkExisting({ model: SectionModel, searchParameter: { id: sectionId }, msg: "Section not found", options: { transaction, lock: transaction.LOCK.UPDATE } });
  isTheOwner({ section, professorId });
  return checkExisting({ model: ProfessorModel, searchParameter: { id: professorId }, msg: "Professor not found", options: { transaction } });
}
async function logChange(professor, enrollment, student, action, before, transaction) {
  await AuditLogModel.create({ professorId: professor.id, professorName: professor.name,
    sectionId: enrollment.sectionId, enrollmentId: enrollment.id, studentNumber: student.studentNumber,
    action, before, after: snapshot(enrollment) }, { transaction });
}

export async function updateGrades({ professorId, sectionId, studentNumber, updates }) {
  const clean = {};
  if (Object.hasOwn(updates, "finalGrade")) {
    if (typeof updates.finalGrade !== "string" || !/^([A-Z][+-]?|[+-][A-Z])$/i.test(updates.finalGrade.trim()))
      throw new Error("Provide a letter grade such as A or B+.", { cause: 400 });
    clean.finalGrade = updates.finalGrade.trim().toUpperCase();
  }
  if (Object.hasOwn(updates, "status")) {
    if (!["pending", "passed", "failed"].includes(updates.status)) throw new Error("Invalid enrollment status", { cause: 400 });
    clean.status = updates.status;
  }
  if (!Object.keys(clean).length) throw new Error("Provide a grade or enrollment status", { cause: 400 });
  return sequelize.transaction(async (transaction) => {
    const professor = await owner(professorId, sectionId, transaction);
    const student = await checkExisting({ model: StudentModel, searchParameter: { studentNumber }, msg: "Student not found", options: { transaction } });
    const enrollment = await checkExisting({ model: EnrollmentModel, searchParameter: { studentId: student.id, sectionId }, msg: "Enrollment not found", options: { transaction, lock: transaction.LOCK.UPDATE } });
    const before = snapshot(enrollment);
    if (Object.entries(clean).every(([key, value]) => enrollment[key] === value)) return enrollment;
    // Any changed result must be reviewed and published again.
    await enrollment.update({ ...clean, gradeStatus: "draft" }, { transaction });
    await logChange(professor, enrollment, student, "result_updated", before, transaction);
    return enrollment;
  });
}

export async function publishSectionGrades({ professorId, sectionId }) {
  return sequelize.transaction(async (transaction) => {
    const professor = await owner(professorId, sectionId, transaction);
    const rows = await EnrollmentModel.findAll({ where: { sectionId, gradeStatus: "draft", finalGrade: { [Op.ne]: null } }, transaction, lock: transaction.LOCK.UPDATE });
    if (!rows.length) throw new Error("No draft grades to publish", { cause: 400 });
    for (const enrollment of rows) {
      const before = snapshot(enrollment);
      const student = await checkExisting({ model: StudentModel, searchParameter: { id: enrollment.studentId }, msg: "Student not found", options: { transaction } });
      await enrollment.update({ gradeStatus: "published" }, { transaction });
      await logChange(professor, enrollment, student, "grade_published", before, transaction);
    }
    return { publishedCount: rows.length };
  });
}

export async function listAuditLogs({ professorId, sectionId, page = 1, limit = 10 }) {
  const section = await checkExisting({ model: SectionModel, searchParameter: { id: sectionId }, msg: "Section not found" });
  isTheOwner({ section, professorId });
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const { count, rows } = await AuditLogModel.findAndCountAll({ where: { sectionId }, order: [["id", "DESC"]], limit, offset: (page - 1) * limit });
  return { rows, meta: { totalCount: count, totalPage: Math.ceil(count / limit), currentPage: page } };
}
