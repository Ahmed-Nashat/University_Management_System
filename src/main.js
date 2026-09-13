import express from "express";
import config from "./config/config.service.js";
import { checkdb } from "./db/connection.js";
import { setupAssociations } from "./db/model/index.js";
import { errorHandler } from "./common/index.js";
import * as routers from "./module/index.js";

const app = express();
const port = config.port;

app.use(express.json());

setupAssociations();
await checkdb();

app.use("/students", routers.studentRouter);

app.use(errorHandler);
app.listen(port, () => {
  console.log("Server is running on port:", port);
});
