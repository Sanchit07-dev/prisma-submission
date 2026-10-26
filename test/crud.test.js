/**
 * InstaLite – Prisma CRUD Integration Test Suite
 * Usage: node test/crud.test.js
 * Requires: server running on port 3000
 */
"use strict";

const BASE = "http://localhost:3000";
const PREFIX = "ag_crud_test_";
const results = [];
let createdUserId = null;
let createdPostId = null;
let secondUserId = null;

async function request(method, path, body) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  let json = null;
  const text = await res.text();
  try { json = JSON.parse(text); } catch (_) { json = text; }
  return { status: res.status, body: json };
}

function pass(name, note = "") {
  results.push({ name, result: "PASS", note });
  console.log(`  PASS  ${name}${note ? " | " + note : ""}`);
}
function fail(name, note = "") {
  results.push({ name, result: "FAIL", note });
  console.error(`  FAIL  ${name}${note ? " | " + note : ""}`);
}
function blocked(name, note = "") {
  results.push({ name, result: "BLOCKED", note });
  console.warn(`  BLOCKED ${name}${note ? " | " + note : ""}`);
}
function check(name, cond, note = "") { cond ? pass(name, note) : fail(name, note); }

async function testHealth() {
  console.log("\n-- Express Server & Health --");
  const r = await request("GET", "/health");
  check("GET /health -> 200", r.status === 200, `got ${r.status}`);
  check("GET /health body {status:'OK'}", r.body && r.body.status === "OK", JSON.stringify(r.body));
}

async function testUserCreate() {
  console.log("\n-- User Creation --");
  const r1 = await request("POST", "/users", {
    username: `${PREFIX}alice`, email: `${PREFIX}alice@test.com`, fullname: "Alice Test", bio: "Test bio"
  });
  check("POST /users valid -> 201", r1.status === 201, `got ${r1.status}`);
  check("POST /users returns user object", r1.body && typeof r1.body.id === "number", JSON.stringify(r1.body).slice(0,80));
  check("POST /users bio set correctly", r1.body && r1.body.bio === "Test bio", `bio=${r1.body && r1.body.bio}`);
  check("POST /users isPrivate defaults false", r1.body && r1.body.isPrivate === false, `isPrivate=${r1.body && r1.body.isPrivate}`);
  if (r1.status === 201 && r1.body && r1.body.id) { createdUserId = r1.body.id; console.log(`    created user id=${createdUserId}`); }

  const r2 = await request("POST", "/users", { username: `${PREFIX}bob`, email: `${PREFIX}bob@test.com`, fullname: "Bob Test" });
  check("POST /users second user -> 201", r2.status === 201, `got ${r2.status}`);
  if (r2.status === 201 && r2.body && r2.body.id) secondUserId = r2.body.id;

  const r3 = await request("POST", "/users", { email: `${PREFIX}x@test.com`, fullname: "X Test" });
  check("POST /users missing username -> 400", r3.status === 400, `got ${r3.status}`);
  check("POST /users missing username error msg", r3.body && r3.body.error === "username, email and fullname are required", JSON.stringify(r3.body));

  const r4 = await request("POST", "/users", { username: `${PREFIX}y`, fullname: "Y Test" });
  check("POST /users missing email -> 400", r4.status === 400, `got ${r4.status}`);

  const r5 = await request("POST", "/users", { username: `${PREFIX}z`, email: `${PREFIX}z@test.com` });
  check("POST /users missing fullname -> 400", r5.status === 400, `got ${r5.status}`);

  const r6 = await request("POST", "/users", {});
  check("POST /users empty body -> 400", r6.status === 400, `got ${r6.status}`);

  const r7 = await request("POST", "/users", { username: `${PREFIX}alice`, email: `${PREFIX}alice2@test.com`, fullname: "Alice Dup" });
  check("POST /users duplicate username -> 409", r7.status === 409, `got ${r7.status}`);
  check("POST /users duplicate username error msg", r7.body && r7.body.error === "username or email already taken", JSON.stringify(r7.body));

  const r8 = await request("POST", "/users", { username: `${PREFIX}alice_alt`, email: `${PREFIX}alice@test.com`, fullname: "Alice Alt" });
  check("POST /users duplicate email -> 409", r8.status === 409, `got ${r8.status}`);

  const r9 = await request("POST", "/users", {
    username: `${PREFIX}carol`, email: `${PREFIX}carol@test.com`, fullname: "Carol Test",
    id: 99999, createdAt: "2000-01-01", updatedAt: "2000-01-01"
  });
  check("POST /users unexpected fields ignored -> 201", r9.status === 201, `got ${r9.status}`);
  check("POST /users id not forced to 99999", r9.body && r9.body.id !== 99999, `id=${r9.body && r9.body.id}`);
  if (r9.status === 201 && r9.body && r9.body.id) await request("DELETE", `/users/${r9.body.id}`);
}

