import debug from "debug";

export const log = debug("chilly:core");

export function info(msg: string, ...args: any[]) {
  log(`INFO: ${msg}`, ...args);
}

export function error(msg: string, ...args: any[]) {
  log(`ERROR: ${msg}`, ...args);
}
