import { DataTypes, Model } from "sequelize";
import { sequelize } from "../connection.js";

export class AuditLogModel extends Model {}
AuditLogModel.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  professorId: { type: DataTypes.UUID, allowNull: false },
  professorName: { type: DataTypes.STRING, allowNull: false },
  sectionId: { type: DataTypes.INTEGER, allowNull: false },
  enrollmentId: { type: DataTypes.INTEGER, allowNull: false },
  studentNumber: { type: DataTypes.STRING, allowNull: false },
  action: { type: DataTypes.STRING, allowNull: false },
  before: { type: DataTypes.JSON, allowNull: false, get() { const value = this.getDataValue("before"); return typeof value === "string" ? JSON.parse(value) : value; } },
  after: { type: DataTypes.JSON, allowNull: false, get() { const value = this.getDataValue("after"); return typeof value === "string" ? JSON.parse(value) : value; } },
}, { sequelize, tableName: "audit_logs", timestamps: true, updatedAt: false,
  indexes: [{ fields: ["sectionId", "id"] }] });
