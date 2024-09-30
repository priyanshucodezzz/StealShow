import { JWT_PASSWORD } from "../config";
import redisClient from "../redis/redisClient";
import transporterGmail from "./mailTransporter";
import jwt from "jsonwebtoken";


function generateOTP(){
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendVerificationOtpToEmail(email: string){
    try {
        const otp = generateOTP();
        await redisClient.setex(`emailVerificationOtp:${email}`, 600, otp);
        
        await transporterGmail.sendMail({
            from: process.env.EMAIL,
            to: email, 
            subject: 'Verify your email for StealShow', 
            text: `Your OTP for verification is: ${otp}`,
            html: `<p>Your OTP for verification is: <b>${otp}</b></p>`, 
        });
        
        return { message: 'OTP sent successfully.' }
    } catch (error) {
        throw new Error('Failed to send OTP email.');
    }
};


export async function sendPasswordResetEmail(email: string){
    // @ts-ignore 
    const RESET_TOKEN = jwt.sign({ email }, JWT_PASSWORD);
    const RESET_LINK = `http://localhost:5173/reset-password?token=${RESET_TOKEN}`;

    await redisClient.setex(`passwordResetToken:${email}`, 600, RESET_TOKEN);
    try {
        await transporterGmail.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: 'Reset your password for StealShow',
            html: `<p>Click the link below to reset your password:</p>
                   <p><a href="${RESET_LINK}">Reset Password</a></p>`,
        });
        return {message: 'Password reset email sent successfully.'}
    } catch (error) {
        throw new Error('Failed to send email.');
    }
};