import { flatMap } from "./utils";
import { JSDOM } from "jsdom";
import { format } from "date-fns";
import { groupBy, mapValues, identity, map, sortBy, orderBy, toPairs, head } from "lodash";

export interface BaseRestaurant {
  name: string;
  url: () => string;
  date?: Date;
}

export type JSONFormat = "application/json";
export type HTMLFormat = "text/html";
export type XMLFormat = "text/xml";
export type PlainFormat = "text/plain";

export type Format = JSONFormat | HTMLFormat | XMLFormat | PlainFormat;

export namespace CarbonCloud {
  export interface DisplayName {
    dishDisplayName: string;
    displayNameCategory: { displayNameCategoryName: string; sortOrder: number };
  }

  export interface Type {
    dishTypeName: string;
  }

  export interface Item {
    startDate: string;
    displayNames: DisplayName[];
    dishType?: Type;
  }

  export type RestaurantInput = Item[];
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

export function jsonRestaurant<T>(name: string, url: () => string, map: (input: T) => string[][]): JSONRestaurant<T> {
  return {
    name,
    url,
    format: "application/json",
    map
  };
}

function displayRecipeCategory(item: CarbonCloud.Item) {
  const swedishDisplayName = head(item.displayNames.filter(dn => dn.displayNameCategory.displayNameCategoryName === "Swedish"))!.dishDisplayName;

  if (item.dishType) {
    return `${item.dishType.dishTypeName} – ${swedishDisplayName}`;
  } else {
    return swedishDisplayName;
  }
}

function getCBUrl(id: string) {
  return `https://carbonateapiprod.azurewebsites.net/api/v1/mealprovidingunits/${id}/dishoccurrences`;
}

function appendDatesToCarbonCloudUrl(url: string) {
  const now = new Date();
  const startDayIndex = now.getDate() - now.getDay() + 1;
  const endDayIndex = startDayIndex + 4;

  const startDay = new Date();
  startDay.setDate(startDayIndex);
  const endDay = new Date();
  endDay.setDate(endDayIndex);

  const startDayString = format(startDay, "yyyy-MM-dd");
  const endDayString = format(endDay, "yyyy-MM-dd");

  return `${url}?startDate=${startDayString}&endDate=${endDayString}`;
}

function sortAndMapCarbonCloudResult(items: CarbonCloud.Item[]) {
  return map(sortBy(toPairs(groupBy(items, "startDate")), ([k, _]) => k), ([_, v]) => sortBy(v.map(item => displayRecipeCategory(item))));
}

export const restaurants = [
  jsonRestaurant<CarbonCloud.RestaurantInput>(
    "Kårresturangen",
    () => appendDatesToCarbonCloudUrl(getCBUrl("21f31565-5c2b-4b47-d2a1-08d558129279")),
    sortAndMapCarbonCloudResult
  ),
  jsonRestaurant<CarbonCloud.RestaurantInput>(
    "Linsen",
    () => appendDatesToCarbonCloudUrl(getCBUrl("b672efaf-032a-4bb8-d2a5-08d558129279")),
    sortAndMapCarbonCloudResult
  ),
  jsonRestaurant<CarbonCloud.RestaurantInput>(
    "Express",
    () => appendDatesToCarbonCloudUrl(getCBUrl("3d519481-1667-4cad-d2a3-08d558129279")),
    sortAndMapCarbonCloudResult
  ),
  jsonRestaurant<CarbonCloud.RestaurantInput>(
    "S.M.A.K.",
    () => appendDatesToCarbonCloudUrl(getCBUrl("3ac68e11-bcee-425e-d2a8-08d558129279")),
    sortAndMapCarbonCloudResult
  ),
  <HTMLRestaurant>{
    name: "Einstein",
    url: () => "http://restaurang-einstein.se/",
    format: "text/html",
    map: jsdom => {
      return [...jsdom.window.document.querySelectorAll("#column_gnxhsuatx .content-wrapper .column-content")]
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
