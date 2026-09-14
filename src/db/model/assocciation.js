import * as models from "./index.js";

export const setupAssociations = () => {
  models.DepartmentModel.hasMany(models.StudentModel, {
    foreignKey: "departmentId",
  });
  models.StudentModel.belongsTo(models.DepartmentModel, {
    foreignKey: "departmentId",
  });

  models.DepartmentModel.hasMany(models.ProfessorModel, {
    foreignKey: "departmentId",
    as: "professors",
  });
  models.ProfessorModel.belongsTo(models.DepartmentModel, {
    foreignKey: "departmentId",
  });

  models.DepartmentModel.hasMany(models.CourseModel, {
    foreignKey: "departmentId",
    as: "courses",
  });
  models.CourseModel.belongsTo(models.DepartmentModel, {
    foreignKey: "departmentId",
  });

  models.ProfessorModel.hasMany(models.StudentModel, {
    foreignKey: "academicAdvisorId",
    as: "advisees",
  });
  models.StudentModel.belongsTo(models.ProfessorModel, {
    foreignKey: "academicAdvisorId",
    as: "academicAdvisor",
  });

  models.CourseModel.hasMany(models.SectionModel, { foreignKey: "courseId" });
  models.SectionModel.belongsTo(models.CourseModel, { foreignKey: "courseId" });

  models.SemesterModel.hasMany(models.SectionModel, {
    foreignKey: "semesterId",
  });
  models.SectionModel.belongsTo(models.SemesterModel, {
    foreignKey: "semesterId",
  });

  models.ProfessorModel.hasMany(models.SectionModel, {
    foreignKey: "professorId",
    as: "sections",
  });
  models.SectionModel.belongsTo(models.ProfessorModel, {
    foreignKey: "professorId",
    as: "professor",
  });

  models.StudentModel.belongsToMany(models.SectionModel, {
    through: { model: models.EnrollmentModel, unique: false },
    foreignKey: "studentId",
    otherKey: "sectionId",
    as: "sections",
  });
  models.SectionModel.belongsToMany(models.StudentModel, {
    through: { model: models.EnrollmentModel, unique: false },
    foreignKey: "sectionId",
    otherKey: "studentId",
    as: "students",
  });

  models.EnrollmentModel.belongsTo(models.StudentModel, {
    foreignKey: "studentId",
  });
  models.EnrollmentModel.belongsTo(models.SectionModel, {
    foreignKey: "sectionId",
  });

  models.StudentModel.hasMany(models.EnrollmentModel, {
    foreignKey: "studentId",
  });
  models.SectionModel.hasMany(models.EnrollmentModel, {
    foreignKey: "sectionId",
  });
};
