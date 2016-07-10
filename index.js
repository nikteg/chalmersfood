const express = require("express");
const cheerio = require("cheerio");
const request = require("request");
const async = require("async");

const app = express();

const restaurants = [
  {
    name: "Kårresturangen",
    url: "http://intern.chalmerskonferens.se/view/restaurant/karrestaurangen/Veckomeny.rss",
    format: "text/xml",
    parse: ($, day) => {
      return $("item").map((i, el) => {
        return $(el).find("tr").map((j, el) => {
          const name = $(el).find("b").text();
          const food = $(el).find("td").get(1).text();

          return `${name} – ${food}`;
        }).get();
      }).get()[day];
    }
  },
  {
    name: "Linsen",
    url: "http://intern.chalmerskonferens.se/view/restaurant/linsen/RSS%20Feed.rss",
    format: "text/xml",
    parse: ($, day) => {
      return $("item").map((i, el) => {
        return $(el).find("tr").map((j, el) => {
          const name = $(el).find("b").text();
          const food = $(el).find("td").get(1).text();

          return `${name} – ${food}`;
        }).get();
      }).get()[day];
    }
  },
  {
    name: "Einstein",
    url: "http://www.butlercatering.se/print/6",
    format: "text/html",
    parse: ($, day) => {
      const items = [];

      $(".node-lunchmeny .content .field-day").map((i, el) => {

        items.push($(el).find("p").map((j, el) => $(el).text()).get().map(f => f.trim()).filter(f => f !== ""));

      });

      return items[day];
    }
  }
  // "express": {
  //   "url": "http://intern.chalmerskonferens.se/view/restaurant/express/Veckomeny",
  //   "format": "text/html",
  //   "encoding": "utf-8"
  // },
  // "tegel": {
  //   "url": "http://tegel.kvartersmenyn.se",
  //   "format": "text/html",
  //   "encoding": "utf-8"
  // }
];

app.set("view engine", "pug");
app.use(express.static("public"));

const day = new Date();
const today = Math.max(Math.min(0, day.getDay() - 1), 4);

app.get("/", function (req, res) {
  const data = "test";

  const selectedDay = req.query.day || today;

  async.map(restaurants, (r, cb) => {
    request(r.url, (err, resp, body) => {
      if (!err && resp.statusCode === 200) {
        return cb(null, {
          name: r.name,
          items: r.parse(cheerio.load(body, {
            xmlMode: r.format === "text/xml"
          }), selectedDay)
        });
      }

      cb(null);
    });
  }, (err, results) => {
    const data = results.filter(r => r != null);

    res.render("index", { data, selectedDay });
  });
});

const port = process.env.port || 3000;
app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
});