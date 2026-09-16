import { randomBytes } from "node:crypto";

const COOKIE = "campus_session";
const MAX_AGE = 8 * 60 * 60 * 1000;
const sessions = new Map();
const attempts = new Map();
const sweep = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of sessions)
    if (value.expires <= now) sessions.delete(key);
  for (const [key, value] of attempts)
    if (value.expires <= now) attempts.delete(key);
}, 60000);
sweep.unref();

function token(req) {
  return (req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
}
export function getSession(req) {
  const id = token(req);
  const session = sessions.get(id);
  if (!session || session.expires <= Date.now()) {
    sessions.delete(id);
    return null;
  }
  return session;
}
export function endSession(req, res) {
  sessions.delete(token(req));
  res.clearCookie(COOKIE, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}
export function beginSession(req, res, user) {
  sessions.delete(token(req));
  const id = randomBytes(32).toString("hex");
  sessions.set(id, { ...user, expires: Date.now() + MAX_AGE });
  res.cookie(COOKIE, id, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}
export function limitLogin(req, res, next) {
  const key = req.ip;
  let bucket = attempts.get(key);
  if (!bucket || bucket.expires <= Date.now()) {
    bucket = { count: 0, expires: Date.now() + 15 * 60000 };
    attempts.set(key, bucket);
  }
  if (++bucket.count > 15)
    return res
      .status(429)
      .json({ msg: "Too many sign-in attempts. Try again in 15 minutes." });
  next();
}
export function requireProfessor(req, res, next) {
  if (req.user?.role !== "professor")
    return res.status(403).json({ msg: "Professor access is required." });
  next();
}
export function protectWrites(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.headers["sec-fetch-site"] === "cross-site")
    return res
      .status(403)
      .json({ msg: "Cross-site requests are not allowed." });
  const origin = req.headers.origin;
  const allowed = (
    process.env.UI_ORIGINS || "http://127.0.0.1:5173,http://localhost:5173"
  )
    .split(",")
    .map((item) => item.trim());
  if (origin && !allowed.includes(origin))
    return res.status(403).json({ msg: "This origin is not allowed." });
  if (!req.is("application/json"))
    return res.status(415).json({ msg: "Send application/json." });
  next();
}
