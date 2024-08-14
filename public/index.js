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
      (item) => `
        <div class="d-flex align-items-center mb-3 rounded">
          <img class="rounded img-fluid" width="120px" src="${
            item.album.images[0].url
          }">
          <div class="p-4 d-flex flex-grow-1 align-items-center justify-content-between">
            <div>
              <h2>${item.name}</h2>
              <h3 class="lead mb-4">${item.artists
                .map((artist) => artist.name)
                .join(", ")}</h3>
              ${
                item.preview_url
                  ? `
                <audio controls="controls">
                    <source src=${item.preview_url} type="audio/mpeg">
                </audio>
                `
                  : `<p class="text-white">No preview available</p>`
              }
            </div>
            <div class="dropdown">
              <button id="${
                item.id
              }" class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                Save
              </button>
              <ul class="dropdown-menu">
              </ul>
            </div>
          </div>
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
      button.className = "btn btn-secondary m-2";
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
    console.log(tracks);

    tracks.forEach((track) => {
      const trackDiv = document.createElement("div");
      trackDiv.innerHTML = `
        <div class="d-flex align-items-center mb-4">
          <div>
            <img class="rounded img-fluid" width="100px" src="${
              track.album.images[0].url
            }">
          </div>

          <div class="d-flex flex-grow-1 justify-content-between align-items-center p-4">
            <div>
              <h2>${track.name}</h2>
              <h3 class="lead">${track.artists
                .map((artist) => artist.name)
                .join(", ")}</h3>
              <p>${track.album.name}</p>
            </div>
            
            <div class="dropdown">
              <button id="${
                track.id
              }" class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                Save
              </button>
              <ul class="dropdown-menu">
              </ul>
            </div>
          </div>
        </div>
      `;
      recommendationsDiv.appendChild(trackDiv);
    });

    tracks.forEach((track) => {
      document.getElementById(track.id).addEventListener("click", handleSave);
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const homeBtn = document.getElementById("homeBtn");
  const newReleasesContainer = document.getElementById("new-releases");
  const artistMusicContainer = document.getElementById("artist-music");

  // Replace with your actual Spotify API token
  const accessToken = "YOUR_SPOTIFY_ACCESS_TOKEN";

  homeBtn.addEventListener("click", async () => {
    try {
      const response = await fetchWithAuth(
        "https://api.spotify.com/v1/browse/new-releases",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const data = await response.json();

      // Clear existing content
      newReleasesContainer.innerHTML = "";
      artistMusicContainer.innerHTML = ""; // Clear artist music section

      // Populate the container with new content
      if (data && data.albums && data.albums.items) {
        const albums = data.albums.items;
        albums.forEach((album) => {
          const albumElement = document.createElement("div");
          albumElement.className = "col-md-3 mb-4"; // Grid column with margin bottom
          albumElement.innerHTML = `
            <div class="card" data-artist-id="${
              album.artists[0].id
            }" data-artist-name="${album.artists[0].name}">
              <img src="${album.images[0].url}" class="card-img-top" alt="${
            album.name
          }" />
              <div class="card-body">
                <h5 class="card-title">${album.name}</h5>
                <p class="card-text">${album.artists
                  .map((artist) => artist.name)
                  .join(", ")}</p>
              </div>
            </div>
          `;
          newReleasesContainer.appendChild(albumElement);
        });

        // Add click event to each card
        document.querySelectorAll(".card").forEach((card) => {
          card.addEventListener("click", async () => {
            const artistId = card.getAttribute("data-artist-id");
            const artistName = card.getAttribute("data-artist-name");
            await fetchArtistMusic(artistId, artistName);
          });
        });
      }
    } catch (error) {
      console.error("Error fetching music data:", error);
    }
  });

  // Fetch music by artist
  async function fetchArtistMusic(artistId, artistName) {
    try {
      const response = await fetchWithAuth(
        `https://api.spotify.com/v1/artists/${artistId}/albums`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const data = await response.json();

      // Clear existing artist music content
      artistMusicContainer.innerHTML = `
        <h3>Music by ${artistName}</h3>
        <div class="row">
          ${data.items
            .map(
              (album) => `
            <div class="col-md-3 mb-4">
              <div class="card">
                <img src="${album.images[0].url}" class="card-img-top" alt="${album.name}" />
                <div class="card-body">
                  <h5 class="card-title">${album.name}</h5>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    } catch (error) {
      console.error("Error fetching artist music data:", error);
    }
  }
});

// library section

document.addEventListener("DOMContentLoaded", () => {
  const libraryBtn = document.getElementById("libraryBtn");
  const mainContent = document.getElementById("albums");

  if (libraryBtn && mainContent) {
    libraryBtn.addEventListener("click", async () => {
      const items = await fetchUserPlaylists();
      console.log(items);
      mainContent.innerHTML = items
        .map(
          (item) => `
            <div id="${item.id}" class="d-flex align-items-center mb-3 hover rounded p-4">
              <div>
                <img src="${item.images[0].url}" width="120px" class="rounded"> 
              </div>

              <div class="p-4">
                <h2>${item.name}</h2>
                <h3 class="lead">${item.tracks.total} track(s)</h3>
              </div>
            </div>  
          `
        )
        .join("");

      items.forEach((item) =>
        document.getElementById(item.id).addEventListener("click", async () => {
          console.log("clicked");
          let innerHTML = `<h1>${item.name}</h1>`;
          const response = await fetchWithAuth(item.href);
          const body = await response.json();

          innerHTML += body.tracks.items
            .map(
              (item) => `
                <div class="d-flex align-items-center mb-4">
                  <div>
                    <img class="rounded img-fluid" width="100px" src="${
                      item.track.album.images[0].url
                    }">
                  </div>

                  <div class="d-flex flex-grow-1 justify-content-between align-items-center p-4">
                    <div>
                      <h2>${item.track.name}</h2>
                      <h3 class="lead">${item.track.artists
                        .map((artist) => artist.name)
                        .join(", ")}</h3>
                      <p>${item.track.album.name}</p>
                    </div>
                  </div>
                </div>`
            )
            .join("");

          mainContent.innerHTML = innerHTML;
        })
      );
    });
  } else {
    console.error("Required elements are missing.");
  }
});
