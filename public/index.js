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

  const result = await releases();
  console.log(result);
  let innerHTML;
  result.albums.items.forEach((item) => {
    innerHTML += `
      <div>
        <h2>${item.name}</h2>
      </div>
    `;
  });

  document.getElementById("albums").innerHTML = innerHTML;
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
  for (const item of result.tracks.items) {
    innerHTML += `
      <div>
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
        <button id=${item.id} type="button" class="btn btn-dark">Save</button>
      </div>
    `;
  }

  document.getElementById("albums").innerHTML = innerHTML;
};

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