async function testUserList() {
  console.log("\n-- User Listing --");
  const r = await request("GET", "/users");
  check("GET /users -> 200", r.status === 200, `got ${r.status}`);
  check("GET /users has data array", r.body && Array.isArray(r.body.data), JSON.stringify(r.body).slice(0,80));
  check("GET /users has meta", r.body && typeof r.body.meta === "object", JSON.stringify(r.body && r.body.meta));
}

async function testUserGetOne() {
  console.log("\n-- User Retrieval --");
  if (!createdUserId) { blocked("GET /users/:id existing user", "createdUserId not set"); return; }
  const r1 = await request("GET", `/users/${createdUserId}`);
  check("GET /users/:id -> 200", r1.status === 200, `got ${r1.status}`);
  check("GET /users/:id correct user", r1.body && r1.body.id === createdUserId, `id=${r1.body && r1.body.id}`);
  const r2 = await request("GET", "/users/9999999");
  check("GET /users/9999999 -> 404", r2.status === 404, `got ${r2.status}`);
  check("GET /users/9999999 error msg", r2.body && r2.body.error === "User not found", JSON.stringify(r2.body));
  const r3 = await request("GET", "/users/abc");
  check("GET /users/abc graceful no 500", r3.status !== 500, `got ${r3.status}`);
}

async function testUserUpdate() {
  console.log("\n-- User Update --");
  if (!createdUserId) { blocked("PATCH /users/:id", "createdUserId not set"); return; }
  const r1 = await request("PATCH", `/users/${createdUserId}`, { fullname: "Alice Updated" });
  check("PATCH /users/:id fullname -> 200", r1.status === 200, `got ${r1.status}`);
  check("PATCH /users/:id fullname updated", r1.body && r1.body.fullname === "Alice Updated", `fullname=${r1.body && r1.body.fullname}`);
  const r2 = await request("PATCH", `/users/${createdUserId}`, { bio: "New bio" });
  check("PATCH /users/:id bio -> 200", r2.status === 200, `got ${r2.status}`);
  check("PATCH /users/:id bio updated", r2.body && r2.body.bio === "New bio", `bio=${r2.body && r2.body.bio}`);
  const r3 = await request("PATCH", `/users/${createdUserId}`, { isPrivate: true });
  check("PATCH /users/:id isPrivate -> 200", r3.status === 200, `got ${r3.status}`);
  check("PATCH /users/:id isPrivate updated", r3.body && r3.body.isPrivate === true, `isPrivate=${r3.body && r3.body.isPrivate}`);
  const r4 = await request("PATCH", `/users/${createdUserId}`, { fullname: "Alice Multi", bio: "Multi bio", isPrivate: false });
  check("PATCH /users/:id multiple fields -> 200", r4.status === 200, `got ${r4.status}`);
  const r5 = await request("PATCH", `/users/${createdUserId}`, {});
  check("PATCH /users/:id empty body -> 200", r5.status === 200, `got ${r5.status}`);
  const r6 = await request("PATCH", `/users/${createdUserId}`, { username: "should_be_ignored", email: "ignored@test.com", id: 1 });
  check("PATCH /users/:id ignored fields -> 200", r6.status === 200, `got ${r6.status}`);
  const r6check = await request("GET", `/users/${createdUserId}`);
  check("PATCH /users/:id username not changed", r6check.body && r6check.body.username === `${PREFIX}alice`, `username=${r6check.body && r6check.body.username}`);
  const r7 = await request("PATCH", "/users/9999999", { fullname: "Ghost" });
  check("PATCH /users/9999999 -> 404", r7.status === 404, `got ${r7.status}`);
  check("PATCH /users/9999999 error msg", r7.body && r7.body.error === "User not found", JSON.stringify(r7.body));
}

