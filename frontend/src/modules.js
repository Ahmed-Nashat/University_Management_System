import { weekdays } from "./academic.js";
const field = (key, label, extra = {}) => ({
  key,
  label,
  required: true,
  ...extra,
});
const department = field("departmentId", "Department", {
  relation: "departments",
  numeric: true,
});
const phone = field("phoneNumber", "Phone number", {
  type: "tel",
  pattern: "01[0-9]{9}",
  placeholder: "01012345678",
  help: "11 digits, starting with 01.",
});
const name = (key, label) =>
  field(key, label, {
    minLength: 3,
    maxLength: 30,
    pattern: "[A-Za-z]+",
    help: "3–30 letters, without spaces (current API requirement).",
  });

export const modules = {
  students: {
    title: "Students",
    singular: "student",
    description: "A connected view of your student community.",
    columns: [
      ["userName", "Student"],
      ["studentNumber", "Student number"],
      ["departmentId", "Department"],
      ["level", "Level"],
      ["status", "Status"],
    ],
    fields: [
      name("firstName", "First name"),
      name("lastName", "Last name"),
      field("email", "Email address", { type: "email" }),
      phone,
      field("DOB", "Date of birth", { type: "date" }),
      field("address", "Address", { minLength: 10, maxLength: 250 }),
      field("level", "Level", { type: "number", min: 1, max: 5 }),
      field("status", "Status", {
        options: ["undergraduate", "graduate", "post-graduate"],
      }),
      field("admissionDate", "Admission date", { type: "date" }),
      department,
      field("academicAdvisorId", "Academic advisor", {
        relation: "professors",
        required: false,
      }),
    ],
    create: "addStudent",
    update: "updateStudent",
    remove: "deleteStudent",
    query: "studentNumber",
    identity: "studentNumber",
  },
  professors: {
    title: "Professors",
    singular: "professor",
    description: "Your faculty, connected to the academic community.",
    columns: [
      ["name", "Professor"],
      ["email", "Email address"],
      ["departmentId", "Department"],
      ["phoneNumber", "Phone"],
    ],
    fields: [
      name("name", "Name"),
      field("email", "Email address", { type: "email", immutable: true }),
      phone,
      department,
      field("password", "Password", {
        type: "password",
        minLength: 8,
        help: "Required by the API. When editing, enter the current password.",
      }),
    ],
    create: "addProfessor",
    update: "update",
    remove: "delete",
    query: "email",
    identity: "email",
    deleteQuery: "search",
  },
  departments: {
    title: "Departments",
    singular: "department",
    description: "The academic homes of your students and faculty.",
    columns: [
      ["name", "Department"],
      ["office", "Office"],
      ["phoneNumber", "Phone"],
    ],
    fields: [
      field("name", "Department name"),
      field("office", "Office"),
      phone,
    ],
    create: "create",
    update: "update",
    remove: "delete",
    query: "id",
    identity: "id",
  },
  courses: {
    title: "Courses",
    singular: "course",
    description: "Organize your curriculum, one course at a time.",
    columns: [
      ["name", "Course"],
      ["code", "Course code"],
      ["departmentId", "Department"],
      ["description", "Description"],
    ],
    fields: [
      field("name", "Course name", {
        minLength: 5,
        maxLength: 30,
        immutable: true,
      }),
      field("code", "Course code", { immutable: true }),
      department,
      field("description", "Description", { required: false }),
    ],
    create: "create",
    update: "update",
    remove: "delete",
    query: "code",
    identity: "code",
  },
  sections: {
    title: "Sections",
    singular: "section",
    description: "Bring courses, professors, and classrooms together.",
    columns: [
      ["sectionCode", "Section"],
      ["courseId", "Course"],
      ["professorId", "Professor"],
      ["room", "Room"],
      ["schedule", "Schedule"],
      ["capacity", "Capacity"],
    ],
    fields: [
      field("sectionCode", "Section code", { immutable: true }),
      field("courseId", "Course", { relation: "courses", numeric: true }),
      field("semesterId", "Semester", { relation: "semesters", numeric: true }),
      field("professorId", "Professor", {
        relation: "professors",
        optionalOnEdit: true,
        help: "Leave unchanged when editing to keep the current professor.",
      }),
      field("room", "Room", {
        pattern: "[A-Za-z0-9]+",
        help: "Letters and numbers only, for example B204.",
      }),
      field("schedule", "First class date", { type: "datetime-local" }),
      field("dayOfWeek", "Weekly class day", { options: weekdays }),
      field("startTime", "Starts at", { type: "time" }),
      field("endTime", "Ends at", { type: "time" }),
      field("capacity", "Capacity", { type: "number", min: 1 }),
    ],
    create: "createSection",
    update: "updateSection",
    remove: "deleteSection",
    query: "id",
    deleteQuery: "sectionId",
    identity: "id",
  },
  semesters: {
    title: "Semesters",
    singular: "semester",
    description: "Keep every academic term on track.",
    columns: [
      ["academicYear", "Academic year"],
      ["term", "Term"],
      ["startDate", "Start date"],
      ["endDate", "End date"],
    ],
    fields: [
      field("academicYear", "Academic year", {
        pattern: "[0-9]{4}/[0-9]{4}",
        placeholder: "2026/2027",
      }),
      field("term", "Term", { options: ["fall", "spring", "summer"] }),
      field("startDate", "Start date", { type: "date" }),
      field("endDate", "End date", { type: "date" }),
    ],
    create: "create",
    update: "update",
    remove: "delete",
    query: "semesterId",
    identity: "id",
  },
  enrollments: {
    title: "Enrollments",
    singular: "enrollment",
    description: "Manage student enrollments and academic results.",
    columns: [
      ["studentId", "Student"],
      ["sectionId", "Section"],
      ["enrolledAt", "Enrolled on"],
      ["finalGrade", "Final grade"],
      ["gradeStatus", "Publication"],
      ["status", "Result"],
    ],
    fields: [
      field("studentId", "Student", { relation: "students", immutable: true }),
      field("sectionId", "Section", {
        relation: "sections",
        numeric: true,
        immutable: true,
      }),
      field("enrolledAt", "Enrollment date", { type: "date", immutable: true }),
      field("status", "Result", {
        options: ["pending", "passed", "failed"],
        help: "Use My teaching to manage and publish academic results.",
      }),
      field("finalGrade", "Final grade", {
        required: false,
        pattern: "([a-zA-Z][+\\-]?|[+\\-][a-zA-Z])",
        placeholder: "A+",
      }),
    ],
    create: "create",
    update: "updateEnrollment",
    remove: "deleteEnrollment",
    query: "enrollmentId",
    identity: "id",
  },
};

