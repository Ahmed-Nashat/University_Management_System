import { DataTypes, Model } from "sequelize";
import { sequelize } from "../connection.js";

export class EnrollmentModel extends Model {}

EnrollmentModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isLowercase: true,
        isIn: [["pending", "passed", "failed"]],
      },
      set(value) {
        this.setDataValue("status", value.trim());
      },
    },
    finalGrade: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^([a-zA-Z][+-]?|[+-][a-zA-Z])$/,
      },
      set(value) {
        this.setDataValue(
          "finalGrade",
          value == null ? null : value.toUpperCase().trim(),
        );
      },
    },
    enrolledAt: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "student_id",
    },
    sectionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "section_id",
    },
  },
  {
    sequelize,
    tableName: "enrollments",
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  },
);
