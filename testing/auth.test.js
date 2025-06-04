const request = require("supertest");
const path = require("path");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { sequelize } = require("../src/models");

// Load test env first
dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

const app = require(path.resolve(__dirname, "../app"));

const testUser = {
  name: "Test User",
  email: "test@example.com",
  password: "Password123!",
};

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe("Auth Flow", () => {
  let authToken;

  test("1. Register User - POST /api/auth/register", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        ...testUser,
        role: "user", // Pastikan register sebagai user biasa
      });

    console.log("Register Response:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();

    authToken = res.body.token;
  });

  test("2. Login User - POST /api/auth/login", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    console.log("Login Response:", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  test("3. Access Admin Dashboard as User - GET /api/admin/dashboard", async () => {
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${authToken}`);

    console.log("Admin Dashboard Response:", res.body);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not authorized/);
  });

  test("4. Access Admin Dashboard as Admin - GET /api/admin/dashboard", async () => {
    // Register admin user
    const adminRes = await request(app).post("/api/auth/register").send({
      name: "Admin User",
      email: "admin@example.com",
      password: "Admin123!",
      role: "admin",
    });

    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${adminRes.body.token}`);

    console.log("Admin Dashboard Response (as admin):", res.body);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Welcome to admin dashboard");
  });
});
