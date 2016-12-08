import express from "express";
import cheerio from "cheerio";
import request from "request";
import async from "async";
import moment from "moment";

import { validResult, success, fail } from "./food";

moment.locale("sv");

const app = express();

const CACHE_LIFE = 1 * 60 * 60 * 1000;

const restaurants = [
  {
    name: "Kårresturangen",
    url: "http://intern.chalmerskonferens.se/view/restaurant/karrestaurangen/Veckomeny.rss",
    format: "text/xml",
    parse: ($) => {
      const items = [];

      $("item").each((itemIndex, item) => items.push($("tr", item).map((trIndex, tr) => {
        const name = $(tr)
          .find("b")
          .text();

        const food = $(tr)
          .find("td")
          .eq(1)
          .text();

        // console.log("name", name, "food", food);

        return `${name} – ${food}`;
      }).get()));

      return items;
    },
  },
  {
    name: "Einstein",
    url: "http://www.butlercatering.se/print/6",
    format: "text/html",
    parse: ($) => {
      const items = [];

      $(".node-lunchmeny .content .field-day").map((i, el) =>
        items.push(
          $(el)
          .find("p")
          .map((j, el2) => $(el2).text())
          .get()
          .map(f => f.trim())
          .filter(f => f !== ""
            && f !== "\u200B"))); // \u200B is a Unicode zero-width space, stupid restaurant

      return items;
    },
  },
  {
    name: "Linsen",
    url: "http://intern.chalmerskonferens.se/view/restaurant/linsen/RSS%20Feed.rss",
    format: "text/xml",
    parse: ($) => {
      const items = [];

      $("item").each((itemIndex, item) => items.push($("tr", item).map((trIndex, tr) => {
        const name = $(tr)
          .find("b")
          .text();

        const food = $(tr)
          .find("td")
          .eq(1)
          .text();

        // console.log("name", name, "food", food);

        return `${name} – ${food}`;
      }).get()));

      return items;
    },
  },
  {
    name: "Express",
    url: "http://intern.chalmerskonferens.se/view/restaurant/express/Veckomeny.rss",
    format: "text/xml",
    parse: ($) => {
      const items = [];

      $("item").each((itemIndex, item) => items.push($("tr", item).map((trIndex, tr) => {
        const name = $(tr)
          .find("b")
          .text();

        const food = $(tr)
          .find("td")
          .eq(1)
          .text();

        // console.log("name", name, "food", food);

        return `${name} – ${food}`;
      }).get()));

      return items;
    },
  },
];

app.set("views", `${__dirname}/views`);
app.set("view engine", "pug");
app.use("/static", express.static(`${__dirname}/public`));

let clients = [];
let isFetching = false;

const cache = {
  date: 0,
  data: restaurants.map(restaurant =>
    fail(restaurant, "Not loaded")),
};

const getData = () => new Promise((resolve, reject) => {
  if (Date.now() < cache.date + CACHE_LIFE) {
    return resolve(cache.data);
  }

  clients.push(resolve);
  if (isFetching) return;

  console.log("Cache invalid or no cache found, fetching...");

  isFetching = true;

  async.map(restaurants, (r, cb) => {
    request(r.url, (err, resp, body) => {
      if (!err && resp.statusCode === 200) {
        try {
          const items = r.parse(cheerio.load(body, {
            xmlMode: r.format === "text/xml",
          }));

          return process.nextTick(cb, null, success(r, items));
        } catch (e) {
          return cb(null, fail(r, "Could not parse"));
        }
      }

      return cb(null, fail(r, "Could not fetch"));
    });
  }, (err, results) => {
    console.log("Setting new cache!");

    cache.date = Date.now();
    cache.data = results.map((result, i) =>
      validResult(cache.data[i], result));

    isFetching = false;

    console.log("Resolving new data to", clients.length, "clients");
    clients.map(resolveFunc => resolveFunc(cache.data));

    clients = [];
  });
});

const filterDay = (data, dayIndex) => data.map(r => {
  const items = r.items[dayIndex] || [];

  return Object.assign({}, r, { items });
});

const formatDate = (restaurant) =>
  Object.assign(restaurant, { date: moment(restaurant.date).fromNow() });

app.get("/", (req, res) => {
  const day = new Date();
  const today = Math.min(Math.max(0, day.getDay() - 1), 4);
  const selectedDay = req.query.day || today;

  getData().then(data => res.render("index", {
    data: filterDay(data, selectedDay).map(formatDate),
    selectedDay,
  }));
});

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Chalmersfood listening on http://localhost:${port}/`));
