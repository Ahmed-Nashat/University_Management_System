import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

// Opt-in: creates isolated fixtures in the configured database and removes only those fixtures.
test(
  "live portal enforces roles, student ownership, enrollment rules, and professor login",
  { skip: process.env.RUN_PORTAL_INTEGRATION !== "1" },
  async () => {
    const { sequelize } = await import("../db/connection.js");
    const models = await import("../db/model/index.js");
    const { hashing } = await import("../common/security/security.js");
    const prefix = `UIQA-${randomUUID().slice(0, 8)}`;
    const fixtures = [];
    const base = process.env.TEST_API_URL || "http://127.0.0.1:3001";
    const create = async (Model, values) => {
      const row = await Model.create(values);
      fixtures.push(row);
      return row;
    };
    const call = async (path, { cookie, body, method = "GET" } = {}) => {
      const res = await fetch(`${base}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(cookie ? { Cookie: cookie } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return {
        status: res.status,
        data: await res.json(),
        cookie: res.headers.get("set-cookie")?.split(";")[0],
      };
    };
    try {
      assert.equal((await call("/students")).status, 401);
      const phone = String(Date.now()).slice(-8);
      const department = await create(models.DepartmentModel, {
        name: prefix,
        office: "QA Office",
        phoneNumber: `010${phone}`,
      });
      const password = `${randomUUID()}aB9!`;
      const professor = await create(models.ProfessorModel, {
        name: "Testprofessor",
        email: `${prefix}@example.test`,
        password: await hashing(password),
        phoneNumber: `011${phone}`,
        departmentId: department.id,
      });
      const studentValues = {
        firstName: "Test",
        lastName: "Student",
        email: `${prefix}-student@example.test`,
        phoneNumber: `012${phone}`,
        DOB: "2004-05-12",
        address: "QA University Test Address",
        level: 1,
        status: "undergraduate",
        admissionDate: "2026-09-01",
        departmentId: department.id,
      };
      const student = await create(models.StudentModel, studentValues);
      const other = await create(models.StudentModel, {
        ...studentValues,
        email: `${prefix}-other@example.test`,
        phoneNumber: `015${phone}`,
      });
      const course = await create(models.CourseModel, {
        name: prefix,
        code: prefix,
        departmentId: department.id,
      });
      const semester = await create(models.SemesterModel, {
        academicYear: "2098/2099",
        term: "summer",
        startDate: "2098-01-01",
        endDate: "2099-12-31",
      });
      const section = await create(models.SectionModel, {
        sectionCode: prefix,
        room: "QA1",
        schedule: "2098-09-01T09:00:00Z",
        dayOfWeek: "Monday", startTime: "09:00:00", endTime: "11:00:00",
        capacity: 1,
        courseId: course.id,
        professorId: professor.id,
        semesterId: semester.id,
      });
      const badProfessor = await call("/auth/login", {
        method: "POST",
        body: {
          role: "professor",
          email: professor.email,
          password: "wrong-password",
        },
      });
      assert.equal(badProfessor.status, 401);
      const faculty = await call("/auth/login", {
        method: "POST",
        body: { role: "professor", email: professor.email, password },
      });
      assert.equal(faculty.status, 200);
      assert.equal(faculty.data.data.role, "professor");
      assert.equal(Object.hasOwn(faculty.data.data, "password"), false);
      for (const module of [
        "students",
        "professors",
        "departments",
        "courses",
        "sections",
        "semesters",
        "enrollments",
      ])
        assert.equal(
          (await call(`/${module}`, { cookie: faculty.cookie })).status,
          200,
          module,
        );
      const login = await call("/auth/login", {
        method: "POST",
        body: { role: "student", studentNumber: student.studentNumber },
      });
      assert.equal(login.status, 200);
      assert.equal(login.data.data.id, student.id);
      for (const module of [
        "students",
        "professors",
        "departments",
        "courses",
        "sections",
        "semesters",
        "enrollments",
      ])
        assert.equal(
          (await call(`/${module}`, { cookie: login.cookie })).status,
          403,
          module,
        );
      const originalNumber = student.studentNumber;
      assert.equal(
        (
          await call(
            `/students/updateStudent?studentNumber=${encodeURIComponent(originalNumber)}`,
            {
              method: "PATCH",
              cookie: faculty.cookie,
              body: { address: "QA Updated University Address" },
            },
          )
        ).status,
        200,
      );
      await student.reload();
      assert.equal(student.studentNumber, originalNumber);
      const enrolled = await call("/portal/enroll", {
        method: "POST",
        cookie: login.cookie,
        body: {
          sectionId: section.id,
          studentId: other.id,
          finalGrade: "A+",
          status: "passed",
        },
      });
      assert.equal(enrolled.status, 201, JSON.stringify(enrolled.data));
      fixtures.push(
        await models.EnrollmentModel.findByPk(enrolled.data.data.id),
      );
      assert.equal(enrolled.data.data.studentId, student.id);
      assert.equal(enrolled.data.data.finalGrade, null);
      assert.equal(enrolled.data.data.status, "pending");
      assert.equal(
        (
          await call("/portal/enroll", {
            method: "POST",
            cookie: login.cookie,
            body: { sectionId: section.id },
          })
        ).status,
        409,
      );
      const secondLogin = await call("/auth/login", {
        method: "POST",
        body: { role: "student", studentNumber: other.studentNumber },
      });
      assert.equal(
        (
          await call("/portal/enroll", {
            method: "POST",
            cookie: secondLogin.cookie,
            body: { sectionId: section.id },
          })
        ).status,
        409,
      );
      const workspace = await call("/portal/workspace", {
        cookie: login.cookie,
      });
      assert.equal(workspace.status, 200);
      assert.deepEqual(
        workspace.data.data.students.map((row) => row.id),
        [student.id],
      );
      assert.ok(
        workspace.data.data.enrollments.every(
          (row) => row.studentId === student.id,
        ),
      );
      assert.ok(
        workspace.data.data.professors.every(
          (row) =>
            !Object.hasOwn(row, "password") && !Object.hasOwn(row, "email"),
        ),
      );
      assert.equal(
        (
          await call(
            `/enrollments/updateEnrollment?enrollmentId=${enrolled.data.data.id}`,
            {
              method: "PATCH",
              cookie: login.cookie,
              body: { finalGrade: "A", status: "passed" },
            },
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await call(
            `/enrollments/updateEnrollment?enrollmentId=${enrolled.data.data.id}`,
            {
              method: "PATCH",
              cookie: faculty.cookie,
              body: { finalGrade: "A", status: "passed" },
            },
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await call("/portal/workspace", { cookie: login.cookie })
        ).data.data.enrollments.find((row) => row.id === enrolled.data.data.id)
          .finalGrade,
        null,
      );
      assert.equal((await call("/professors/publishGrades", { method: "PATCH", cookie: faculty.cookie, body: { sectionId: section.id } })).status, 200);
      assert.equal((await call("/portal/workspace", { cookie: login.cookie })).data.data.enrollments.find(row => row.id === enrolled.data.data.id).finalGrade, "A");
      const removed = await call(
        `/enrollments/deleteEnrollment?enrollmentId=${enrolled.data.data.id}`,
        {
          method: "DELETE",
          cookie: faculty.cookie,
          body: {},
        },
      );
      assert.equal(removed.status, 200);
      assert.equal(
        await models.EnrollmentModel.findByPk(enrolled.data.data.id),
        null,
      );
      assert.ok(
        await models.EnrollmentModel.findByPk(enrolled.data.data.id, {
          paranoid: false,
        }),
      );
      await call("/auth/logout", {
        method: "POST",
        cookie: login.cookie,
        body: {},
      });
      assert.equal(
        (await call("/portal/workspace", { cookie: login.cookie })).status,
        401,
      );
      await call("/auth/logout", {
        method: "POST",
        cookie: faculty.cookie,
        body: {},
      });
      await call("/auth/logout", {
        method: "POST",
        cookie: secondLogin.cookie,
        body: {},
      });
    } finally {
      for (const row of fixtures.reverse()) {
        if (row instanceof models.SectionModel) await models.AuditLogModel.destroy({ where: { sectionId: row.id } });
        if (row) await row.destroy({ force: true });
      }
      await sequelize.close();
    }
  },
);
