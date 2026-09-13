import { sequelize } from "../connection.js";

const integerIdTables = ["departments", "courses", "semesters", "sections", "enrollments"];
const foreignKeyTables = ["professors", "students", "courses", "sections", "enrollments"];

const query = (sql) => sequelize.query(sql);

async function dropForeignKeys(table) {
  const references = await sequelize.getQueryInterface().getForeignKeyReferencesForTable(table);

  for (const reference of references) {
    await sequelize.getQueryInterface().removeConstraint(table, reference.constraintName);
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

  if (existingIds[0]?.columnType.toLowerCase().startsWith("int")) {
    console.log("Mixed ID migration has already been applied.");
    return;
  }

  for (const table of integerIdTables) {
    await query(`ALTER TABLE \`${table}\` ADD COLUMN \`new_id\` INT NULL`);
    await query(`
      UPDATE \`${table}\` target
      JOIN (SELECT \`id\`, ROW_NUMBER() OVER (ORDER BY \`id\`) AS sequenceNumber FROM \`${table}\`) source
        ON target.\`id\` = source.\`id\`
      SET target.\`new_id\` = source.sequenceNumber
    `);
  }

  await query("ALTER TABLE professors ADD COLUMN new_department_id INT NULL");
  await query("ALTER TABLE students ADD COLUMN new_department_id INT NULL");
  await query("ALTER TABLE courses ADD COLUMN new_department_id INT NULL");
  await query("ALTER TABLE sections ADD COLUMN new_semester_id INT NULL, ADD COLUMN new_course_id INT NULL");
  await query("ALTER TABLE enrollments ADD COLUMN new_section_id INT NULL");

  await query("UPDATE professors p JOIN departments d ON p.department_id = d.id SET p.new_department_id = d.new_id");
  await query("UPDATE students s JOIN departments d ON s.department_id = d.id SET s.new_department_id = d.new_id");
  await query("UPDATE courses c JOIN departments d ON c.department_id = d.id SET c.new_department_id = d.new_id");
  await query("UPDATE sections s JOIN semesters sem ON s.semester_id = sem.id SET s.new_semester_id = sem.new_id");
  await query("UPDATE sections s JOIN courses c ON s.course_id = c.id SET s.new_course_id = c.new_id");
  await query("UPDATE enrollments e JOIN sections s ON e.section_id = s.id SET e.new_section_id = s.new_id");

  for (const table of foreignKeyTables) {
    await dropForeignKeys(table);
  }

  for (const table of integerIdTables) {
    await query(`ALTER TABLE \`${table}\` DROP PRIMARY KEY, DROP COLUMN \`id\`, CHANGE COLUMN \`new_id\` \`id\` INT NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (\`id\`)`);
  }

  await query("ALTER TABLE professors DROP COLUMN department_id, CHANGE COLUMN new_department_id department_id INT NOT NULL");
  await query("ALTER TABLE students DROP COLUMN department_id, CHANGE COLUMN new_department_id department_id INT NOT NULL");
  await query("ALTER TABLE courses DROP COLUMN department_id, CHANGE COLUMN new_department_id department_id INT NOT NULL");
  await query("ALTER TABLE sections DROP INDEX unique_section_per_course_semester");
  await query("ALTER TABLE sections DROP COLUMN semester_id, DROP COLUMN course_id, CHANGE COLUMN new_semester_id semester_id INT NOT NULL, CHANGE COLUMN new_course_id course_id INT NOT NULL");
  await query("ALTER TABLE enrollments DROP COLUMN section_id, CHANGE COLUMN new_section_id section_id INT NOT NULL");

  await query("ALTER TABLE professors ADD CONSTRAINT fk_professors_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE ON UPDATE CASCADE");
  await query("ALTER TABLE students ADD CONSTRAINT fk_students_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE ON UPDATE CASCADE, ADD CONSTRAINT fk_students_academic_advisor FOREIGN KEY (academic_advisor_id) REFERENCES professors(id) ON DELETE SET NULL ON UPDATE CASCADE");
  await query("ALTER TABLE courses ADD CONSTRAINT fk_courses_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE ON UPDATE CASCADE");
  await query("ALTER TABLE sections ADD CONSTRAINT fk_sections_semester FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE ON UPDATE CASCADE, ADD CONSTRAINT fk_sections_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE, ADD CONSTRAINT fk_sections_professor FOREIGN KEY (professor_id) REFERENCES professors(id) ON DELETE CASCADE ON UPDATE CASCADE, ADD CONSTRAINT unique_section_per_course_semester UNIQUE (section_code, semester_id, course_id)");
  await query("ALTER TABLE enrollments ADD CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE, ADD CONSTRAINT fk_enrollments_section FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE ON UPDATE CASCADE");

  console.log("Mixed ID migration completed successfully.");
}

try {
  await migrate();
} finally {
  await sequelize.close();
}
