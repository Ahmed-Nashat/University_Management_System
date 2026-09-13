import { DataTypes, Model } from "sequelize";
import { sequelize } from "../connection.js";

export class ProfessorModel extends Model {
  id;
}

ProfessorModel.init(
  {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: "Invalid email",
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
    departmentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "department_id",
    },
  },
  {
    sequelize,
    tableName: "professor",
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  },
);
