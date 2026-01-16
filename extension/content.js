// Konfiguracja API - tutaj możesz łatwo zmienić adres serwera
const CONFIG = {
  API_URL: "https://ad.tsuki.com.pl/download", // Zmień na IP swojego VPS, np. http://1.2.3.4:5000/download
  BUTTON_TEXT: "Wyślij do pobrania (1080p)",
  BUTTON_CLASS: "btn btn-sm btn-primary ml-2", // Klasy hiAnime dla przycisków
  SUCCESS_COLOR: "#4ade80",
  ERROR_COLOR: "#f87171",
};

function init() {
  console.log("HiAnime Downloader Extension active");

  // Szukamy kontenera z przyciskami
  const buttonContainer = document.querySelector(".film-buttons");
  if (!buttonContainer) return;

  // Sprawdzamy czy przycisk już istnieje
  if (document.getElementById("nyaa-downloader-btn")) return;

  // Tworzymy przycisk
  const downloadBtn = document.createElement("a");
  downloadBtn.id = "nyaa-downloader-btn";
  downloadBtn.className = CONFIG.BUTTON_CLASS;
  downloadBtn.innerText = CONFIG.BUTTON_TEXT;
  downloadBtn.style.cursor = "pointer";
  downloadBtn.style.marginLeft = "10px";

  downloadBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const animeName = document
      .querySelector(".film-name.dynamic-name")
      ?.getAttribute("data-jname");
    const stats = document.querySelector(".film-stats")?.innerText || "";
    const isMovie = stats.includes("Movie") || stats.includes("OVA");
    const type = isMovie ? "Movie" : "TV";

    if (!animeName) {
      alert("Nie udało się znaleźć nazwy anime!");
      return;
    }

    downloadBtn.innerText = "Wysyłanie...";
    downloadBtn.style.opacity = "0.7";

    try {
      const response = await fetch(CONFIG.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: animeName,
          type: type,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        downloadBtn.innerText = "Pobieranie: 0%";
        downloadBtn.style.backgroundColor = CONFIG.SUCCESS_COLOR;

        // Pobierz ostatni GID (w przypadku batcha jest jeden główny)
        const gid = data.gids[data.gids.length - 1];
        startPolling(gid, downloadBtn);
      } else {
        throw new Error(data.detail || "Błąd serwera");
      }
    } catch (error) {
      console.error(error);
      downloadBtn.innerText = "Błąd!";
      downloadBtn.style.backgroundColor = CONFIG.ERROR_COLOR;
      alert(`Błąd: ${error.message}`);
    }
  });

  buttonContainer.appendChild(downloadBtn);
}

async function startPolling(gid, btn) {
  const STATUS_URL = CONFIG.API_URL.replace("/download", `/status/${gid}`);

  const interval = setInterval(async () => {
    try {
      const res = await fetch(STATUS_URL);
      const data = await res.json();

      if (data.status === "complete") {
        btn.innerText = "Gotowe! (100%)";
        btn.style.backgroundColor = "#22c55e";
        clearInterval(interval);
        setTimeout(() => {
          btn.innerText = CONFIG.BUTTON_TEXT;
          btn.style.backgroundColor = "";
        }, 5000);
      } else if (data.status === "error") {
        btn.innerText = "Błąd pobierania!";
        btn.style.backgroundColor = CONFIG.ERROR_COLOR;
        clearInterval(interval);
      } else {
        btn.innerText = `${data.progress}% | ${data.speed} MB/s`;
      }
    } catch (error) {
      console.error("Polling error:", error);
      clearInterval(interval);
    }
  }, 2000); // Odświeżaj co 2 sekundy
}

// Obserwator do dynamicznie ładowanych stron (HiAnime często przeładowuje content bez odświeżania strony)
const observer = new MutationObserver((mutations) => {
  init();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Pierwsze uruchomienie
init();
