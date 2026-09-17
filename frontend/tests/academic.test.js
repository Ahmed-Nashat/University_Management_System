import test from "node:test";
import assert from "node:assert/strict";
import { timetableLabel, enrollmentIssue, onDate } from "../src/academic.js";
import { makePayload } from "../src/modules.js";

const section = { id: 1, semesterId: 1, sectionCode: "CS-A", dayOfWeek: "Monday", startTime: "09:00:00", endTime: "11:00:00" };
const semesters = [{ id: 1, startDate: "2026-01-01", endDate: "2099-12-31" }];
test("weekly timetable repeats only inside semester dates", () => {
  assert.equal(onDate(section, new Date(2026, 8, 21), semesters), true);
  assert.equal(onDate(section, new Date(2026, 8, 22), semesters), false);
  assert.equal(onDate(section, new Date(2025, 8, 22), semesters), false);
  assert.equal(timetableLabel(section), "Monday · 09:00–11:00");
});
test("enrollment warns about overlap but allows touching times and other semesters", () => {
  const next = { ...section, id: 2, startTime: "10:00:00", endTime: "12:00:00" };
  assert.equal(enrollmentIssue(next, [section], semesters), "Conflicts with CS-A");
  assert.equal(enrollmentIssue({ ...next, startTime: "11:00:00" }, [section], semesters), "");
  assert.equal(enrollmentIssue(next, [{ ...section, semesterId: 2 }], semesters), "");
  assert.equal(enrollmentIssue({ ...next, startTime: null }, [], semesters), "Timetable not set");
});
test("section forms submit recurring fields and pending enrollment is allowed", () => {
  const payload = makePayload("sections", { dayOfWeek: "Monday", startTime: "09:00", endTime: "11:00" }, true);
  assert.deepEqual(payload, { dayOfWeek: "Monday", startTime: "09:00", endTime: "11:00" });
  assert.equal(makePayload("enrollments", { status: "pending" }, false).status, "pending");
});
