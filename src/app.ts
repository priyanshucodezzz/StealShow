import cookieParser from "cookie-parser";
import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";

import { errorHandler } from "./errorHandling/errorHandler";
import { eventRouter } from "./router/event.router";
import { userRouter } from "./router/user.router";
import { seatRouter } from "./router/seat.router";
import { venueRouter } from "./router/venue.router";
import { ticketRouter } from "./router/ticket.router";
import { paymentRouter } from "./router/payment";

function createServer () {
  const app = express();
  app.use(express.json());

  const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again after 5 minutes",
  });

  app.use(limiter);

  app.use(
    cors({
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PATCH"],
    })
  );

  app.use(express.json());
  app.use(cookieParser());
  app.use(errorHandler);

  app.use("/api/v1/user", userRouter);
  app.use("/api/v1/event", eventRouter);
  app.use("/api/v1/venue", venueRouter);
  app.use("/api/v1/seat", seatRouter);
  app.use("/api/v1/ticket", ticketRouter);
  app.use("/api/v1/payment", paymentRouter);

  return app;
}

export default createServer;