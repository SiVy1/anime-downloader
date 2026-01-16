// Konfiguracja API
const CONFIG = {
  BASE_URL: "https://ad.tsuki.com.pl", // Zmień na IP swojego VPS, np. http://1.2.3.4:3004
  BUTTON_TEXT: "Szukaj Torrenta (Nyaa)",
  BUTTON_CLASS: "btn btn-sm btn-primary ml-2",
  SUCCESS_COLOR: "#4ade80",
  ERROR_COLOR: "#f87171",
};

let modalElement = null;

function init() {
  const buttonContainer = document.querySelector(".film-buttons");
  if (!buttonContainer) return;

  if (document.getElementById("nyaa-downloader-btn")) return;

  const downloadBtn = document.createElement("a");
  downloadBtn.id = "nyaa-downloader-btn";
  downloadBtn.className = CONFIG.BUTTON_CLASS;
  downloadBtn.innerText = CONFIG.BUTTON_TEXT;
  downloadBtn.style.cursor = "pointer";
  downloadBtn.style.marginLeft = "10px";

  downloadBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const animeName =
      document
        .querySelector(".film-name.dynamic-name")
        ?.getAttribute("data-jname") ||
      document.querySelector(".film-name.dynamic-name")?.innerText;

    if (!animeName) {
      alert("Nie udało się znaleźć nazwy anime!");
      return;
    }

    downloadBtn.innerText = "Wyszukiwanie...";
    downloadBtn.style.opacity = "0.7";

    try {
      const response = await fetch(
        `${CONFIG.BASE_URL}/search?q=${encodeURIComponent(animeName)}`,
      );
      const data = await response.json();

      if (response.ok) {
        showSelectionModal(data.data, animeName, downloadBtn);
        downloadBtn.innerText = CONFIG.BUTTON_TEXT;
        downloadBtn.style.opacity = "1";
      } else {
        throw new Error(data.error || "Błąd wyszukiwania");
      }
    } catch (error) {
      console.error(error);
      downloadBtn.innerText = "Błąd!";
      downloadBtn.style.backgroundColor = CONFIG.ERROR_COLOR;
      alert(`Błąd: ${error.message}`);
    }
  });

  buttonContainer.appendChild(downloadBtn);
  injectStyles();
}

function injectStyles() {
  if (document.getElementById("nyaa-styles")) return;
  const style = document.createElement("style");
  style.id = "nyaa-styles";
  style.innerHTML = `
    .nyaa-modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8); z-index: 99999; display: flex;
      justify-content: center; align-items: center; font-family: sans-serif;
    }
    .nyaa-modal {
      background: #1a1a1a; width: 90%; max-width: 800px; max-height: 80vh;
      border-radius: 12px; display: flex; flex-direction: column;
      border: 1px solid #333; color: #eee; overflow: hidden;
    }
    .nyaa-header { padding: 15px 20px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; }
    .nyaa-header h3 { margin: 0; font-size: 1.2rem; color: #ffad00; }
    .nyaa-close { cursor: pointer; font-size: 1.5rem; }
    .nyaa-list { overflow-y: auto; padding: 10px; flex-grow: 1; }
    .nyaa-item { 
      padding: 12px; border-bottom: 1px solid #222; display: flex; 
      justify-content: space-between; align-items: center; gap: 15px;
    }
    .nyaa-item:hover { background: #252525; }
    .nyaa-info { flex-grow: 1; }
    .nyaa-title { font-weight: bold; margin-bottom: 4px; display: block; font-size: 0.95rem; }
    .nyaa-meta { font-size: 0.8rem; color: #888; }
    .nyaa-seeders { color: #4ade80; font-weight: bold; }
    .nyaa-btn-mini { 
      background: #ffad00; color: #000; padding: 6px 14px; 
      border-radius: 4px; font-weight: bold; cursor: pointer; text-decoration: none;
      font-size: 0.85rem; border: none; transition: 0.2s;
    }
    .nyaa-btn-mini:hover { background: #e69c00; transform: scale(1.05); }
  `;
  document.head.appendChild(style);
}

function showSelectionModal(results, animeTitle, mainBtn) {
  if (modalElement) modalElement.remove();

  modalElement = document.createElement("div");
  modalElement.className = "nyaa-modal-overlay";

  let listHtml = results
    .map(
      (item) => `
    <div class="nyaa-item">
      <div class="nyaa-info">
        <span class="nyaa-title">${item.title}</span>
        <div class="nyaa-meta">
          Size: ${item.size} | Seeders: <span class="nyaa-seeders">${item.seeders}</span> | ${item.time}
        </div>
      </div>
      <button class="nyaa-btn-mini" data-magnet="${item.magnet}">Pobierz</button>
    </div>
  `,
    )
    .join("");

  if (results.length === 0)
    listHtml =
      "<p style='padding: 20px; text-align: center;'>Brak wyników na Nyaa.si</p>";

  modalElement.innerHTML = `
    <div class="nyaa-modal">
      <div class="nyaa-header">
        <h3>Wybierz wersję (Nyaa.si)</h3>
        <span class="nyaa-close">&times;</span>
      </div>
      <div class="nyaa-list">${listHtml}</div>
    </div>
  `;

  document.body.appendChild(modalElement);

  modalElement.querySelector(".nyaa-close").onclick = () =>
    modalElement.remove();
  modalElement.onclick = (e) => {
    if (e.target === modalElement) modalElement.remove();
  };

  modalElement.querySelectorAll(".nyaa-btn-mini").forEach((btn) => {
    btn.onclick = async () => {
      const magnet = btn.getAttribute("data-magnet");
      modalElement.remove();

      mainBtn.innerText = "Dodawanie...";
      mainBtn.style.backgroundColor = "";

      try {
        const res = await fetch(`${CONFIG.BASE_URL}/download-magnet`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ magnet, title: animeTitle }),
        });
        const data = await res.json();
        if (res.ok) {
          mainBtn.innerText = "Pobieranie: 0%";
          mainBtn.style.backgroundColor = CONFIG.SUCCESS_COLOR;
          const gid = data.gids[data.gids.length - 1];
          startPolling(gid, mainBtn);
        } else {
          throw new Error(data.error);
        }
      } catch (err) {
        alert("Błąd: " + err.message);
        mainBtn.innerText = "Błąd!";
      }
    };
  });
}

async function startPolling(gid, btn) {
  const STATUS_URL = `${CONFIG.BASE_URL}/status/${gid}`;

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
