import { DataTypes, Model } from "sequelize";
import { sequelize } from "../connection.js";

export class DepartmentModel extends Model {
  id;
}

DepartmentModel.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isAlpha: true,
      },
      set(value) {
        this.setDataValue("name", value.trim());
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
    office: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isAlpha: true,
      },
      set(value) {
        this.setDataValue("office", value.trim());
      },
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
    sequelize,
  },
);