async function testPostCreate() {
  console.log("\n-- Post Creation --");
  if (!createdUserId) { blocked("POST /posts", "createdUserId not set"); return; }
  const r1 = await request("POST", "/posts", {
    imageUrl: "https://picsum.photos/seed/ag_test1/600/600", caption: "AG test post", location: "Test City", authorId: createdUserId
  });
  check("POST /posts valid -> 201", r1.status === 201, `got ${r1.status}`);
  check("POST /posts returns post object", r1.body && typeof r1.body.id === "number", JSON.stringify(r1.body).slice(0,100));
  if (r1.status === 201 && r1.body && r1.body.id) { createdPostId = r1.body.id; console.log(`    created post id=${createdPostId}`); }
  const r2 = await request("POST", "/posts", { caption: "no image", authorId: createdUserId });
  check("POST /posts missing imageUrl -> 400", r2.status === 400, `got ${r2.status}`);
  check("POST /posts missing imageUrl error msg", r2.body && (r2.body.error === "imageUrl and authorId are required" || r2.body.error === "imageUrl is required"), JSON.stringify(r2.body));
  const r3 = await request("POST", "/posts", { imageUrl: "https://picsum.photos/seed/ag_test2/600/600" });
  check("POST /posts missing authorId -> 400", r3.status === 400, `got ${r3.status}`);
  const r4 = await request("POST", "/posts", { imageUrl: "https://picsum.photos/seed/ag_test3/600/600", authorId: createdUserId });
  check("POST /posts optional fields omitted -> 201", r4.status === 201, `got ${r4.status}`);
  if (r4.status === 201 && r4.body && r4.body.id) await request("DELETE", `/posts/${r4.body.id}`);
  const r5 = await request("POST", "/posts", { imageUrl: "https://picsum.photos/seed/ag_test4/600/600", authorId: createdUserId, id: 99999, createdAt: "2000-01-01" });
  check("POST /posts unexpected fields ignored -> 201", r5.status === 201, `got ${r5.status}`);
  check("POST /posts id not forced to 99999", r5.body && r5.body.id !== 99999, `id=${r5.body && r5.body.id}`);
  if (r5.status === 201 && r5.body && r5.body.id) await request("DELETE", `/posts/${r5.body.id}`);
  const r6 = await request("POST", "/posts", { imageUrl: "https://picsum.photos/seed/ag_test5/600/600", authorId: 9999999 });
  check("POST /posts non-existent authorId -> 404", r6.status === 404, `got ${r6.status}`);
}

async function testPostList() {
  console.log("\n-- Post Listing --");
  const r = await request("GET", "/posts");
  check("GET /posts -> 200", r.status === 200, `got ${r.status}`);
  check("GET /posts has data array", r.body && Array.isArray(r.body.data), JSON.stringify(r.body).slice(0,80));
  check("GET /posts has meta", r.body && typeof r.body.meta === "object", JSON.stringify(r.body && r.body.meta));
}

async function testPostGetOne() {
  console.log("\n-- Post Retrieval --");
  if (!createdPostId) { blocked("GET /posts/:id existing post", "createdPostId not set"); return; }
  const r1 = await request("GET", `/posts/${createdPostId}`);
  check("GET /posts/:id -> 200", r1.status === 200, `got ${r1.status}`);
  check("GET /posts/:id correct post", r1.body && r1.body.id === createdPostId, `id=${r1.body && r1.body.id}`);
  const r2 = await request("GET", "/posts/9999999");
  check("GET /posts/9999999 -> 404", r2.status === 404, `got ${r2.status}`);
  check("GET /posts/9999999 error msg", r2.body && r2.body.error === "Post not found", JSON.stringify(r2.body));
  const r3 = await request("GET", "/posts/abc");
  check("GET /posts/abc graceful no 500", r3.status !== 500, `got ${r3.status}`);
}

