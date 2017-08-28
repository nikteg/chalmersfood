import express from "express";
import cheerio from "cheerio";
import request from "request";
import async from "async";
import moment from "moment";

import { validResult, success, fail } from "./food";

moment.locale("sv");

const app = express();

const CACHE_LIFE = 1 * 60 * 60 * 1000;

const flatMap = (f, xs) => xs.reduce((acc, x) => acc.concat(f(x)), []);

const restaurants = [
  {
    name: "Kårresturangen",
    url: "http://carboncloudrestaurantapi.azurewebsites.net/api/menuscreen/getdataweek?restaurantid=5",
    format: "application/json",
    parse: (json) => json.menus.map((menu) => flatMap((category) => category.recipes.map((recipe) =>
            `${category.name} – ${recipe.displayNames[0].displayName}`), menu.recipeCategories)),
  },
  {
    name: "Linsen",
    url: "http://carboncloudrestaurantapi.azurewebsites.net/api/menuscreen/getdataweek?restaurantid=33",
    format: "application/json",
    parse: (json) => json.menus.map((menu) => flatMap((category) => category.recipes.map((recipe) =>
            `${category.name} – ${recipe.displayNames[0].displayName}`), menu.recipeCategories)),
  },
  {
    name: "Express",
    url: "http://carboncloudrestaurantapi.azurewebsites.net/api/menuscreen/getdataweek?restaurantid=7",
    format: "application/json",
    parse: (json) => json.menus.map((menu) => flatMap((category) => category.recipes.map((recipe) =>
            `${category.name} – ${recipe.displayNames[0].displayName}`), menu.recipeCategories)),
  },
  {
    name: "Einstein",
    url: "http://www.butlercatering.se/print/6",
    format: "text/html",
    parse: ($) => $(".node-lunchmeny .content .field-day").map((i, day) =>
      $(day).find("p")
        .map((j, d) => d.children[0])
        .filter((j, d) => {
          const t = d.data.trim();

            // \u200B is a Unicode zero-width space
          return t !== "" && t !== "\u200B";
        })
        .map((j, d) => d.data.trim())),
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

const runParser = (format, body) => {
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
          const items = r.parse(runParser(r.format, body));

          return process.nextTick(cb, null, success(r, items));
        } catch (e) {
          console.error(e);
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

getData();

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Chalmersfood listening on http://localhost:${port}/`));
