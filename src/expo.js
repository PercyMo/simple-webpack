import { message } from "./message.coffee";

export const add = function(a, b) {
  return `${message}: ${a + b}`;
};
