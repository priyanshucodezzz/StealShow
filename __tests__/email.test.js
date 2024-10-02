"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sendOtp_1 = require("../src/helper/sendOtp");
const redisClient_1 = __importDefault(require("../src/redis/redisClient"));
const mailTransporter_1 = __importDefault(require("../src/helper/mailTransporter"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Mock redis client and transporter
jest.mock("../src/redis/redisClient");
jest.mock("../src/helper/mailTransporter");
describe("sendPasswordResetEmail", () => {
    it("should send a password reset email successfully", () => __awaiter(void 0, void 0, void 0, function* () {
        // Mock the redisClient setex method
        redisClient_1.default.setex.mockResolvedValue(true);
        // Mock the transporter sendMail method
        mailTransporter_1.default.sendMail.mockResolvedValue({ messageId: "123" });
        const result = yield (0, sendOtp_1.sendPasswordResetEmail)("test@example.com");
        expect(redisClient_1.default.setex).toHaveBeenCalledWith("passwordResetToken:test@example.com", 600, expect.any(String));
        expect(mailTransporter_1.default.sendMail).toHaveBeenCalledWith({
            from: process.env.EMAIL,
            to: "test@example.com",
            subject: "Reset your password for StealShow",
            html: expect.any(String),
        });
        expect(result).toEqual({ message: "Password reset email sent successfully." });
    }));
});
describe("sendVerificationOtpToEmail", () => {
    it("should send a verification OTP email successfully", () => __awaiter(void 0, void 0, void 0, function* () {
        // Mock the redisClient setex method
        redisClient_1.default.setex.mockResolvedValue(true);
        // Mock the transporter sendMail method
        mailTransporter_1.default.sendMail.mockResolvedValue({ messageId: "123" });
        const result = yield (0, sendOtp_1.sendVerificationOtpToEmail)("test@example.com");
        expect(redisClient_1.default.setex).toHaveBeenCalledWith("otpSecret:test@example.com", 600, expect.any(String));
        expect(mailTransporter_1.default.sendMail).toHaveBeenCalledWith({
            from: process.env.EMAIL,
            to: "test@example.com",
            subject: "Verify your email for StealShow",
            text: expect.any(String),
            html: expect.any(String),
        });
        expect(result).toEqual({ message: "OTP sent successfully." });
    }));
});
