import supertest from "supertest";
import createServer from "../src/app";
import redisClient from "../src/redis/redisClient";
import { prismaClient } from "../src/db";

import * as emailService from "../src/helper/sendOtp";
import { authenticator } from "otplib";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "../src/config";


const app = createServer();

jest.mock("../src/redis/redisClient", () => ({
    get: jest.fn() as jest.Mock,
    set: jest.fn() as jest.Mock,
    del: jest.fn(),
}));

jest.mock("../src/db", () => ({
  prismaClient: {
    user: {
      findFirst: jest.fn(),
    },
  }
}));

jest.mock("../src/helper/sendOtp", () => ({
  sendVerificationOtpToEmail: jest.fn(),
}));

//Signup
describe("POST signup", () => {
  beforeAll(() => {
    prismaClient.user.deleteMany();
  });

  describe("signup route", () => {
    describe("given a email, name and password", () => {
      it("should respond with a 200 status code", async () => {
        const response = await supertest(app).post("/api/v1/user/signup").send({
          email: "johndoe@outlook.com",
          name: "John Doe",
          password: "zxcvzxcv",
        });
        expect(response.statusCode).toBe(200);
      });
    });

    describe("given a email is already exists", () => {
      it("should respond with a 403 status code", async () => {
        const response = await supertest(app).post("/api/v1/user/signup").send({
          email: "johndoe@outlook.com",
          name: "test account",
          password: "qwert1231",
        });
        expect(response.statusCode).toBe(403);
      });
    });

    describe("given a password is less than 8 character", () => {
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

//Signin
describe("POST signin", () => {
  describe("given a email and password", () => {
    it("should respond with a 200 status code", async () => {
      const response = await supertest(app).post("/api/v1/user/signin").send({
        email: "johndoe@outlook.com",
        password: "zxcvzxcv",
      });
      expect(response.statusCode).toBe(200);
    });
  });

  describe("given a email user does not exists", () => {
    it("should response with a 404 status code", async () => {
      const response = await supertest(app).post("/api/v1/user/signin").send({
        email: "john@gmail.com",
        password: "qwerqwt",
      });
      expect(response.statusCode).toBe(403);
    });
  });

  describe("given a password is incorrect", () => {
    it("should respond with a 401 status code", async () => {
      const response = await supertest(app).post("/api/v1/user/signin").send({
        email: "johndoe@outlook.com",
        password: "zxcvvcxz",
      });
      expect(response.statusCode).toBe(403);
    });
  });
});

//Get current user
describe("GET get-current-user", () => {
  const user = {
    id: "b7a7b7a7-b7a7-b7a7-b7a7-b7a7b7a7b7a7",
    email: "johndoe@outlook.com",
    name: "John Doe",
  };

  //@ts-ignore
  const token = jwt.sign({ id: user.id }, JWT_PASSWORD);

  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe("user is not authenticated", () => {
    it("should respond with a 401 status code", async () => {
      const response = await supertest(app).get("/api/v1/user").set("Authorization", `Bearer `)
      expect(response.statusCode).toBe(401);
    });
  });

  describe("given a user is authenticated and user data is in Redis cache", () => {
    it("should respond with a 200 status code and return user data from Redis cache", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(user));

      const response = await supertest(app)
        .get("/api/v1/user")
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toEqual(user);
      expect(redisClient.get).toHaveBeenCalledWith(`user:${user.id}`);
    });
  });

  describe("given a user is authenticated but no user data in Redis (cache miss)", () => {
    it("should respond with a 200 status code and return user data from the database", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (prismaClient.user.findFirst as jest.Mock).mockResolvedValue(user);

      const response = await supertest(app)
        .get("/api/v1/user")
        .set("Authorization", `Bearer ${token}`);
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toEqual({
        id: user.id,  
        name: user.name,
        email: user.email,
      });

      expect(redisClient.set).toHaveBeenCalledWith(
        `user:${user.id}`,
        JSON.stringify(user)
      );

    });
  });

  describe("given a user does not exist in the database", () => {
    it("should respond with a 404 status code", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (prismaClient.user.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await supertest(app)
        .get("/api/v1/user")
        .set("Authorization", `Bearer ${token}`);
      expect(response.statusCode).toBe(404);
    });
  });

  describe("given an invalid token", () => {
    it("should respond with a 401 status code when token is invalid", async () => {
      const response = await supertest(app)
        .get("/api/v1/user")
        .set("Authorization", `Bearer invalid_token`);
      expect(response.statusCode).toBe(401);
    });
  });
});

//Check email unique
describe.only("GET check email unique", () => {
  describe("given a email is unique", () => {
    beforeAll(() => {
      (prismaClient.user.findFirst as jest.Mock).mockResolvedValue(null);
    });

    it("should respond with a 200 status code", async () => {
      const response = await supertest(app).get(
        "/api/v1/user/check-email-unique?email=alex@outlook.com"
      );
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        status: true,
        isUnique: "Email is unique",
      });
    });
  });
  describe("given a email is not unique", () => {
    beforeAll(() => {
      (prismaClient.user.findFirst as jest.Mock).mockResolvedValue({
        email: "johndoe@outlook.com",
      });
    });

    it("should respond with a 403 status code", async () => {
      const response = await supertest(app).get(
        "/api/v1/user/check-email-unique?email=johndoe@outlook.com"
      );
      expect(response.statusCode).toBe(403);
      expect(response.body).toEqual({
        status: false,
        isUnique: "Email already exists",
      });
    });
  });
});

//Send verification Email
describe("POST /send-otp-verification-email", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when the email is provided", () => {
    it("should respond with a 200 status code and a success message", async () => {
      (emailService.sendVerificationOtpToEmail as jest.Mock).mockResolvedValue({
        message: "OTP sent successfully.",
      });
      const response = await supertest(app)
        .post("/api/v1/user/send-otp-verification-email")
        .send({ email: "theboyykanpur@gmail.com" });
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("message", "OTP sent successfully.");
    });
  });
  describe("when email is not provided", () => {
    it("should respond with a 411 status code and an invalid input message", async () => {
      const response = await supertest(app)
        .post("/api/v1/user/send-otp-verification-email")
        .send({ email: "" });
      expect(response.statusCode).toBe(411);
      expect(response.body).toHaveProperty("message", "Invalid Input");
    });
  });

  describe("when the email service fails", () => {
    it("should respond with a 500 status code and a failure message", async () => {
      (emailService.sendVerificationOtpToEmail as jest.Mock).mockRejectedValue(
        new Error("Failed to send OTP email.")
      );

      const response = await supertest(app)
        .post("/api/v1/user/send-otp-verification-email")
        .send({ email: "theboyykanpur@gmail.com" });

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty(
        "message",
        "Something went wrong. Unable to send email."
      );
    });
  });
});

