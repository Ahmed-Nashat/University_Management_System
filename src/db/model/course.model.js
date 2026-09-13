import { DataTypes, Model } from "sequelize";
import { sequelize } from "../connection.js";

export class CourseModel extends Model {
  id;
}

CourseModel.init(
  {
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [5, 30],
      },
    },
    description: {
      type: DataTypes.STRING,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "department_id",
    },
  },
  {
    sequelize,
    timestamps: true,
    paranoid: true,
    freezeTableName: true,
    tableName: "courses",
  },
);
