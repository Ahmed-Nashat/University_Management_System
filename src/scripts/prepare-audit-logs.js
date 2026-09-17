import { AuditLogModel } from "../db/model/index.js";
import { sequelize } from "../db/connection.js";
try {
  await AuditLogModel.sync();
  console.log("Audit log table ready. Existing records preserved.");
} finally { await sequelize.close(); }
