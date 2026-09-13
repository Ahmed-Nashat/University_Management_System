import { DataTypes, Model } from "sequelize";
import { sequelize } from "../connection.js";

export class SemesterModel extends Model {
  id;
}

SemesterModel.init(
  {
    academicYear: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
      },
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
