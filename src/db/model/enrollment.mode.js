import { DataTypes, Model } from "sequelize";
import { sequelize } from "../connection.js";

export class EnrollmentModel extends Model {
  id;
}

EnrollmentModel.init(
  {
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isLowercase: true,
        isIn: [["passed", "failed"]],
      },
      set(value) {
        this.setDataValue("status", value.trim());
      },
    },
    finalGrade: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^([a-zA-Z][+-]?|[+-][a-zA-Z])$/,
      },
      set(value) {
        this.setDataValue("finalGrade", value.toUpperCase().trim());
      },
    },
    enrolledAt: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
      },
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
