import { sequelize } from "../connection.js";

const UUID_TYPE = "CHAR(36) BINARY";
const parentTables = ["departments", "professors", "students", "courses", "semesters", "sections", "enrollments"];
const foreignKeyTables = ["professors", "students", "courses", "sections", "enrollments"];

const query = (sql) => sequelize.query(sql);

async function dropForeignKeys(table) {
  const references = await sequelize.getQueryInterface().getForeignKeyReferencesForTable(table);

  for (const reference of references) {
    await sequelize.getQueryInterface().removeConstraint(table, reference.constraintName);
  }
}

async function ensureMappedValues(sql, label) {
  const [rows] = await query(sql);
  if (rows[0].missing !== 0) {
    throw new Error(`${label} contains ${rows[0].missing} rows that could not be mapped to UUIDs.`);
  }
}

async function migrate() {
  const [existingIds] = await query(`
    SELECT COLUMN_TYPE AS columnType
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'departments'
      AND COLUMN_NAME = 'id'
  `);

  if (existingIds[0]?.columnType.toLowerCase().startsWith("char(36)")) {
    console.log("UUID migration has already been applied.");
    return;
  }

  for (const table of parentTables) {
    await query(`ALTER TABLE \`${table}\` ADD COLUMN \`new_id\` ${UUID_TYPE} NULL`);
    await query(`UPDATE \`${table}\` SET \`new_id\` = UUID() WHERE \`new_id\` IS NULL`);
  }

  await query(`ALTER TABLE \`professors\` ADD COLUMN \`new_department_id\` ${UUID_TYPE} NULL`);
  await query(`ALTER TABLE \`students\` ADD COLUMN \`new_department_id\` ${UUID_TYPE} NULL, ADD COLUMN \`new_academic_advisor_id\` ${UUID_TYPE} NULL`);
  await query(`ALTER TABLE \`courses\` ADD COLUMN \`new_department_id\` ${UUID_TYPE} NULL`);
  await query(`ALTER TABLE \`sections\` ADD COLUMN \`new_semester_id\` ${UUID_TYPE} NULL, ADD COLUMN \`new_course_id\` ${UUID_TYPE} NULL, ADD COLUMN \`new_professor_id\` ${UUID_TYPE} NULL`);
  await query(`ALTER TABLE \`enrollments\` ADD COLUMN \`new_student_id\` ${UUID_TYPE} NULL, ADD COLUMN \`new_section_id\` ${UUID_TYPE} NULL`);

  await query("UPDATE professors p JOIN departments d ON p.department_id = d.id SET p.new_department_id = d.new_id");
  await query("UPDATE students s JOIN departments d ON s.department_id = d.id SET s.new_department_id = d.new_id");
  await query("UPDATE students s LEFT JOIN professors p ON s.academic_advisor_id = p.id SET s.new_academic_advisor_id = p.new_id");
  await query("UPDATE courses c JOIN departments d ON c.department_id = d.id SET c.new_department_id = d.new_id");
  await query("UPDATE sections s JOIN semesters sem ON s.semester_id = sem.id SET s.new_semester_id = sem.new_id");
  await query("UPDATE sections s JOIN courses c ON s.course_id = c.code SET s.new_course_id = c.new_id");
  await query("UPDATE sections s JOIN professors p ON s.professor_id = p.id SET s.new_professor_id = p.new_id");
  await query("UPDATE enrollments e JOIN students s ON e.student_id = s.id SET e.new_student_id = s.new_id");
  await query("UPDATE enrollments e JOIN sections s ON e.section_id = s.id SET e.new_section_id = s.new_id");

  await ensureMappedValues("SELECT COUNT(*) AS missing FROM professors WHERE new_department_id IS NULL", "professors.department_id");
  await ensureMappedValues("SELECT COUNT(*) AS missing FROM students WHERE new_department_id IS NULL", "students.department_id");
  await ensureMappedValues("SELECT COUNT(*) AS missing FROM courses WHERE new_department_id IS NULL", "courses.department_id");
  await ensureMappedValues("SELECT COUNT(*) AS missing FROM sections WHERE new_semester_id IS NULL OR new_course_id IS NULL OR new_professor_id IS NULL", "sections foreign keys");
  await ensureMappedValues("SELECT COUNT(*) AS missing FROM enrollments WHERE new_student_id IS NULL OR new_section_id IS NULL", "enrollments foreign keys");

  for (const table of foreignKeyTables) {
    await dropForeignKeys(table);
  }

  for (const table of parentTables.filter((table) => table !== "courses")) {
    await query(`ALTER TABLE \`${table}\` DROP PRIMARY KEY, DROP COLUMN \`id\`, CHANGE COLUMN \`new_id\` \`id\` ${UUID_TYPE} NOT NULL, ADD PRIMARY KEY (\`id\`)`);
  }

  await query(`ALTER TABLE \`courses\` DROP PRIMARY KEY, CHANGE COLUMN \`new_id\` \`id\` ${UUID_TYPE} NOT NULL, ADD PRIMARY KEY (\`id\`)`);

  await query(`ALTER TABLE \`professors\` DROP COLUMN \`department_id\`, CHANGE COLUMN \`new_department_id\` \`department_id\` ${UUID_TYPE} NOT NULL`);
  await query(`ALTER TABLE \`students\` DROP COLUMN \`department_id\`, DROP COLUMN \`academic_advisor_id\`, CHANGE COLUMN \`new_department_id\` \`department_id\` ${UUID_TYPE} NOT NULL, CHANGE COLUMN \`new_academic_advisor_id\` \`academic_advisor_id\` ${UUID_TYPE} NULL`);
  await query(`ALTER TABLE \`courses\` DROP COLUMN \`department_id\`, CHANGE COLUMN \`new_department_id\` \`department_id\` ${UUID_TYPE} NOT NULL`);
  await query("ALTER TABLE `sections` DROP INDEX `unique_section_per_course_semester`");
  await query(`ALTER TABLE \`sections\` DROP COLUMN \`semester_id\`, DROP COLUMN \`course_id\`, DROP COLUMN \`professor_id\`, CHANGE COLUMN \`new_semester_id\` \`semester_id\` ${UUID_TYPE} NOT NULL, CHANGE COLUMN \`new_course_id\` \`course_id\` ${UUID_TYPE} NOT NULL, CHANGE COLUMN \`new_professor_id\` \`professor_id\` ${UUID_TYPE} NOT NULL`);
  await query(`ALTER TABLE \`enrollments\` DROP COLUMN \`student_id\`, DROP COLUMN \`section_id\`, CHANGE COLUMN \`new_student_id\` \`student_id\` ${UUID_TYPE} NOT NULL, CHANGE COLUMN \`new_section_id\` \`section_id\` ${UUID_TYPE} NOT NULL`);

  await query("ALTER TABLE professors ADD CONSTRAINT fk_professors_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE ON UPDATE CASCADE");
  await query("ALTER TABLE students ADD CONSTRAINT fk_students_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE ON UPDATE CASCADE, ADD CONSTRAINT fk_students_academic_advisor FOREIGN KEY (academic_advisor_id) REFERENCES professors(id) ON DELETE SET NULL ON UPDATE CASCADE");
  await query("ALTER TABLE courses ADD CONSTRAINT fk_courses_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE ON UPDATE CASCADE");
  await query("ALTER TABLE sections ADD CONSTRAINT fk_sections_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE ON UPDATE CASCADE, ADD CONSTRAINT fk_sections_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE, ADD CONSTRAINT fk_sections_professor FOREIGN KEY (professor_id) REFERENCES professors(id) ON DELETE CASCADE ON UPDATE CASCADE");
  await query("ALTER TABLE sections ADD CONSTRAINT unique_section_per_course_semester UNIQUE (section_code, semester_id, course_id)");
  await query("ALTER TABLE enrollments ADD CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE, ADD CONSTRAINT fk_enrollments_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE ON UPDATE CASCADE");

  console.log("UUID migration completed successfully.");
}

try {
  await migrate();
} finally {
  await sequelize.close();
}
