import cluster from "node:cluster";
import os from "os";
import createServer from "./app";

const app = createServer();

if (cluster.isPrimary && process.env.NODE_ENV !== "test") {
  const totalCPUs = os.cpus().length;

  for (let i = 0; i < totalCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  const PORT = process.env.PORT || 8000;

  const server = app.listen(PORT, () => {
    console.log(`Worker ${process.pid} started on PORT: ${PORT}`);
  });

  process.on("SIGTERM", () => {
    console.log(`Worker ${process.pid} is shutting down...`);
    server.close(() => {
      console.log(`Worker ${process.pid} has shut down gracefully.`);
      process.exit(0);
    });
  });
}