async function testPostUpdate() {
  console.log("\n-- Post Update --");
  if (!createdPostId) { blocked("PATCH /posts/:id", "createdPostId not set"); return; }
  const r1 = await request("PATCH", `/posts/${createdPostId}`, { caption: "Updated caption" });
  check("PATCH /posts/:id caption -> 200", r1.status === 200, `got ${r1.status}`);
  check("PATCH /posts/:id caption updated", r1.body && r1.body.caption === "Updated caption", `caption=${r1.body && r1.body.caption}`);
  const r2 = await request("PATCH", `/posts/${createdPostId}`, { location: "New Location" });
  check("PATCH /posts/:id location -> 200", r2.status === 200, `got ${r2.status}`);
  const r3 = await request("PATCH", `/posts/${createdPostId}`, { caption: "Both updated", location: "Both Location" });
  check("PATCH /posts/:id both fields -> 200", r3.status === 200, `got ${r3.status}`);
  const origPost = await request("GET", `/posts/${createdPostId}`);
  const origUrl = origPost.body && origPost.body.imageUrl;
  const r4 = await request("PATCH", `/posts/${createdPostId}`, { imageUrl: "https://evil.com/fake.jpg" });
  check("PATCH /posts/:id imageUrl ignored -> 200", r4.status === 200, `got ${r4.status}`);
  const r4check = await request("GET", `/posts/${createdPostId}`);
  check("PATCH /posts/:id imageUrl not changed", r4check.body && r4check.body.imageUrl === origUrl, `imageUrl=${r4check.body && r4check.body.imageUrl}`);
  const r5 = await request("PATCH", "/posts/9999999", { caption: "Ghost" });
  check("PATCH /posts/9999999 -> 404", r5.status === 404, `got ${r5.status}`);
  check("PATCH /posts/9999999 error msg", r5.body && r5.body.error === "Post not found", JSON.stringify(r5.body));
}

async function testPostDelete() {
  console.log("\n-- Post Deletion --");
  if (!createdPostId) { blocked("DELETE /posts/:id", "createdPostId not set"); return; }
  const r1 = await request("DELETE", `/posts/${createdPostId}`);
  check("DELETE /posts/:id first -> 204", r1.status === 204, `got ${r1.status}`);
  const r2 = await request("DELETE", `/posts/${createdPostId}`);
  check("DELETE /posts/:id second -> 404", r2.status === 404, `got ${r2.status}`);
  check("DELETE /posts/:id second error msg", r2.body && r2.body.error === "Post not found", JSON.stringify(r2.body));
  const r3 = await request("DELETE", "/posts/9999999");
  check("DELETE /posts/9999999 -> 404", r3.status === 404, `got ${r3.status}`);
  createdPostId = null;
}

async function testUserDelete() {
  console.log("\n-- User Deletion --");
  if (!createdUserId && !secondUserId) { blocked("DELETE /users/:id", "no test users available"); return; }
  if (secondUserId) {
    const r0 = await request("DELETE", `/users/${secondUserId}`);
    check("DELETE /users/:id second user -> 204", r0.status === 204, `got ${r0.status}`);
    secondUserId = null;
  }
  const r1 = await request("DELETE", `/users/${createdUserId}`);
  check("DELETE /users/:id first -> 204", r1.status === 204, `got ${r1.status}`);
  const r2 = await request("DELETE", `/users/${createdUserId}`);
  check("DELETE /users/:id second -> 404", r2.status === 404, `got ${r2.status}`);
  check("DELETE /users/:id second error msg", r2.body && r2.body.error === "User not found", JSON.stringify(r2.body));
  const r3 = await request("DELETE", "/users/9999999");
  check("DELETE /users/9999999 -> 404", r3.status === 404, `got ${r3.status}`);
  createdUserId = null;
}

