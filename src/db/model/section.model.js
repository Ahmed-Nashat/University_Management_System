import { DataTypes, Model } from "sequelize";
import { sequelize } from "../connection.js";

export class SectionModel extends Model {}

SectionModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    room: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isAlphanumeric: true,
      },
      set(value) {
        this.setDataValue("room", value.trim());
      },
    },
    schedule: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    dayOfWeek: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "day_of_week",
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: "start_time",
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: "end_time",
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sectionCode: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "section_code",
    },
    semesterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "semester_id",
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "course_id",
    },
    professorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "professor_id",
    },
  },
  {
    freezeTableName: true,
    tableName: "sections",
    timestamps: true,
    paranoid: true,
    sequelize,
    indexes: [
      {
        unique: true,
        fields: ["section_code", "semester_id", "course_id"],
        name: "unique_section_per_course_semester",
      },
    ],
  },
);
