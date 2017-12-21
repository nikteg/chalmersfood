import { Restaurant } from "restaurants";

export interface RestaurantResult {
  items: string[][];
  name: string;
  date: number;
  error?: string;
}

export function isResultWithError(result: RestaurantResult) {
  return result.error != null;
}

export const validResult = (oldResult: RestaurantResult, result: RestaurantResult) => {
  // If the old result contains an error, just use the new one
  if (isResultWithError(oldResult)) {
    return result;
  }

  if (isResultWithError(result)) {
    return oldResult;
  }

  // Shallow compare on the items string arrays
  if (result.items.length !== oldResult.items.length) {
    return result;
  }

  for (let i = 0; i < result.items.length; ++i) {
    if (result.items[i].length !== oldResult.items[i].length) {
      return result;
    }

    for (let j = 0; j < result.items[i].length; ++j) {
      if (result.items[i][j] !== oldResult.items[i][j]) {
        return result;
      }
    }
  }

  return oldResult;
};

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
