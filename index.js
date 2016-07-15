const express = require("express");
const cheerio = require("cheerio");
const request = require("request");
const async = require("async");

const app = express();

const CACHE_LIFE = 12 * 60 * 60 * 1000;
const cache = { date: Date.now(), data: null };

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
        .get(1)
        .text();

      return `${name} – ${food}`;
    })
    .get()).get(),
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
        .get(1)
        .text();

      return `${name} – ${food}`;
    })
      .get()).get(),
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
        .get(1)
        .text();

      return `${name} – ${food}`;
    })
    .get()).get(),
  },
];

app.set("views", `${__dirname}/views`);
app.set("view engine", "pug");
app.use("/static", express.static(`${__dirname}/public`));

const day = new Date();
const today = Math.min(Math.max(0, day.getDay() - 1), 4);
let clients = [];
let isFetching = false;

const getData = () => new Promise((resolve, reject) => {
  if (cache.data && Date.now() < cache.date + CACHE_LIFE) {
    return resolve(cache.data);
  }

  clients.push(resolve);
  if (isFetching) return;

  console.log("Cache invalid or no cache found, fetching...");

  isFetching = true;

  async.map(restaurants, (r, cb) => {
    request(r.url, (err, resp, body) => {
      if (!err && resp.statusCode === 200) {
        return cb(null, {
          name: r.name,
          items: r.parse(cheerio.load(body, {
            xmlMode: r.format === "text/xml",
          })),
        });
      }

      return cb(null);
    });
  }, (err, results) => {
    const data = results.filter(r => r != null);

    console.log("Setting new cache!");

    cache.date = Date.now();
    cache.data = data;

    isFetching = false;

    console.log("Resolving new data to", clients.length, "clients");
    clients.map(f => f(data));

    clients = [];
  });
});

const filterDay = (data, dayIndex) => data.map(r => {
  const items = r.items[dayIndex] || [];

  return Object.assign({}, r, { items });
});

app.get("/", (req, res) => {
  const selectedDay = req.query.day || today;

  getData().then(data => res.render("index", {
    data: filterDay(data, selectedDay),
    selectedDay,
  }));
});

const port = process.env.port || 3000;
app.listen(port, () => console.log(`Chalmersfood listening on port ${port}!`));
