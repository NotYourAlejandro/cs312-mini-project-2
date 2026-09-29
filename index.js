import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import axios from "axios";
import { Fzf } from "fzf";

const app = express();
const port = 7777;

const gwentAPIURL = "https://api.gwent.one"

// middleware
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())

// load api into memory as cache (per API dev request)
const cardsCache = await axios.get(gwentAPIURL, { params: {
  key: "data",
  version: "1.0.0.15"
} });
const cards = cardsCache.data.response;
const searchableCards = Object.values(cards).filter(  // since not all cards are clean enough
  (card) => typeof card.name === "string" && card.id?.art != null
);

// set up fuzzy finder
const cardFzf = new Fzf(searchableCards, {
  selector: (card) => card.name   // since the card object itself can't be a key
});

// endpoints //

// homepage
app.get('/', (req, res) => {
  res.render("index.ejs", { query: "", results: null });
})

// whenever someone enters a search term into the search bar
app.get('/search', (req, res) => {
  const query = String(req.query.query ?? "").trim();
  if (!query) {
    return res.redirect("/");
  }

  // this is where the magic happens, the fuzzy finder!
  const results = cardFzf.find(query).map(({ item }) => ({
    name: item.name,
    artId: item.id.art
  }));

  res.render("index.ejs", { query, results });
})

// convenience: I'd like to get the card data from an endpoint
app.get('/card/:id', (req, res) => {
  const cardId = req.params.id;

  let card;
  if (cards[cardId] != null) {
    card = cards[cardId];
  } else {
    card = Object.values(cards).find(
      (item) => String(item.id.card) === cardId
    );
  }

  if (!card) {
    return res.status(404).json({ error: "Card not found" });
  }

  res.json(card);
});

// start up the server
app.listen(port, () => console.log(`Open in browser: http://localhost:${port}`));