async function testErrorEdgeCases() {
  console.log("\n-- Error Handling & Edge Cases --");
  try {
    const res = await fetch(`${BASE}/users`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{ bad json !!" });
    check("POST /users malformed JSON -> not 500", res.status !== 500, `got ${res.status}`);
  } catch (e) { fail("POST /users malformed JSON", e.message); }
  try {
    const res = await fetch(`${BASE}/users`, { method: "POST" });
    check("POST /users no body -> not 500", res.status !== 500, `got ${res.status}`);
  } catch (e) { fail("POST /users no body", e.message); }
  const r2 = await request("POST", "/posts", { imageUrl: null, authorId: 1 });
  check("POST /posts null imageUrl -> 400", r2.status === 400, `got ${r2.status}`);
  const r3 = await request("POST", "/posts", { imageUrl: "", authorId: 1 });
  check("POST /posts empty imageUrl -> 400", r3.status === 400, `got ${r3.status}`);
}

async function testRegressions() {
  console.log("\n-- Regression: Existing Data Intact --");
  const r = await request("GET", "/users");
  check("GET /users still returns existing records", r.body && r.body.meta && r.body.meta.total >= 12, `total=${r.body && r.body.meta && r.body.meta.total}`);
  const rp = await request("GET", "/posts");
  check("GET /posts still returns existing records", rp.body && rp.body.meta && rp.body.meta.total >= 24, `total=${rp.body && rp.body.meta && rp.body.meta.total}`);
}

async function cleanup() {
  if (createdPostId) { await request("DELETE", `/posts/${createdPostId}`).catch(() => {}); createdPostId = null; }
  if (createdUserId) { await request("DELETE", `/users/${createdUserId}`).catch(() => {}); createdUserId = null; }
  if (secondUserId) { await request("DELETE", `/users/${secondUserId}`).catch(() => {}); secondUserId = null; }
}

function printSummary() {
  const passed = results.filter(r => r.result === "PASS").length;
  const failed = results.filter(r => r.result === "FAIL").length;
  const bk = results.filter(r => r.result === "BLOCKED").length;
  const total = results.length;
  console.log("\n\n============================================================");
  console.log("  FINAL TEST REPORT - InstaLite CRUD Lab");
  console.log("============================================================");
  console.log(`  Total: ${total}  |  PASS: ${passed}  |  FAIL: ${failed}  |  BLOCKED: ${bk}`);
  const overall = failed > 0 ? "FAIL" : bk > 0 ? "BLOCKED" : "PASS";
  console.log(`  Overall result: ${overall}`);
  console.log("------------------------------------------------------------");
  if (failed > 0) {
    console.log("\nFailed tests:");
    results.filter(r => r.result === "FAIL").forEach(r => console.log(`  FAIL  ${r.name}  [${r.note}]`));
  }
  if (bk > 0) {
    console.log("\nBlocked tests:");
    results.filter(r => r.result === "BLOCKED").forEach(r => console.log(`  BLOCKED  ${r.name}  [${r.note}]`));
  }
  return { overall, failed, bk };
}

async function main() {
  console.log("InstaLite CRUD Integration Test Suite");
  console.log(`Server: ${BASE}  |  Prefix: ${PREFIX}`);
  console.log("------------------------------------------------------------");
  try {
    await testHealth();
    await testUserCreate();
    await testUserList();
    await testUserGetOne();
    await testUserUpdate();
    await testPostCreate();
    await testPostList();
    await testPostGetOne();
    await testPostUpdate();
    await testPostDelete();
    await testUserDelete();
    await testErrorEdgeCases();
    await testRegressions();
  } catch (err) {
    console.error("\nUnexpected test runner error:", err);
  } finally {
    await cleanup();
  }
  const { failed } = printSummary();
  process.exit(failed > 0 ? 1 : 0);
}

main();
