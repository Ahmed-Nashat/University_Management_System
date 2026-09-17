export function createDemoData() {
  const departments = [
    "Computer Science",
    "Business Administration",
    "Engineering",
    "Arts & Humanities",
  ].map((name, i) => ({
    id: i + 1,
    name,
    office: `Building ${"ABCD"[i]} · 10${i + 1}`,
    phoneNumber: `0101000000${i}`,
  }));
  const professors = ["Mariam", "Youssef", "Nour", "Khaled"].map((name, i) => ({
    id: `prof-${i}`,
    name,
    email: `${name.toLowerCase()}@campus.edu`,
    phoneNumber: `0111000000${i}`,
    departmentId: i + 1,
  }));
  const names = [
    "Ahmed Hassan",
    "Salma Ibrahim",
    "Omar Mostafa",
    "Farah Mohamed",
    "Youssef Adel",
    "Nour Khaled",
    "Malak Samir",
    "Ali Mahmoud",
    "Hana Tarek",
    "Adam Nasser",
    "Mariam Hossam",
    "Karim Sameh",
  ];
  const students = names.map((userName, i) => ({
    id: `student-${i}`,
    userName,
    firstName: userName.split(" ")[0],
    lastName: userName.split(" ")[1],
    studentNumber: `STD-2026-${String(i + 1).padStart(4, "0")}`,
    email: `${userName.toLowerCase().replace(" ", ".")}@student.campus.edu`,
    phoneNumber: `012100000${String(i).padStart(2, "0")}`,
    departmentId: (i % 4) + 1,
    level: (i % 4) + 1,
    status: i === 7 ? "graduate" : "undergraduate",
    DOB: "2004-05-12",
    address: "12 University Street, Cairo",
    admissionDate: "2026-09-01",
    academicAdvisorId: `prof-${i % 4}`,
  }));
  const courses = [
    "Database Systems",
    "Business Fundamentals",
    "Engineering Mathematics",
    "World Literature",
    "Data Structures",
    "Financial Accounting",
  ].map((name, i) => ({
    id: i + 1,
    name,
    code: ["CS201", "BUS101", "ENG202", "ART101", "CS202", "BUS203"][i],
    departmentId: (i % 4) + 1,
    description: [
      "Design and manage relational databases.",
      "Explore the foundations of business.",
      "Mathematical methods for engineers.",
      "Perspectives from global literature.",
      "Core algorithms and data structures.",
      "Principles of financial reporting.",
    ][i],
  }));
  const semesters = [
    {
      id: 1,
      academicYear: "2026/2027",
      term: "fall",
      startDate: "2026-09-01",
      endDate: "2027-01-21",
    },
    {
      id: 2,
      academicYear: "2026/2027",
      term: "spring",
      startDate: "2027-02-07",
      endDate: "2027-06-15",
    },
  ];
  const sections = courses.map((course, i) => ({
    id: i + 1,
    sectionCode: `${course.code}-A`,
    courseId: course.id,
    semesterId: 1,
    professorId: `prof-${i % 4}`,
    room: `B20${i + 1}`,
    capacity: 30 + i * 5,
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][i % 5],
    startTime: `${String(9 + i).padStart(2, "0")}:00:00`,
    endTime: `${String(11 + i).padStart(2, "0")}:00:00`,
    schedule: `2026-09-${14 + (i % 5)}T${String(9 + i).padStart(2, "0")}:00:00`,
  }));
  const enrollments = students
    .slice(0, 8)
    .map((student, i) => ({
      id: i + 1,
      studentId: student.id,
      sectionId: (i % 6) + 1,
      enrolledAt: `2026-09-${String(1 + i).padStart(2, "0")}`,
      status: i === 3 ? "failed" : "passed",
      gradeStatus: "published",
      finalGrade: i === 3 ? "F" : ["A", "B+", "A-"][i % 3],
    }));
  enrollments.push(
    {
      id: 9,
      studentId: students[0].id,
      sectionId: 3,
      enrolledAt: "2026-09-02",
      status: "pending",
      finalGrade: null,
      gradeStatus: "draft",
    },
    {
      id: 10,
      studentId: students[0].id,
      sectionId: 5,
      enrolledAt: "2026-09-02",
      status: "pending",
      finalGrade: null,
      gradeStatus: "draft",
    },
  );
  return {
    students,
    professors,
    departments,
    courses,
    sections,
    semesters,
    enrollments,
  };
}

export function changeDemo(data, key, action, payload, row) {
  const records = data[key];
  const clean = { ...payload };
  delete clean.password;
  if (action === "remove")
    return { ...data, [key]: records.filter((item) => item.id !== row.id) };
  const next = { ...row, ...clean };
  if (action === "create") {
    next.id =
      key === "students" || key === "professors"
        ? crypto.randomUUID()
        : Math.max(0, ...records.map((item) => Number(item.id))) + 1;
    if (key === "students")
      next.studentNumber = `STD-2026-${String(Math.max(0, ...records.map((item) => Number(item.studentNumber.split("-").at(-1)))) + 1).padStart(4, "0")}`;
  }
  if (key === "students") next.userName = `${next.firstName} ${next.lastName}`;
  const uniqueFields =
    {
      students: ["email", "phoneNumber"],
      professors: ["email", "phoneNumber"],
      departments: ["name", "phoneNumber"],
      courses: ["name", "code"],
    }[key] || [];
  if (
    records.some(
      (item) =>
        item.id !== next.id &&
        uniqueFields.some((field) => item[field] === next[field]),
    )
  )
    throw new Error("A record with these details already exists.");
  if (
    key === "enrollments" &&
    records.some(
      (item) =>
        item.id !== next.id &&
        item.studentId === next.studentId &&
        item.sectionId === next.sectionId,
    )
  )
    throw new Error("This student is already enrolled in this section.");
  if (
    key === "sections" &&
    records.some(
      (item) =>
        item.id !== next.id &&
        item.sectionCode === next.sectionCode &&
        item.courseId === next.courseId &&
        item.semesterId === next.semesterId,
    )
  )
    throw new Error("This section already exists for the course and semester.");
  if (
    key === "semesters" &&
    records.some(
      (item) =>
        item.id !== next.id &&
        item.term === next.term &&
        item.academicYear === next.academicYear,
    )
  )
    throw new Error("This semester already exists.");
  return {
    ...data,
    [key]:
      action === "create"
        ? [...records, next]
        : records.map((item) => (item.id === row.id ? next : item)),
  };
}
