import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import axios from "axios";

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


// endpoints
app.get('/', (req, res) => {
  res.render("index.ejs");
})

app.get('/search', (req, res) => {
  let query = String(query.query).trim();

  // let filteredCards = 

})

app.get('/card/:id', (req, res) => {
  const cardId = req.params.id;
  const card = cards[cardId] ?? Object.values(cards).find(
    (item) => String(item.id.card) === cardId
  );

  if (!card) {
    return res.status(404).json({ error: "Card not found" });
  }

  res.json(card);
});

app.get('/art/:cardId', async (req, res) => {
  const cardId = req.params.cardId;
  const card = cards[cardId] ?? Object.values(cards).find(
    (item) => String(item.id?.card) === cardId
  );

  if (!card) {
    return res.status(404).json({ error: "Card not found" });
  }

  const artId = card.id?.art;
  if (artId == null) {
    return res.status(404).json({ error: "Card art not found" });
  }

  // the art info isn't in the cache, so we need to fetch it
  try {
    const artDataReq = await axios.get(gwentAPIURL, { params: {
      key: "data",
      version: "1.0.0.15",
      response: "json",
      id: card.id.card
    } });
    const response = artDataReq.data.response;
    const responseCard = Object.values(response ?? {})[0];
    const responseArtId = responseCard?.id?.art;

    if (responseArtId == null) {
      return res.status(404).json({ error: "Card art not found" });
    }

    const artworkUrl = "https://gwent.one/image/gwent/assets/card/art";
    res.json({
      artId: responseArtId,
      links: {
        low: `${artworkUrl}/low/${responseArtId}.jpg`,
        medium: `${artworkUrl}/medium/${responseArtId}.jpg`
      }
    });

  } catch (error) {
    res.status(502).json({ error: "Failed to fetch card art" });
  }
});

// listen
app.listen(port, () => console.log(`Open in browser: http://localhost:7777`));
