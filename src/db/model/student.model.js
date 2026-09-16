import { DataTypes, Model, Op } from "sequelize";
import { sequelize } from "../connection.js";

export class StudentModel extends Model {
  toJSON() {
    const student = { ...this.get() };
    delete student.firstName;
    delete student.lastName;
    return student;
  }
}

StudentModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    studentNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: "student_number",
      set(value) {
        this.setDataValue("studentNumber", value.trim());
      },
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isAlpha: {
          msg: "Only alphapets are allowed",
        },
        len: [3, 30],
      },
      set(value) {
        this.setDataValue("firstName", value.trim());
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isAlpha: {
          msg: "Only alphapets are allowed",
        },
        len: [3, 30],
      },
      set(value) {
        this.setDataValue("lastName", value.trim());
      },
    },
    userName: {
      type: DataTypes.VIRTUAL,
      get() {
        const firstName = this.getDataValue("firstName");
        const lastName = this.getDataValue("lastName");

        return `${firstName} ${lastName}`.trim();
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: "This email is invalid",
        },
      },
      set(value) {
        this.setDataValue("email", value.toLowerCase().trim());
      },
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^01[0-9]{9}$/,
      },
      set(value) {
        this.setDataValue("phoneNumber", value.trim());
      },
    },
    DOB: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    age: {
      type: DataTypes.VIRTUAL,
      get() {
        const rawValue = this.getDataValue("DOB");
        if (!rawValue) return null;
        const year = new Date(rawValue).getFullYear();
        const currentYear = new Date().getFullYear();
        return currentYear - year;
      },
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [10, 250],
      },
      set(value) {
        this.setDataValue("address", value.trim());
      },
    },
    level: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        isValid(value) {
          if (value < 1 || value > 5) {
            throw new Error("Level must be between 1 and 5");
          }
        },
      },
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isLowercase: true,
        isIn: [["undergraduate", "graduate", "post-graduate"]],
      },
      set(value) {
        this.setDataValue("status", value.trim());
      },
    },
    admissionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "admission_date",
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "department_id",
    },
    academicAdvisorId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "academic_advisor_id",
    },
  },
  {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    paranoid: true,
    tableName: "students",
  },
);

StudentModel.beforeValidate(async (student) => {
  // Editing a student must preserve the number they use to sign in.
  if (!student.isNewRecord) return;
  const year = new Date().getFullYear();
  const latestStudent = await StudentModel.findOne({
    where: {
      studentNumber: {
        [Op.like]: `STD-${year}-%`,
      },
    },
    order: [["studentNumber", "DESC"]],
    paranoid: false,
  });
  const lastSequence = latestStudent
    ? Number(latestStudent.studentNumber.split("-")[2])
    : 0;

  student.studentNumber = `STD-${year}-${String(lastSequence + 1).padStart(4, "0")}`;
});
