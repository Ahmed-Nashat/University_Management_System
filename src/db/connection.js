import { Sequelize } from "sequelize";
import configService from "../config/config.service.js";

const { DB } = configService;

export const sequelize = new Sequelize(DB.name, DB.user, DB.password, {
  host: DB.host,
  port: DB.db_port,
  dialect: DB.dialect,
  pool: {
    max: 10,
    min: 2,
  },
});

export const checkdb = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("DB connected");
  } catch (e) {
    console.log("Database connection error: ", e);
    throw e;
  }
};
