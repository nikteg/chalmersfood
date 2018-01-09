import { Restaurant } from "restaurants";

export interface RestaurantResult {
  items: string[][];
  name: string;
  date: number;
  error?: string;
}

export const success = (restaurant: Restaurant, items: string[][]): RestaurantResult => ({
  items,
  name: restaurant.name,
  date: Date.now(),
});

export const fail = (restaurant: Restaurant, error: string): RestaurantResult => ({
  error,
  name: restaurant.name,
  items: [],
  date: Date.now(),
});
