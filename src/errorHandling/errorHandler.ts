import { Prisma } from "@prisma/client";
import {Request , Response, NextFunction } from "express";

export const errorHandler = (error:Error, req:Request, res:Response, next:NextFunction) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(500).json({
      message: "Database error occurred",
      error: error.meta ? error.meta.cause : error.message,
    });
  }
  
  return res.status(500).json({
    message: "Internal server error",
    error: error.message || "An unknown error occurred",
  });
};
