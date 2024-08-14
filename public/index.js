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

document.addEventListener("DOMContentLoaded", async () => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  accessToken = params.get("access_token");

  if (!accessToken) {
    // If no token is present, redirect to Spotify authorization
    window.location.href = "/authorize";
    return;
  }

  // const result = await releases();
  // console.log(result);
  // let innerHTML;
  // result.albums.items.forEach((item) => {
  //   innerHTML += `
  //     <div>
  //       <h2>${item.name}</h2>
  //     </div>
  //   `;
  // });

  // document.getElementById("albums").innerHTML = innerHTML;
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

  document.getElementById("albums").innerHTML = result.tracks.items
    .map(
      (item) =>
        `<div>
        <img class="img-fluid" src="${item.album.images[0].url}">
        <h1>${item.name}</h1>
        ${
          item.preview_url
            ? `
          <audio controls="controls">
              <source src=${item.preview_url} type="audio/mpeg">
          </audio>
          `
            : `<p class="text-muted">No preview available</p>`
        }
        <div class="dropdown">
          <button id="${
            item.id
          }" class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            Add to playlist
          </button>
          <ul class="dropdown-menu">
          </ul>
        </div>
    `
    )
    .join("");

  result.tracks.items.forEach((item) => {
    document.getElementById(item.id).addEventListener("click", handleSave);
  });
};

const handleSave = async (e) => {
  console.log("clicked");
  const items = await fetchUserPlaylists();

  console.log(items);
  e.target.parentElement.getElementsByTagName("ul")[0].innerHTML = items
    .map(
      (item) => `<li id="${item.id}" class="dropdown-item">${item.name}</li>`
    )
    .join("");

  let trackId = e.target.id;

  items.forEach((item) => {
    document
      .getElementById(item.id)
      .addEventListener("click", () => addTrackToPlaylist(item.id, trackId));
  });
};

async function fetchUserPlaylists() {
  const response = await fetchWithAuth(`${API_BASE_URL}/me/playlists`);
  if (!response.ok) throw new Error("Failed to fetch playlists");

  const data = await response.json();
  return data.items;
}

async function addTrackToPlaylist(playlistId, trackUri) {
  console.log(playlistId, trackUri);
  const response = await fetchWithAuth(
    `${API_BASE_URL}/playlists/${playlistId}/tracks`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: [`spotify:track:${trackUri}`] }),
    }
  );

  if (!response.ok) throw new Error("Failed to add track");
}

document.getElementById("search").addEventListener("submit", handleSearch);

const releases = async () => {
  const response = await fetchWithAuth(`${API_BASE_URL}/browse/new-releases`);
  const body = await response.json();

  return body;
};

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

    try {
      const userId = await fetchUserId(accessToken);
      await createPlaylist(userId, playlistName, accessToken);
      alert("Playlist created successfully!");
    } catch (error) {
      console.error("Error creating playlist:", error);
      alert("Failed to create playlist. Please try again.");
    }
  });

async function fetchUserId() {
  const response = await fetchWithAuth("https://api.spotify.com/v1/me");

  if (!response.ok) {
    throw new Error("Failed to fetch user ID");
  }

  const data = await response.json();
  return data.id;
}

async function createPlaylist(userId, playlistName) {
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

// recommendation section

document.addEventListener("DOMContentLoaded", () => {
  const recommendationsButton = document.getElementById("getRecommendations");
  const recommendationsContainer = document.getElementById(
    "recommendationsContainer"
  );
  const genreOptionsContainer = document.getElementById("genreOptions");
  const genreForm = document.getElementById("genreForm");
  const recommendationsDiv = document.getElementById("recommendations");

  recommendationsButton.addEventListener("click", () => {
    recommendationsContainer.style.display = "block";
    fetchGenres();
  });

  async function fetchGenres() {
    try {
      const response = await fetchWithAuth(
        "https://api.spotify.com/v1/recommendations/available-genre-seeds",
        {}
      );
      const data = await response.json();
      displayGenres(data.genres);
    } catch (error) {
      console.error("Error fetching genres:", error);
    }
  }

  function displayGenres(genres) {
    genreOptionsContainer.innerHTML = "";
    genres.forEach((genre) => {
      const button = document.createElement("button");
      button.className = "btn btn-secondary me-2";
      button.textContent = genre;
      button.addEventListener("click", () => fetchRecommendations(genre));
      genreOptionsContainer.appendChild(button);
    });
    genreForm.style.display = "block";
  }

  async function fetchRecommendations(genre) {
    try {
      const response = await fetchWithAuth(
        `https://api.spotify.com/v1/recommendations?seed_genres=${genre}`,
        {}
      );
      const data = await response.json();
      displayRecommendations(data.tracks);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  }

  function displayRecommendations(tracks) {
    recommendationsDiv.innerHTML = "";
    tracks.forEach((track) => {
      const trackDiv = document.createElement("div");
      trackDiv.className = "mb-2";
      trackDiv.innerHTML = `
        <h5>${track.name}</h5>
        <p>${track.artists.map((artist) => artist.name).join(", ")}</p>
        <p>${track.album.name}</p>
      `;
      recommendationsDiv.appendChild(trackDiv);
    });
  }
});