// verifyOtp
describe("POST /verify-otp", () => {
  const mockEmail = "johndoe@gmail.com";
  const mockOtp = "123456";
  const mockSecret = "mockedSecret";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("given a valid email and otp", () => {
    it("should respond with a 200 status code and a success message", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(mockSecret);
      jest.spyOn(authenticator, "check").mockReturnValue(true);

      const response = await supertest(app)
        .post("/api/v1/user/verify-signup-otp")
        .send({ email: mockEmail, otp: mockOtp });
      expect(redisClient.get).toHaveBeenCalledWith(`otpSecret:${mockEmail}`);
      expect(redisClient.del).toHaveBeenCalledWith(`otpSecret:${mockEmail}`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("message", "OTP Verified");
    });
  });

  describe("otp has been expired", () => {
    it("should respond with a 403 status code and a failure message", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      const response = await supertest(app)
        .post("/api/v1/user/verify-signup-otp")
        .send({ email: mockEmail, otp: mockOtp });

      expect(redisClient.get).toHaveBeenCalledWith(`otpSecret:${mockEmail}`);
      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty(
        "message",
        "OTP has expired or is invalid. Send again!"
      );
    });
  });

  describe("given an invalid email", () => {
    it("should respond with a 411 status code and a failure message", async () => {
      const response = await supertest(app)
        .post("/api/v1/user/verify-signup-otp")
        .send({ email: "invalidEmail", otp: mockOtp });

      expect(response.statusCode).toBe(411);
      expect(response.body).toHaveProperty("message", "Invalid Input");
    });
  });

  describe("given an invalid otp", () => {
    it("should respond with a 403 status code and a failure message", async () => {
      (redisClient.get as jest.Mock).mockResolvedValue(mockSecret);

      jest.spyOn(authenticator, "check").mockReturnValue(false);

      const response = await supertest(app)
        .post("/api/v1/user/verify-signup-otp")
        .send({ email: mockEmail, otp: "invalidOtp" });

      expect(response.statusCode).toBe(403);
      expect(response.body).toHaveProperty("message", "Invalid OTP");
      expect(redisClient.get).toHaveBeenCalledWith(`otpSecret:${mockEmail}`);
    });
  });
});