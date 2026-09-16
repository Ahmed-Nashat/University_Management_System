import test from "node:test";
import assert from "node:assert/strict";
import { mutationRequest, listRecords } from "../src/api.js";
import { makePayload, formValues } from "../src/modules.js";
import { changeDemo, createDemoData } from "../src/demo.js";

test("enrollment creation uses the student query and section body expected by the API", () => {
  const result = mutationRequest("enrollments", "create", {
    studentId: "student-1",
    sectionId: 12,
    status: "passed",
    finalGrade: "A",
  });
  assert.equal(result.path, "/enrollments/create?studentId=student-1");
  assert.deepEqual(JSON.parse(result.options.body), {
    sectionId: 12,
    status: "passed",
    finalGrade: "A",
  });
});
test("delete requests use module-specific identifiers and never request hard deletion", () => {
  const cases = [
    [
      "students",
      { studentNumber: "STD-2026-0001" },
      "/students/deleteStudent?studentNumber=STD-2026-0001",
    ],
    [
      "professors",
      { email: "name@campus.edu" },
      "/professors/delete?search=name%40campus.edu",
    ],
    ["sections", { id: 8 }, "/sections/deleteSection?sectionId=8"],
    ["semesters", { id: 9 }, "/semesters/delete?semesterId=9"],
  ];
  for (const [key, row, path] of cases) {
    const request = mutationRequest(key, "remove", {}, row);
    assert.equal(request.path, path);
    assert.equal(request.options.method, "DELETE");
    assert.equal(request.options.body, "{}");
  }
});
test("editing only submits mutable fields, preserving absent relationship IDs", () => {
  assert.deepEqual(
    makePayload(
      "courses",
      {
        code: "CS01",
        name: "Databases",
        departmentId: "4",
        description: "New description",
      },
      true,
    ),
    { departmentId: 4, description: "New description" },
  );
  assert.deepEqual(
    makePayload(
      "sections",
      { sectionCode: "A", room: "B204", capacity: "25", professorId: "" },
      true,
    ),
    { room: "B204", capacity: 25 },
  );
  assert.deepEqual(
    makePayload(
      "enrollments",
      { studentId: "other", sectionId: "8", status: "passed", finalGrade: "A" },
      true,
    ),
    { status: "passed", finalGrade: "A" },
  );
});
test("student response names and dates populate the edit form", () => {
  const values = formValues("students", {
    userName: "Ahmed Hassan",
    DOB: "2004-05-12T00:00:00.000Z",
  });
  assert.equal(values.firstName, "Ahmed");
  assert.equal(values.lastName, "Hassan");
  assert.equal(values.DOB, "2004-05-12");
});
test("list loader handles semester shape, all pages, and excludes soft-deleted records", async () => {
  const original = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(url);
    return {
      ok: true,
      json: async () => ({
        data: {
          semesters:
            urls.length === 1
              ? [{ id: 1 }, { id: 2, deletedAt: "2026-09-01" }]
              : [{ id: 3 }],
          totalPage: 2,
        },
      }),
    };
  };
  try {
    assert.deepEqual(await listRecords("semesters"), [{ id: 1 }, { id: 3 }]);
    assert.equal(urls.length, 2);
    assert.match(urls[1], /page=2/);
  } finally {
    globalThis.fetch = original;
  }
});
test("demo rejects duplicate enrollments and does not retain professor passwords", () => {
  const data = createDemoData();
  assert.throws(
    () =>
      changeDemo(data, "enrollments", "create", {
        studentId: "student-0",
        sectionId: 1,
      }),
    /already enrolled/,
  );
  const next = changeDemo(data, "professors", "create", {
    name: "Test",
    email: "new@example.test",
    phoneNumber: "01022222222",
    password: "not-stored",
  });
  assert.equal(Object.hasOwn(next.professors.at(-1), "password"), false);
});
