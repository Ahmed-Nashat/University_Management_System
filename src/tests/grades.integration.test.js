import test from "node:test";
import assert from "node:assert/strict";

test("grade edits and publication record atomic, owner-scoped history", { skip: process.env.RUN_GRADE_INTEGRATION !== "1" }, async () => {
  const { sequelize } = await import("../db/connection.js");
  const { SectionModel, StudentModel, EnrollmentModel, AuditLogModel } = await import("../db/model/index.js");
  const { updateGrades, publishSectionGrades, listAuditLogs } = await import("../module/professor/grade.service.js");
  sequelize.options.logging = false;
  let section;
  try {
    await AuditLogModel.sync();
    const existing = await SectionModel.findOne();
    const student = await StudentModel.findOne();
    assert.ok(existing && student, "Requires an existing section and student for fixture relationships");
    section = await SectionModel.create({ sectionCode: `QA-${Date.now()}`, courseId: existing.courseId, semesterId: existing.semesterId, professorId: existing.professorId, room: "QA1", capacity: 5, schedule: new Date(), dayOfWeek: "Monday", startTime: "09:00:00", endTime: "11:00:00" });
    const enrollment = await EnrollmentModel.create({ studentId: student.id, sectionId: section.id, enrolledAt: new Date(), status: "pending", finalGrade: null });
    const args = { professorId: section.professorId, sectionId: section.id, studentNumber: student.studentNumber };
    await assert.rejects(updateGrades({ ...args, professorId: "00000000-0000-0000-0000-000000000000", updates: { finalGrade: "A" } }), e => e.cause === 403);
    await updateGrades({ ...args, updates: { finalGrade: "A", status: "passed" } });
    await enrollment.reload();
    assert.equal(enrollment.gradeStatus, "draft");
    assert.equal((await publishSectionGrades(args)).publishedCount, 1);
    await assert.rejects(publishSectionGrades(args), e => e.cause === 400);
    await updateGrades({ ...args, updates: { finalGrade: "B" } });
    await enrollment.reload();
    assert.equal(enrollment.gradeStatus, "draft");
    const history = await listAuditLogs({ ...args, limit: 2 });
    assert.equal(history.meta.totalCount, 3);
    assert.equal(history.rows.length, 2);
    assert.equal(history.rows[0].before.finalGrade, "A");
    assert.equal(history.rows[0].after.finalGrade, "B");
    await assert.rejects(listAuditLogs({ ...args, professorId: "wrong" }), e => e.cause === 403);
    const original = AuditLogModel.create;
    try {
      AuditLogModel.create = async () => { throw new Error("audit unavailable"); };
      await assert.rejects(updateGrades({ ...args, updates: { finalGrade: "C" } }), /audit unavailable/);
    } finally { AuditLogModel.create = original; }
    await enrollment.reload();
    assert.equal(enrollment.finalGrade, "B", "Failed log write rolls back grade update");
  } finally {
    if (section) {
      await AuditLogModel.destroy({ where: { sectionId: section.id } });
      await EnrollmentModel.destroy({ where: { sectionId: section.id }, force: true });
      await section.destroy({ force: true });
    }
    await sequelize.close();
  }
});
