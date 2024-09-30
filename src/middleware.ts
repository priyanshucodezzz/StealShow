import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { JWT_PASSWORD } from "./config";

export function authMiddleware(req: Request,res: Response,next: NextFunction) {
  const token:string = req.headers.authorization?.split(" ")[1] as unknown as string;
  try {
    //@ts-ignore
    const payload = jwt.verify(token, JWT_PASSWORD);
    if (payload) {
      //@ts-ignore
      req.id = payload.id;
      next();
    }
  } catch (error) {
    return res.json({message: "You are not logged in.."});
  }
};
