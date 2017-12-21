import * as express from "express";
import * as request from "request";
import * as moment from "moment";

import * as Rx from "@reactivex/rxjs";
import { RxHR } from "@akanass/rx-http-request";

import { validResult, success, fail, RestaurantResult } from "food";
import { restaurants, Restaurant, JSONRestaurant } from "restaurants";
import { weekOfYear, safeParseRestaurantBody } from "utils";
import { CACHE_LIFE } from "config";

moment.locale("sv");

const app = express();

app.set("views", `${__dirname}/../views`);
app.set("view engine", "pug");
app.use("/static", express.static(`${__dirname}/../public`));

let clients: ((data: RestaurantResult[]) => void)[] = [];
let isFetching = false;

const cache: {
  date: number;
  data: RestaurantResult[];
} = {
  date: 0,
  data: restaurants.map(restaurant =>
    fail(restaurant, "Not loaded")),
}

const data$ = Rx.Observable.from(restaurants)
  .concatMap((restaurant) => RxHR.get(restaurant.url), (restaurant, data) => ({ restaurant, data }))
  .map(({ restaurant, data }): RestaurantResult => {
    if (data.response.statusCode === 200) {
      try {
        const items = safeParseRestaurantBody(restaurant, data.body);

        return success(restaurant, items);
      } catch (error) {
        console.error(error);

        return fail(restaurant, "Could not parse");
      }
    }

    return fail(restaurant, "Could not fetch");
  }).toArray();

const getData = () => new Promise<RestaurantResult[]>((resolve, reject) => {
  if (Date.now() < cache.date + CACHE_LIFE) {
    return resolve(cache.data);
  }

  clients.push(resolve);
  if (isFetching) return;

  console.log("Cache invalid or no cache found, fetching...");

  isFetching = true;

  data$.first().subscribe((results) => {
    cache.date = Date.now();
    cache.data = results.map((result, i) => validResult(cache.data[i], result));

    isFetching = false;

    console.log("Resolving new data to", clients.length, "clients");
    clients.map(resolveFunc => resolveFunc(cache.data));
    clients = [];
  });
});

const filterDay = (data: RestaurantResult[], dayIndex: number) => data.map(r => {
  const items = r.items[dayIndex] || [];

  return Object.assign({}, r, { items });
});

const formatDate = (restaurant: RestaurantResult) =>
  Object.assign(restaurant, { date: moment(restaurant.date).fromNow() });

app.get("/", (req, res) => {
  const day = new Date();
  const today = Math.min(Math.max(0, day.getDay() - 1), 4);
  const selectedDay = req.query.day || today;
  const currentWeek = weekOfYear(day);

  getData().then(data => res.render("index", {
    data: filterDay(data, selectedDay).map(formatDate),
    selectedDay,
    currentWeek,
  }));
});

getData();

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Chalmersfood listening on http://localhost:${port}/`));
