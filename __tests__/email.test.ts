jest.mock("../src/redis/redisClient", () => ({
    setex: jest.fn(),
}));

jest.mock("../src/helper/mailTransporter", () => ({
  __esModule: true, 
  default: {
    sendMail: jest.fn(),
  },
}));

jest.mock("../src/helper/sendOtp", () => ({
  generateAndStoreOTPSecret: jest.fn(),
}));

import {
  sendPasswordResetEmail,
  sendVerificationOtpToEmail,
  generateAndStoreOTPSecret,
} from "../src/helper/sendOtp";
import redisClient from "../src/redis/redisClient";
import transporter from "../src/helper/mailTransporter";
import dotenv from "dotenv";

dotenv.config();

describe("sendVerificationOtpToEmail", () => {
  const mockEmail = "theboyykanpur@gmail.com";
  const mockOtp = "123456";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should generate an OTP, store it in Redis, and send an email successfully", async () => {
    (generateAndStoreOTPSecret as jest.Mock).mockResolvedValue(mockOtp);
    (transporter.sendMail as jest.Mock).mockResolvedValue({
      messageId: "123",
    });

    await sendVerificationOtpToEmail(mockEmail);
    expect(generateAndStoreOTPSecret).toHaveBeenCalledWith(mockEmail);

    expect(transporter.sendMail).toHaveBeenCalledWith({
      from: process.env.EMAIL,
      to: mockEmail,
      subject: "Verify your email for StealShow",
      text: `Your OTP for verification is: ${mockOtp}`,
      html: `<p>Your OTP for verification is: <b>${mockOtp}</b></p>`,
    });
  });

  it("should throw an error if email sending fails", async () => {
    (generateAndStoreOTPSecret as jest.Mock).mockResolvedValue(mockOtp);
    (transporter.sendMail as jest.Mock).mockRejectedValue(
      new Error("Failed to send email")
    );

    await expect(sendVerificationOtpToEmail(mockEmail)).rejects.toThrow(
      "Failed to send OTP email."
    );

    expect(generateAndStoreOTPSecret).toHaveBeenCalledWith(mockEmail);
    expect(transporter.sendMail).toHaveBeenCalled();
  });

  it("should throw an error if Redis storage fails", async () => {
    (generateAndStoreOTPSecret as jest.Mock).mockRejectedValue(
      new Error("Failed to store OTP in Redis")
    );

    await expect(sendVerificationOtpToEmail(mockEmail)).rejects.toThrow(
      "Failed to send OTP email."
    );

    expect(generateAndStoreOTPSecret).toHaveBeenCalledWith(mockEmail);
    expect(transporter.sendMail).not.toHaveBeenCalled();
  });
});

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
    expect(result).toEqual({
      message: "Password reset email sent successfully.",
    });
  });
});
