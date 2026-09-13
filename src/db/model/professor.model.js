import { DataTypes, Model } from "sequelize";
import { sequelize } from "../connection.js";

export class ProfessorModel extends Model {
  toJSON() {
    const professor = { ...this.get() };
    delete professor.password;
    return professor;
  }
}

ProfessorModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isAlpha: true,
        len: [3, 30],
      },
    },
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
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [8, 255],
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
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "department_id",
    },
  },
  {
    sequelize,
    tableName: "professors",
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  },
);
