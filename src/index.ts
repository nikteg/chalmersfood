import * as express from "express";

import * as Rx from "@reactivex/rxjs";
import { RxHR } from "@akanass/rx-http-request";

import { success, fail, RestaurantResult } from "food";
import { restaurants } from "restaurants";
import { weekOfYear, safeParseRestaurantBody } from "utils";
import { CACHE_LIFE } from "config";

import { formatDistance } from "date-fns";
import { sv } from "date-fns/locale";

const app = express();

app.set("views", `${__dirname}/../views`);
app.set("view engine", "pug");
app.use("/static", express.static(`${__dirname}/../public`));

let lastFetch = new Date();

const createFoodStream = () =>
  Rx.Observable.from(restaurants)
    .concatMap(
      restaurant => RxHR.get(restaurant.url()),
      (restaurant, data) => ({ restaurant, data })
    )
    .map(({ restaurant, data }) => {
      if (data.response.statusCode === 200) {
        try {
          const items = safeParseRestaurantBody(restaurant, data.body);

          return success(restaurant, items);
        } catch (error) {
          console.error(error);

          return fail(restaurant, "Kunde inte hantera menyn");
        }
      }

      return fail(restaurant, "Kunde inte hämta menyn");
    })
    .scan((acc, item) => [...acc, item], [])
    .last()
    .do(() => (lastFetch = new Date()))
    .publishReplay(1, CACHE_LIFE)
    .refCount();

const filterDay = (data: RestaurantResult[], dayIndex: number) =>
  data.map(r => {
    const items = r.items[dayIndex] || [];

    return Object.assign({}, r, { items });
  });

let foodItems$: Rx.Observable<RestaurantResult[]> | null = createFoodStream();

app.get("/", (req, res) => {
  const day = new Date();
  const today = Math.min(Math.max(0, day.getDay() - 1), 4);
  const selectedDay = req.query.day || today;
  const currentWeek = weekOfYear(day);

  if (!foodItems$) {
    foodItems$ = createFoodStream();
  }

  foodItems$.first().subscribe(results =>
    res.render("index", {
      data: filterDay(results, selectedDay),
      selectedDay,
      currentWeek,
      lastFetch: formatDistance(lastFetch, new Date(), { locale: sv })
    })
  );
});

app.get("/refresh", (_, res) => {
  foodItems$ = null;

  res.redirect("/");
});

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Chalmersfood listening on http://localhost:${port}/`)
);
