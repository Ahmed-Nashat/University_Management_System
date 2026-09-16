import { DataTypes, Model } from "sequelize";
import { sequelize } from "../connection.js";

export class SemesterModel extends Model {}

SemesterModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^\d{4}\/\d{4}$/,
      },
    },
    term: {
      type: DataTypes.ENUM("fall", "spring", "summer"),
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
  },
  {
    tableName: "semesters",
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
    sequelize,
  },
);
