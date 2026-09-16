import test from "node:test";
import assert from "node:assert/strict";
import {
  beginSession,
  endSession,
  getSession,
  requireProfessor,
  protectWrites,
  limitLogin,
} from "../module/auth/session.js";

function response() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
    cookie(name, value, options) {
      this.cookieInfo = { name, value, options };
    },
    clearCookie() {
      this.cleared = true;
    },
  };
}
test("sessions use opaque HttpOnly cookies, rotate on login, and expire on logout", () => {
  const req = { headers: {} };
  const res = response();
  beginSession(req, res, { id: "s1", role: "student" });
  assert.equal(res.cookieInfo.options.httpOnly, true);
  assert.equal(res.cookieInfo.options.sameSite, "strict");
  assert.match(res.cookieInfo.value, /^[0-9a-f]{64}$/);
  req.headers.cookie = `${res.cookieInfo.name}=${res.cookieInfo.value}`;
  assert.equal(getSession(req).id, "s1");
  const oldCookie = req.headers.cookie;
  beginSession(req, res, { id: "p1", role: "professor" });
  assert.equal(getSession({ headers: { cookie: oldCookie } }), null);
  req.headers.cookie = `${res.cookieInfo.name}=${res.cookieInfo.value}`;
  endSession(req, res);
  assert.equal(getSession(req), null);
});
test("students and anonymous users cannot reach professor management routes", () => {
  for (const user of [undefined, { role: "student" }]) {
    const res = response();
    let called = false;
    requireProfessor({ user }, res, () => {
      called = true;
    });
    assert.equal(res.statusCode, 403);
    assert.equal(called, false);
  }
  let called = false;
  requireProfessor({ user: { role: "professor" } }, response(), () => {
    called = true;
  });
  assert.equal(called, true);
});
test("write guard rejects cross-site writes and non-JSON submissions", () => {
  for (const headers of [
    { "sec-fetch-site": "cross-site" },
    { origin: "https://attacker.example" },
  ]) {
    const res = response();
    protectWrites({ method: "POST", headers, is: () => true }, res, () =>
      assert.fail(),
    );
    assert.equal(res.statusCode, 403);
  }
  const res = response();
  protectWrites({ method: "POST", headers: {}, is: () => false }, res, () =>
    assert.fail(),
  );
  assert.equal(res.statusCode, 415);
});
test("login attempts are throttled by IP", () => {
  const req = { ip: "test-only" };
  for (let i = 0; i < 15; i++) limitLogin(req, response(), () => {});
  const res = response();
  limitLogin(req, res, () => assert.fail());
  assert.equal(res.statusCode, 429);
});
