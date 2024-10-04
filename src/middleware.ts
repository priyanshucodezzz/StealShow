import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { JWT_PASSWORD } from "./config";

export function authMiddleware(req:Request, res:Response, next:NextFunction) {
  const token:string = req.headers.authorization?.split(" ")[1] as unknown as string;
  if(!token){
    return res.status(401).json({ message: 'Unauthorized'});
  }
  try {
    const payload = jwt.verify(token, JWT_PASSWORD as string);
    if (payload) {
      //@ts-ignore
      req.id = payload.id;
      next();
    }
  } catch (error) {
    return res.status(401).json({message: "Invalid token"});
  }
};
