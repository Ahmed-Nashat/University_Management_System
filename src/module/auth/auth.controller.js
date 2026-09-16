import { Router } from "express";
import { StudentModel, ProfessorModel } from "../../db/model/index.js";
import { comparing } from "../../common/security/security.js";
import { beginSession, endSession, getSession, limitLogin } from "./session.js";

export const authRouter = Router();
const publicUser = (role, record) => ({
  role,
  id: record.id,
  name: role === "student" ? record.userName : record.name,
  ...(role === "student"
    ? { studentNumber: record.studentNumber }
    : { email: record.email }),
});

authRouter.post("/login", limitLogin, async (req, res) => {
  const { role, studentNumber, email, password } = req.body || {};
  let record;
  if (role === "student" && typeof studentNumber === "string") {
    record = await StudentModel.findOne({
      where: { studentNumber: studentNumber.trim() },
    });
  } else if (
    role === "professor" &&
    typeof email === "string" &&
    typeof password === "string"
  ) {
    record = await ProfessorModel.findOne({
      where: { email: email.trim().toLowerCase() },
    });
    if (
      record &&
      !(await comparing({ plainText: password, cipherText: record.password }))
    )
      record = null;
  }
  if (!record)
    return res.status(401).json({ msg: "Sign-in details are incorrect." });
  const user = publicUser(role, record);
  beginSession(req, res, user);
  return res.json({ data: user });
});

export async function requireSession(req, res, next) {
  const session = getSession(req);
  if (!session)
    return res.status(401).json({ msg: "Please sign in to continue." });
  const model = session.role === "student" ? StudentModel : ProfessorModel;
  const record = await model.findByPk(session.id);
  if (!record) {
    endSession(req, res);
    return res
      .status(401)
      .json({ msg: "This account is no longer available." });
  }
  req.user = publicUser(session.role, record);
  next();
}

authRouter.get("/me", requireSession, (req, res) =>
  res.json({ data: req.user }),
);
authRouter.post("/logout", (req, res) => {
  endSession(req, res);
  res.json({ msg: "Signed out" });
});
