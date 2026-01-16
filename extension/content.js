// Konfiguracja API - tutaj możesz łatwo zmienić adres serwera
const CONFIG = {
  API_URL: "http://localhost:5000/download", // Zmień na IP swojego VPS, np. http://1.2.3.4:5000/download
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
        downloadBtn.innerText = "Dodano do kolejki!";
        downloadBtn.style.backgroundColor = CONFIG.SUCCESS_COLOR;
      } else {
        throw new Error(data.detail || "Błąd serwera");
      }
    } catch (error) {
      console.error(error);
      downloadBtn.innerText = "Błąd!";
      downloadBtn.style.backgroundColor = CONFIG.ERROR_COLOR;
      alert(`Błąd: ${error.message}`);
    }

    // Przywróć przycisk po 3 sekundach
    setTimeout(() => {
      downloadBtn.innerText = CONFIG.BUTTON_TEXT;
      downloadBtn.style.backgroundColor = "";
      downloadBtn.style.opacity = "1";
    }, 3000);
  });

  buttonContainer.appendChild(downloadBtn);
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
