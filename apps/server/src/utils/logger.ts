import { LogLevel } from '@resourvereign/common/models/log.js';

import LogModel from '../models/log.js';

const log = (user: string, level: LogLevel, message: string) => {
  LogModel.create({
    user,
    level,
    message,
  });
};

export type Logger = ReturnType<typeof loggerForUser>;

export const loggerForUser = (user: string, prefix: string) => {
  return {
    debug: (message: string) => log(user, LogLevel.DEBUG, `[${prefix}]:: ${message}`),
    info: (message: string) => log(user, LogLevel.INFO, `[${prefix}]:: ${message}`),
    warn: (message: string) => log(user, LogLevel.WARN, `[${prefix}]:: ${message}`),
    error: (message: string) => log(user, LogLevel.ERROR, `[${prefix}]:: ${message}`),
  };
};
