import {sendPasswordResetEmail , sendVerificationOtpToEmail} from "../src/helper/sendOtp"
import redisClient from "../src/redis/redisClient";
import transporter from "../src/helper/mailTransporter";
import dotenv from 'dotenv';

dotenv.config();  

jest.mock("../src/redis/redisClient");
jest.mock("../src/helper/mailTransporter");

describe("sendPasswordResetEmail", () => {
  it("should send a password reset email successfully", async () => {
    (redisClient.setex as jest.Mock).mockResolvedValue(true);

    (transporter.sendMail as jest.Mock).mockResolvedValue({ messageId: "123" });

    const result = await sendPasswordResetEmail("test@example.com");

    expect(redisClient.setex).toHaveBeenCalledWith(
      "passwordResetToken:test@example.com",
      600,
      expect.any(String)
    );
    expect(transporter.sendMail).toHaveBeenCalledWith({
      from: process.env.EMAIL,
      to: "test@example.com",
      subject: "Reset your password for StealShow",
      html: expect.any(String),
    });
    expect(result).toEqual({ message: "Password reset email sent successfully." });
  });
});

describe("sendVerificationOtpToEmail", () => {
  it("should send a verification OTP email successfully", async () => {
    (redisClient.setex as jest.Mock).mockResolvedValue(true);

    (transporter.sendMail as jest.Mock).mockResolvedValue({ messageId: "123" });

    const result = await sendVerificationOtpToEmail("test@example.com");

    expect(redisClient.setex).toHaveBeenCalledWith(
      "otpSecret:test@example.com",
      600,
      expect.any(String)
    );
    expect(transporter.sendMail).toHaveBeenCalledWith({
      from: process.env.EMAIL,
      to: "test@example.com",
      subject: "Verify your email for StealShow",
      text: expect.any(String),
      html: expect.any(String),
    });
    expect(result).toEqual({ message: "OTP sent successfully." });
  });
});