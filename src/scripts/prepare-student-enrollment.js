// Explicit, non-destructive upgrade for existing databases; startup never alters tables.
import { DataTypes } from "sequelize";
import { sequelize } from "../db/connection.js";
try {
  await sequelize.authenticate();
  await sequelize
    .getQueryInterface()
    .changeColumn("enrollments", "finalGrade", {
      type: DataTypes.STRING,
      allowNull: true,
    });
  console.log(
    "Enrollment grades can now remain unpublished. Existing grades are preserved.",
  );
} finally {
  await sequelize.close();
}
