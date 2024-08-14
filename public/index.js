document.addEventListener("DOMContentLoaded", () => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");

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

document.getElementById("play", async () => {});
