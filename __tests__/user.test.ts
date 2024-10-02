import supertest from "supertest";
import createServer from "../src/app";
import redisClient from "../src/redis/redisClient";
import { prismaClient } from "../src/db";

const app = createServer();


afterAll(async () => {
  await redisClient.quit();
});

describe("POST signup", () => {
  beforeAll(() => {
    prismaClient.user.deleteMany()
  });

  describe("signup route", () => {
    describe("given a email, name and password",() => {
      it("should respond with a 200 status code", async () => {
        const response = await supertest(app).post("/api/v1/user/signup").send({
          email: "johndoe@outlook.com",
          name: "John Doe",
          password: "zxcvzxcv",
        });
        expect(response.statusCode).toBe(200);
      });
    });

    describe("given a email is already exists",() => {
      it("should respond with a 403 status code", async () => {
        const response = await supertest(app).post("/api/v1/user/signup").send({
          email: "johndoe@outlook.com",
          name: "test account",
          password: "qwert1231",
        });
        expect(response.statusCode).toBe(403);
      });
    });

    describe("given a password is less than 8 character",() => {
      it("should respond with a 411 status code", async () => {
        const response = await supertest(app).post("/api/v1/user/signup").send({
          email: "johndoe@outlook.com",
          name: "John Doe",
          password: "zxcvzx",
        });
        expect(response.statusCode).toBe(411);
      });
    });
  });
});

describe("POST signin" , () => {
  describe("given a email and password",() => {
    it("should respond with a 200 status code", async () => {
      const response = await supertest(app).post("/api/v1/user/signin").send({
        email: "johndoe@outlook.com",
        password: "zxcvzxcv",
      });
      expect(response.statusCode).toBe(200);
    });
  });

  describe("given a email user does not exists" , () => {
    it("should response with a 404 status code" , async () => {
      const response = await supertest(app).post("/api/v1/user/signin").send({
        email: "john@gmail.com",
        password: "qwerqwt",
      });
      expect(response.statusCode).toBe(403);
    })
  })

  describe("given a password is incorrect",() => {
    it("should respond with a 401 status code", async () => {
      const response = await supertest(app).post("/api/v1/user/signin").send({
        email: "johndoe@outlook.com",
        password: "zxcvvcxz",
      });
      expect(response.statusCode).toBe(403);
    });
  });
})

  describe("GET get-current-user" , () => {
    describe("given a user is authenticated and respond with user" , () => {
      it("should respond with a 200 status code" , async () => {
        const response = await supertest(app).get("/api/v1/user").set("Authorization" , "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlkYmRhYjVkLTkyYzMtNDk4Yi05YTEyLTAwNGEwODcxMGRiYSIsImlhdCI6MTcyNzg1ODY0Mn0.-vSwW4FWD_u45HfQ3EaaVUr95gI9eNYm2xbBck-oTO4");
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("user");
      })
    })
  })