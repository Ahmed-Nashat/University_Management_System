// Adds timetable fields without Sequelize's automatic alter mode.
import { DataTypes } from "sequelize";
import { sequelize } from "../db/connection.js";

try {
  await sequelize.authenticate();

  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable("sections");

  if (!columns.day_of_week) {
    await queryInterface.addColumn("sections", "day_of_week", {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }

  if (!columns.start_time) {
    await queryInterface.addColumn("sections", "start_time", {
      type: DataTypes.TIME,
      allowNull: true,
    });
  }

  if (!columns.end_time) {
    await queryInterface.addColumn("sections", "end_time", {
      type: DataTypes.TIME,
      allowNull: true,
    });
  }

  console.log(
    "Timetable columns are ready. Update existing sections with a day, start time, and end time before checking conflicts.",
  );
} finally {
  await sequelize.close();
}
