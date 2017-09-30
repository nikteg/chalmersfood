import * as cheerio from "cheerio";
import { Format } from "./restaurants";

export function flatMap(f: (...args: any[]) => any, xs: any[]) {
  return xs.reduce((acc, x) => acc.concat(f(x)), []);
}

export function weekOfYear(date: Date) {
  const d = new Date(+date);

  d.setHours(0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));

  return Math.ceil((((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 8.64e7) + 1) / 7);
}

export function runParser(format: Format, body: string): object | CheerioStatic | string {
  switch (format) {
    case "application/json":
      try {
        return JSON.parse(body);
      } catch (e) {
        return {};
      }
    case "text/html":
    case "text/xml":
      return cheerio.load(body, { xmlMode: format === "text/html" });
    default:
      return body;
  }
};