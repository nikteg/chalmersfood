const express = require("express");
const cheerio = require("cheerio");
const request = require("request");
const async = require("async");
const moment = require("moment");

const app = express();

const CACHE_LIFE = 1 * 60 * 60 * 1000;

const restaurants = [
  {
    name: "Kårresturangen",
    url: "http://intern.chalmerskonferens.se/view/restaurant/karrestaurangen/Veckomeny.rss",
    format: "text/xml",
    parse: ($) => $("item").map((i, el) => $(el).find("tr").map((j, el2) => {
      const name = $(el2)
        .find("b")
        .text();

      const food = $(el2)
        .find("td")
        .eq(1)
        .text();

      return `${name} – ${food}`;
    })).get(),
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
          .filter(f => f !== "")));

      return items;
    },
  },
  {
    name: "Linsen",
    url: "http://intern.chalmerskonferens.se/view/restaurant/linsen/RSS%20Feed.rss",
    format: "text/xml",
    parse: ($) => $("item").map((i, el) => $(el).find("tr").map((j, el2) => {
      const name = $(el2)
        .find("b")
        .text();

      const food = $(el2)
        .find("td")
        .eq(1)
        .text();

      return `${name} – ${food}`;
    })).get(),
  },
  {
    name: "Express",
    url: "http://intern.chalmerskonferens.se/view/restaurant/express/Veckomeny.rss",
    format: "text/xml",
    parse: ($) => $("item").map((i, el) => $(el).find("tr").map((j, el2) => {
      const name = $(el2)
        .find("b")
        .text();

      const food = $(el2)
        .find("td")
        .eq(1)
        .text();

      return `${name} – ${food}`;
    })).get(),
  },
];

app.set("views", `${__dirname}/views`);
app.set("view engine", "pug");
app.use("/static", express.static(`${__dirname}/public`));

let clients = [];
let isFetching = false;

const validResult = (oldResult, result) => {

  // If the old result contains an error, just use the new one
  if (oldResult.error) {
    return result;
  }

  if (result.error) {
    return oldResult;
  }

  // Shallow compare on the items string arrays
  for (let i = 0; i < result.items.length; ++i) {
    if (result.items[i] !== oldResult.items[i]) {
      return oldResult;
    }
  }

  return result;
}

const success = (restaurant, items) => ({
  items,
  name: restaurant.name,
  date: Date.now(),
});

const fail = (restaurant, error) => ({
  error,
  name: restaurant.name,
  items: [],
  date: Date.now(),
});

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
  console.log(`Chalmersfood listening on http://localhost:${port}/ !`));
