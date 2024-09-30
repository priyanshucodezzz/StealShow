import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from 'express-rate-limit'
import redisClient from "./redis/redisClient";

import { userRouter } from "./router/user.router";
import { eventRouter } from "./router/event.router";
import { venueRouter } from "./router/venue.router";
import { ticketRouter } from "./router/ticket.router";
import { seatRouter } from "./router/seat.router";
import { paymentRouter } from "./router/payment";
import { errorHandler } from "./errorHandling/errorHandler";

import cluster from "node:cluster";
import os from "os";

redisClient.on("connect" , () => {
  console.log("Redis connected");
})

const totalCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  for (let i = 0; i < totalCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork();
  })

} else {
  const PORT = 8000;
  const app = express();

  const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 5 minutes',
  });

  app.use(limiter);

  app.use(
    cors({
      origin: "http://localhost:5173",
      methods: ["GET","POST","PATCH"],
    })
  );

  app.use(express.json());
  app.use(cookieParser());
  app.use(errorHandler);

  app.get('/' , (req, res) => {
    return res.json({message: `Hello World from ${process.pid}`})
  })

  app.use("/api/v1/user", userRouter);
  app.use("/api/v1/event", eventRouter);
  app.use("/api/v1/venue", venueRouter);
  app.use("/api/v1/seat", seatRouter);
  app.use("/api/v1/ticket", ticketRouter);
  app.use("/api/v1/payment", paymentRouter);

  const server = app.listen(PORT, () => {
    console.log(`Worker ${process.pid} started on PORT: ${PORT}`);
  });

  process.on('SIGTERM', () => {
    console.log(`Worker ${process.pid} is shutting down...`);
    server.close(() => {
      console.log(`Worker ${process.pid} has shut down gracefully.`);
      process.exit(0);
    });
  });
}