export function recordLabel(key, row) {
  return (
    row.userName ||
    row.name ||
    (key === "semesters"
      ? `${row.term} ${row.academicYear}`
      : row.sectionCode || row.studentNumber || `#${row.id}`)
  );
}

export function formValues(key, row = {}) {
  const values = { ...row };
  if (key === "students" && row.userName) {
    const [first, ...last] = row.userName.split(" ");
    values.firstName = first;
    values.lastName = last.join(" ");
  }
  for (const f of modules[key].fields) {
    if (values[f.key] && f.type === "date")
      values[f.key] = values[f.key].slice(0, 10);
    if (values[f.key] && f.type === "datetime-local") {
      const date = new Date(values[f.key]);
      values[f.key] = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16);
    }
  }
  return values;
}

export function makePayload(key, values, editing) {
  const result = {};
  for (const f of modules[key].fields) {
    if (editing && f.immutable) continue;
    const value =
      typeof values[f.key] === "string" && f.type !== "password"
        ? values[f.key].trim()
        : values[f.key];
    if (value === undefined) continue;
    if (value === "") {
      if (editing && f.key === "description") result[f.key] = "";
      if (editing && f.key === "academicAdvisorId") result[f.key] = null;
      continue;
    }
    result[f.key] =
      f.numeric || f.type === "number"
        ? Number(value)
        : f.type === "datetime-local"
          ? new Date(value).toISOString()
          : value;
  }
  return result;
}
