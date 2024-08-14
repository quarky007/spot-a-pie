const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = 5000;

app.get("/authorize", async (req, res) => {
  try {
    res.redirect(
      "https://accounts.spotify.com/authorize?" +
        new URLSearchParams({
          client_id: "0b1feca00dd64b06b2ecb88833bd84d8",
          response_type: "token",
          redirect_uri: "http://localhost:5000",
          scope: [
            "user-read-playback-state",
            "user-modify-playback-state",
            "user-read-currently-playing",
            "app-remote-control",
            "streaming",
            "playlist-read-private",
            "playlist-read-collaborative",
            "playlist-modify-private",
            "playlist-modify-public",
            "user-read-playback-position",
            "user-top-read",
            "user-read-recently-played",
          ].join(" "),
        }).toString()
    );
  } catch (err) {
    console.error(err);
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
