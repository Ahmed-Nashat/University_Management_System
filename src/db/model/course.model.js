import { DataTypes, Model } from "sequelize";
import { sequelize } from "../connection.js";

export class CurseModel extends Model {
  id;
}

CurseModel.init(
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
  },
  {
    sequelize,
    timestamps: true,
    paranoid: true,
    freezeTableName: true,
  },
);
