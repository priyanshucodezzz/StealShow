import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prismaClient } from "../db";
import redisClient from "../redis/redisClient";

import { JWT_PASSWORD } from "../config";
import { ChangePasswordSchema, SignInSchema, SignUpSchema } from "../types/index";
import { authMiddleware } from "../middleware";
import { asyncHandler } from "../errorHandling/asyncHandler";
import { sendPasswordResetEmail, sendVerificationOtpToEmail } from "../helper/sendOtp";
import { authenticator } from "otplib";

const router = Router();

router.post("/signup", asyncHandler(async (req, res) => {
  const body = req.body;
  const parsedData = SignUpSchema.safeParse(body);

  if (!parsedData.success) {
    return res.status(411).json({ message: "Invalid Input" , errors: parsedData.error.errors});
  }

  const isUserExist = await prismaClient.user.findFirst({
    where: {
      email: parsedData.data.email,
    },
  });

  if (isUserExist) {
    return res
      .status(403)
      .json({ message: "User with this email already signed up!" });
  }

  const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);

  await prismaClient.user.create({
    data: {
      name: parsedData.data.name,
      email: parsedData.data.email,
      password: hashedPassword,
    },
  });

  return res.json({
    message: "User signed up successfully!",
  });
}));

router.post("/signin", asyncHandler(async (req, res) => {
  const body = req.body;
  const parsedData = SignInSchema.safeParse(body);

  if (!parsedData.success) {
    return res.status(411).json({ message: "Invalid Credentials!" });
  }

  const user = await prismaClient.user.findFirst({
    where: {
      email: parsedData.data.email,
    },
  });

  if (!user) {
    return res
      .status(403)
      .json({ message: "User with this email does not exist!" });
  }

  const isPasswordValid = await bcrypt.compare(
    parsedData.data.password,
    user.password
  );

  if (!isPasswordValid) {
    return res.status(403).json({ message: "Invalid Credentials!" });
  }
  
  // @ts-ignore 
  const token = jwt.sign({ id: user.id }, JWT_PASSWORD);

  const options = {
    httpOnly: true,
    secure: true,
    maxAge: 1000 * 60 * 60 * 24,
  };
  return res
    .status(200)
    .cookie("Token", token, options)
    .json({ message: "User logged in successfully", token });
}));

router.get("/", authMiddleware, asyncHandler(async (req, res) => {
  // @ts-ignore
  const id = req?.id;
  const cacheData = await redisClient.get(`user:${id}`);
  if(cacheData){
    const user = JSON.parse(cacheData);
    return res.json({
      user,
    });
  }
  const user = await prismaClient.user.findFirst({
    where: {
      id,
    },
    select: {
      name: true,
      email: true,
    },
  });

  redisClient.set(`user:${id}`, JSON.stringify(user));
  return res.json({user});
}));

//Check is email Unique
router.get("/check/email-unique", asyncHandler(async (req, res) => {
  const email = req.query.email as string;

  const user = await prismaClient.user.findFirst({
    where: {
      email,
    },
  });

  if (user) {
    return res.status(200).json({status: true , isUnique: 'Email is unique'});
  }else{
    return res.status(200).json({status: false , isUnique: 'Email already exists', });
  }
}));


//Send verification Email
router.post('/send-otp-verification-email', asyncHandler(async(req,res) => {
  const email = req.body.email;
  if(!email){
    return res.status(411).json({message: "Invalid Input"});
  }

  try {
    const response = await sendVerificationOtpToEmail(email);;
    return res.status(200).json({ message: response.message });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Something went wrong. Unable to send email." });
  }
}))


//Verify User Signup OTP 
router.get("/verify-signup-otp",asyncHandler(async (req, res) => {
    const email = req.body.email;
    const otp = req.body.otp;
    if (!email || !otp) {
      return res.status(411).json({ message: "Invalid Input" });
    }

    const secret = await redisClient.get(`otpSecret:${email}`);
    if (!secret) {
      return res
        .status(411)
        .json({ message: "OTP has expired or is invalid. Send again!" });
    }

    // Validate the OTP
    const isValid = authenticator.check(otp, secret);
    if (!isValid) {
      return res.status(411).json({ message: "Invalid OTP" });
    }
    await redisClient.del(`otpSecret:${email}`);

    return res.status(200).json({ message: "OTP Verified" });
  })
);


//Forget password
router.post('/forget-password' , asyncHandler(async(req, res) => {
  const email = req.body.email;
  if(!email){
    return res.status(411).json({message: "Invalid Input"});
  }

  const user = await prismaClient.user.findFirst({
    where: {
      email,
    },
  })

  if(!user){
    return res.status(404).json({message: "User does not exists with this email"});
  }

  try {
    const response = await sendPasswordResetEmail(email);
    return res.status(200).json({ message: response.message });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Something went wrong. Unable to send email." });
  }
}));


//Reset forget password
router.patch('/reset-forget-password', asyncHandler(async(req, res) => {
  const token = req.query.token;
  const body = req.body;

  if(!body || !token){
    return res.status(411).json({message: "Invalid Input"});
  }

  if(body.password !== body.confirmPassword){
    return res.status(400).json({message: "Password does not match"});
  }

  //@ts-ignore
  const decoded = jwt.verify(token, JWT_PASSWORD);

  const user = await prismaClient.user.findFirst({
    where: { 
      email: decoded.email 
    }
  });

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);

  await prismaClient.user.update({
    where: {
      email: decoded.email,
    },
    data: {
      password: hashedPassword,
    },
  });

  return res.status(200).json({message: "Password reset successfully!"});
}));

//Change Password
router.patch('/change-password', authMiddleware , asyncHandler(async (req, res) => {
  const body = req.body;
  const parsedData = ChangePasswordSchema.safeParse(body);

  if (!parsedData.success) {
    return res.status(411).json({ message: "Invalid Input" , errors: parsedData.error.errors});
  }

  if(parsedData.data?.newPassword !== parsedData.data?.confirmNewPassword){
    return res.status(400).json({message: "Password does not match"});
  }
  
  const user = await prismaClient.user.findFirst({
    where: {
      // @ts-ignore 
      id: req?.id,
    },
    select: {
      password: true,
    },
  });

  if(!user){
    return res.status(404).json({message: "User not found"});
  }

  const isPasswordValid = await bcrypt.compare(parsedData.data?.oldPassword , user?.password);

  if(!isPasswordValid){
    return res.status(400).json({message: "Invalid old password"});
  }

  const hashedNewPassword = await bcrypt.hash(parsedData.data?.newPassword, 10);

  await prismaClient.user.update({
    where: {
      // @ts-ignore
      id: req?.id,
    },
    data: {
      password: hashedNewPassword,
    },
  });

  return res.status(200).json({message: "Password changed successfully"});
}));

export const userRouter = router;