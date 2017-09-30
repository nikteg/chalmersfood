import { flatMap } from "./util";

export interface BaseRestaurant {
  name: string;
  url: string;
  date?: Date;
}

export type JSONFormat = "application/json";
export type HTMLFormat = "text/html";
export type XMLFormat = "text/xml";
export type PlainFormat = "text/plain";

export type Format = JSONFormat | HTMLFormat | XMLFormat | PlainFormat;

export interface JSONRestaurant extends BaseRestaurant {
  format: JSONFormat;
  map: (json: { [key: string]: any }) => string[][];
}

export interface HTMLRestaurant extends BaseRestaurant {
  format: HTMLFormat;
  map: ($: CheerioStatic) => string[][];
}

export interface XMLRestaurant extends BaseRestaurant {
  format: XMLFormat;
  map: ($: CheerioStatic) => string[][];
}

export interface PlainRestaurant extends BaseRestaurant {
  format: PlainFormat;
  map: (text: string) => string[][];
}

export type Restaurant = JSONRestaurant | HTMLRestaurant | XMLRestaurant | PlainRestaurant;

export const restaurants = [
  <JSONRestaurant>{
    name: "Kårresturangen",
    url: "http://carboncloudrestaurantapi.azurewebsites.net/api/menuscreen/getdataweek?restaurantid=5",
    format: "application/json",
    map: (json) => json.menus.map((menu: any) => flatMap((category: any) => category.recipes.map((recipe: any) =>
            `${category.name} – ${recipe.displayNames[0].displayName}`), menu.recipeCategories)),
  },
  <JSONRestaurant>{
    name: "Linsen",
    url: "http://carboncloudrestaurantapi.azurewebsites.net/api/menuscreen/getdataweek?restaurantid=33",
    format: "application/json",
    map: (json) => json.menus.map((menu: any) => flatMap((category: any) => category.recipes.map((recipe: any) =>
            `${category.name} – ${recipe.displayNames[0].displayName}`), menu.recipeCategories)),
  },
  <JSONRestaurant>{
    name: "Express",
    url: "http://carboncloudrestaurantapi.azurewebsites.net/api/menuscreen/getdataweek?restaurantid=7",
    format: "application/json",
    map: (json) => json.menus.map((menu: any) => flatMap((category: any) => category.recipes.map((recipe: any) =>
            `${category.name} – ${recipe.displayNames[0].displayName}`), menu.recipeCategories)),
  },
  <JSONRestaurant>{
    name: "S.M.A.K.",
    url: "http://carboncloudrestaurantapi.azurewebsites.net/api/menuscreen/getdataweek?restaurantid=42",
    format: "application/json",
    map: (json) => json.menus.map((menu: any) => flatMap((category: any) => category.recipes.map((recipe: any) =>
            `${category.name} – ${recipe.displayNames[0].displayName}`), menu.recipeCategories)),
  },
  // <HTMLRestaurant>{
  //   name: "Einstein",
  //   url: "http://www.butlercatering.se/print/6",
  //   format: "text/html",
  //   map: ($) => $(".node-lunchmeny .content .field-day").map((i, day) =>
  //     $(day).find("p")
  //       .map((j, d) => d.children[0])
  //       .filter((j, d) => {
  //         const t = d.data.trim();

  //           // \u200B is a Unicode zero-width space
  //         return t !== "" && t !== "\u200B";
  //       })
  //       .map((j, d) => d.data.trim())).toArray(),
  // },
];