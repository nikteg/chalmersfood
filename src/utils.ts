import * as cheerio from "cheerio";
import { Restaurant } from "restaurants";

export function flatMap(f: (...args: any[]) => any, xs: any[]) {
  return xs.reduce((acc, x) => acc.concat(f(x)), []);
}

export function weekOfYear(date: Date) {
  const d = new Date(+date);

  d.setHours(0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));

  return Math.ceil((((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 8.64e7) + 1) / 7);
}

export function safeParseRestaurantBody(restaurant: Restaurant, body: string): string[][] {
  const result = parseRestaurantBody(restaurant, body);

  if (Array.isArray(result)) {
    return result;
  }

  return [];
}

function parseRestaurantBody(restaurant: Restaurant, body: string) {
  switch (restaurant.format) {
    case "application/json":
      return restaurant.map(JSON.parse(body))
    case "text/html":
    case "text/xml":
      return restaurant.map(cheerio.load(body, { xmlMode: restaurant.format === "text/html" }));
    default:
      return restaurant.map(body);
  }
};
