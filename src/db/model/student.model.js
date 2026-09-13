import { DataTypes, Model } from "sequelize";
import { sequelize } from "../connection.js";

export class StudentModel extends Model {
  id;
}

StudentModel.init(
  {
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isAlpha: {
          msg: "Only alphapets are allowed",
        },
        len: [3, 30],
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
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        this.setDataValue("userName", value.trim());
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
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^01[0-9]{9}$/,
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
        len: [50, 150],
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
    },
    admissionDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    timestamps: true,
    freezeTableName: true,
    paranoid: true,
  },
);

// await studentModel.sync({ alter: true });
