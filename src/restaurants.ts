import { flatMap } from "./utils";
import { JSDOM } from "jsdom";

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

export namespace CarbonCloud {
  export interface DisplayName {
    typeID: number;
    displayName: string;
  }

  export interface Allergen {
    id: number;
    imageURLBright: string;
    imageURLDark: string;
  }

  export interface Recipe {
    displayNames: DisplayName[];
    cO2e: string;
    cO2eURL: string;
    allergens: Allergen[];
    price: number;
  }

  export interface RecipeCategory {
    name: string;
    nameEnglish: string;
    id: number;
    recipes: Recipe[];
  }

  export interface Menu {
    menuDate: Date;
    recipeCategories: RecipeCategory[];
  }

  export interface RestaurantInput {
    menus: Menu[];
  }
}

export interface JSONRestaurant<T> extends BaseRestaurant {
  format: JSONFormat;
  map: (input: T) => string[][];
}

export interface HTMLRestaurant extends BaseRestaurant {
  format: HTMLFormat;
  map: (jsdom: JSDOM) => string[][];
}

// export interface XMLRestaurant extends BaseRestaurant {
//   format: XMLFormat;
//   map: ($: CheerioStatic) => string[][];
// }

export interface PlainRestaurant extends BaseRestaurant {
  format: PlainFormat;
  map: (text: string) => string[][];
}

export type Restaurant =
  | JSONRestaurant<any>
  | HTMLRestaurant
  // | XMLRestaurant
  | PlainRestaurant;

export function jsonRestaurant<T>(
  name: string,
  url: string,
  map: (input: T) => string[][]
): JSONRestaurant<T> {
  return {
    name,
    url,
    format: "application/json",
    map
  };
}

function displayRecipeCategory(category: CarbonCloud.RecipeCategory) {
  return category.recipes.map(
    recipe => `${category.name} – ${recipe.displayNames[0].displayName}`
  );
}

export const restaurants = [
  jsonRestaurant<CarbonCloud.RestaurantInput>(
    "Kårresturangen",
    "http://carboncloudrestaurantapi.azurewebsites.net/api/menuscreen/getdataweek?restaurantid=5",
    json =>
      json.menus.map(menu =>
        flatMap(displayRecipeCategory, menu.recipeCategories)
      )
  ),
  // jsonRestaurant<CarbonCloud.RestaurantInput>(
  //   "Linsen",
  //   "http://carboncloudrestaurantapi.azurewebsites.net/api/menuscreen/getdataweek?restaurantid=33",
  //   (json) => json.menus.map((menu) => flatMap(displayRecipeCategory, menu.recipeCategories))),
  jsonRestaurant<CarbonCloud.RestaurantInput>(
    "Express",
    "http://carboncloudrestaurantapi.azurewebsites.net/api/menuscreen/getdataweek?restaurantid=7",
    json =>
      json.menus.map(menu =>
        flatMap(displayRecipeCategory, menu.recipeCategories)
      )
  ),
  jsonRestaurant<CarbonCloud.RestaurantInput>(
    "S.M.A.K.",
    "http://carboncloudrestaurantapi.azurewebsites.net/api/menuscreen/getdataweek?restaurantid=42",
    json =>
      json.menus.map(menu =>
        flatMap(displayRecipeCategory, menu.recipeCategories)
      )
  ),
  <HTMLRestaurant>{
    name: "Einstein",
    url: "http://restaurang-einstein.se/",
    format: "text/html",
    map: jsdom => {
      return [
        ...jsdom.window.document.querySelectorAll(
          "#column_gnxhsuatx .content-wrapper .column-content"
        )
      ]
        .filter((_, i) => i % 2 == 1)
        .map(elem => {
          const ps = [...elem.querySelectorAll("p")];

          if (ps.length === 0) return [];

          return flatMap(
            v => v,
            flatMap(p => [...p.childNodes], [...ps])
              .filter((node: Node) => node.nodeType === 3)
              .map((node: Node) => node.textContent!.trim())
          ).filter((text: string) => text !== "");
        });
    }
  }
];
