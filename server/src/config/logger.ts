import pino from "pino";
import env from "./env.js";

const logger =
  env.NODE_ENV === "production"
    ? pino({ level: "info" })
    : pino({
        level: "debug",
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard"
          }
        }
      });

export default logger;
