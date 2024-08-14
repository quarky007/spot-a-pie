API_BASE_URL = "https://api.spotify.com/v1";
let accessToken;

const fetchWithAuth = (url, opts) => {
  return fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...opts?.header,
    },
  });
};

document.addEventListener("DOMContentLoaded", () => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  accessToken = params.get("access_token");

  if (!accessToken) {
    // If no token is present, redirect to Spotify authorization
    window.location.href = "/authorize";
    return;
  }

  const apiUrl = "https://api.spotify.com/v1/albums/4aawyAB9vmqN3uQ7FjRGTy";
  console.log(accessToken);

  fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      const albumsContainer = document.getElementById("albums");
      console.log(data);
      const items = data.tracks.items;

      items.forEach((item) => {
        const albumCard = document.createElement("div");
        albumCard.className = "col-md-3 mb-4";

        albumCard.innerHTML = `
          <div class="card">
              <div class="card-body">
                  <h5 class="card-title">${item.name}</h5>
                  <p class="card-text">${item.artists
                    .map((artist) => artist.name)
                    .join(", ")}</p>
              </div>
          </div>
        `;

        albumsContainer.appendChild(albumCard);
      });
    })
    .catch((error) => console.error("Error fetching data:", error));
});

const search = async (query) => {
  // TODO: Allow user to choose search type
  const response = await fetchWithAuth(
    `${API_BASE_URL}/search?` + new URLSearchParams({ q: query, type: "track" })
  );
  return await response.json();
};

const handleSearch = async (e) => {
  e.preventDefault();
  const result = await search(e.target.elements.query.value);

  console.log(result);

  innerHTML = "";
  result.tracks.items.forEach((item) => {
    innerHTML += `
      <div>
        <h1>${item.name}</h1>
        ${
          item.preview_url
            ? `
          <audio controls="controls">
              <source src=${item.preview_url} type="audio/mpeg">
          </audio>
          `
            : "No preview"
        }
      </div>
    `;
  });

  document.getElementById("albums").innerHTML = innerHTML;
};

document.getElementById("search").addEventListener("submit", handleSearch);

// playlist fuctions

document
  .getElementById("createPlaylistBtn")
  .addEventListener("click", function () {
    document.getElementById("playlistFormContainer").style.display = "block";
  });

document
  .getElementById("submitPlaylistBtn")
  .addEventListener("click", async function () {
    const playlistName = document.getElementById("playlistName").value;
    if (!playlistName) {
      alert("Please enter a playlist name.");
      return;
    }

    const token = accessToken;

    try {
      const userId = await fetchUserId(token);
      await createPlaylist(userId, playlistName, token);
      alert("Playlist created successfully!");
    } catch (error) {
      console.error("Error creating playlist:", error);
      alert("Failed to create playlist. Please try again.");
    }
  });

async function fetchUserId(token) {
  const response = await fetchWithAuth("https://api.spotify.com/v1/me");

  if (!response.ok) {
    throw new Error("Failed to fetch user ID");
  }

  const data = await response.json();
  return data.id;
}

async function createPlaylist(userId, playlistName, token) {
  const response = await fetchWithAuth(
    `https://api.spotify.com/v1/users/${userId}/playlists`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: playlistName,
        description: "New Playlist",
        public: false,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create playlist");
  }

  const playlistData = await response.json();
  console.log("Created playlist:", playlistData);
}
