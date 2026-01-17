// Konfiguracja API
const CONFIG = {
  BASE_URL: "http://100.67.98.49:3002/api/downloader", // Zmieniono na ścieżkę Next.js API
  BUTTON_TEXT: "Szukaj Torrenta (Nyaa)",
  BUTTON_CLASS_HIANIME: "btn btn-sm btn-primary ml-2",
  BUTTON_CLASS_ANILIST: "nyaa-anilist-btn", // Custom class for AniList
  SUCCESS_COLOR: "#4ade80",
  ERROR_COLOR: "#f87171",
};

const SITE_CONFIG = {
  "hianime.to": {
    container: ".film-buttons",
    title: ".film-name.dynamic-name",
    titleAttr: "data-jname",
    buttonClass: CONFIG.BUTTON_CLASS_HIANIME,
    insertMethod: "appendChild",
  },
  "anilist.co": {
    container: ".header .actions",
    title: ".header .content h1",
    buttonClass: CONFIG.BUTTON_CLASS_ANILIST,
    insertMethod: "appendChild",
  },
};

let modalElement = null;

function init() {
  const hostname = window.location.hostname.replace("www.", "");
  const site = SITE_CONFIG[hostname];
  if (!site) return;

  const buttonContainer = document.querySelector(site.container);
  if (!buttonContainer) return;

  if (document.getElementById("nyaa-downloader-btn")) return;

  const downloadBtn = document.createElement("a");
  downloadBtn.id = "nyaa-downloader-btn";
  downloadBtn.className = site.buttonClass;
  downloadBtn.innerText = CONFIG.BUTTON_TEXT;
  downloadBtn.style.cursor = "pointer";

  if (hostname === "hianime.to") {
    downloadBtn.style.marginLeft = "10px";
  }

  downloadBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    let animeName = "";
    const titleEl = document.querySelector(site.title);
    if (titleEl) {
      if (site.titleAttr) {
        animeName = titleEl.getAttribute(site.titleAttr) || titleEl.innerText;
      } else {
        animeName = titleEl.innerText;
      }
    }

    if (!animeName || animeName.trim() === "") {
      alert("Nie udało się znaleźć nazwy anime!");
      return;
    }

    animeName = animeName.trim();
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

  buttonContainer[site.insertMethod](downloadBtn);
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
    .nyaa-checkbox { width: 20px; height: 20px; cursor: pointer; }
    .nyaa-info { flex-grow: 1; }
    .nyaa-title { font-weight: bold; margin-bottom: 4px; display: block; font-size: 0.95rem; }
    .nyaa-meta { font-size: 0.8rem; color: #888; }
    .nyaa-seeders { color: #4ade80; font-weight: bold; }
    .nyaa-footer { padding: 15px 20px; border-top: 1px solid #333; display: flex; justify-content: flex-end; gap: 10px; }
    .nyaa-btn-mini { 
      background: #ffad00; color: #000; padding: 6px 14px; 
      border-radius: 4px; font-weight: bold; cursor: pointer; text-decoration: none;
      font-size: 0.85rem; border: none; transition: 0.2s;
    }
    .nyaa-btn-mini:hover { background: #e69c00; transform: scale(1.05); }
    .nyaa-btn-batch { 
      background: #3db4f2; color: #fff; padding: 10px 20px; 
      border-radius: 6px; font-weight: bold; cursor: pointer;
      font-size: 0.95rem; border: none; transition: 0.2s;
    }
    .nyaa-btn-batch:hover { background: #2b9fd9; transform: translateY(-2px); }
    .nyaa-btn-batch:disabled { background: #555; cursor: not-allowed; transform: none; }

    .nyaa-sort-select {
      background: #333; color: #fff; border: 1px solid #444; border-radius: 4px;
      padding: 4px 8px; font-size: 0.8rem; cursor: pointer; outline: none;
    }
    .nyaa-badge {
      display: inline-block; padding: 2px 6px; border-radius: 4px;
      font-size: 0.7rem; font-weight: bold; margin-right: 6px;
      vertical-align: middle; line-height: 1;
    }
    .nyaa-badge-mkv { background: #3db4f2; color: #fff; }
    .nyaa-badge-mp4 { background: #4ade80; color: #000; }
    .nyaa-badge-hevc { background: #facc15; color: #000; }

    /* Styl dla przycisku na AniList */
    .nyaa-anilist-btn {
      background: #3db4f2;
      color: #fff;
      padding: 10px 15px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 0.9rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 10px;
      transition: 0.2s;
    }
    .nyaa-anilist-btn:hover {
      background: #2b9fd9;
      transform: translateY(-2px);
    }
  `;
  document.head.appendChild(style);
}

function showSelectionModal(
  results,
  animeTitle,
  mainBtn,
  currentSort = "seeders",
) {
  if (modalElement) modalElement.remove();

  modalElement = document.createElement("div");
  modalElement.className = "nyaa-modal-overlay";

  let listHtml = results
    .map((item, index) => {
      const extBadge =
        item.extension !== "unknown"
          ? `<span class="nyaa-badge nyaa-badge-${item.extension}">${item.extension.toUpperCase()}</span>`
          : "";
      const hevcBadge = item.isHevc
        ? `<span class="nyaa-badge nyaa-badge-hevc">HEVC</span>`
        : "";

      return `
    <div class="nyaa-item">
      <input type="checkbox" class="nyaa-checkbox" data-index="${index}" data-magnet="${item.magnet}">
      <div class="nyaa-info">
        <span class="nyaa-title">${extBadge} ${hevcBadge} ${item.title}</span>
        <div class="nyaa-meta">
          Size: ${item.size} | Seeders: <span class="nyaa-seeders">${item.seeders}</span> | ${item.time}
        </div>
      </div>
      <button class="nyaa-btn-mini" data-magnet="${item.magnet}">Pobierz</button>
    </div>
  `;
    })
    .join("");

  if (results.length === 0)
    listHtml =
      "<p style='padding: 20px; text-align: center;'>Brak wyników na Nyaa.si</p>";

  modalElement.innerHTML = `
    <div class="nyaa-modal">
      <div class="nyaa-header">
        <div style="display: flex; align-items: center; gap: 15px;">
          <input type="checkbox" id="nyaa-select-all" class="nyaa-checkbox">
          <h3>Wybierz wersję (Nyaa.si)</h3>
          <select id="nyaa-sort-select" class="nyaa-sort-select">
            <option value="seeders" ${currentSort === "seeders" ? "selected" : ""}>Sortuj: Seedersi</option>
            <option value="size" ${currentSort === "size" ? "selected" : ""}>Sortuj: Wielkość</option>
          </select>
        </div>
        <span class="nyaa-close">&times;</span>
      </div>
      <div class="nyaa-list">${listHtml}</div>
      <div class="nyaa-footer">
        <button id="nyaa-download-selected" class="nyaa-btn-batch" disabled>Pobierz zaznaczone (0)</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalElement);

  // Obsługa sortowania
  const sortSelect = modalElement.querySelector("#nyaa-sort-select");
  sortSelect.onchange = async () => {
    const newSort = sortSelect.value;
    sortSelect.disabled = true;
    sortSelect.style.opacity = "0.5";

    try {
      const response = await fetch(
        `${CONFIG.BASE_URL}/search?q=${encodeURIComponent(animeTitle)}&sort=${newSort}&order=desc`,
      );
      const data = await response.json();
      if (response.ok) {
        showSelectionModal(data.data, animeTitle, mainBtn, newSort);
      }
    } catch (err) {
      console.error(err);
      sortSelect.disabled = false;
      sortSelect.style.opacity = "1";
    }
  };

  const selectAll = modalElement.querySelector("#nyaa-select-all");
  const checkboxes = modalElement.querySelectorAll(
    ".nyaa-checkbox:not(#nyaa-select-all)",
  );
  const batchBtn = modalElement.querySelector("#nyaa-download-selected");

  const updateBatchBtn = () => {
    const count = modalElement.querySelectorAll(
      ".nyaa-checkbox:checked:not(#nyaa-select-all)",
    ).length;
    batchBtn.innerText = `Pobierz zaznaczone (${count})`;
    batchBtn.disabled = count === 0;
  };

  if (selectAll) {
    selectAll.onchange = () => {
      checkboxes.forEach((cb) => (cb.checked = selectAll.checked));
      updateBatchBtn();
    };
  }

  checkboxes.forEach((cb) => {
    cb.onchange = updateBatchBtn;
  });

  modalElement.querySelector(".nyaa-close").onclick = () =>
    modalElement.remove();

  modalElement.onclick = (e) => {
    if (e.target === modalElement) modalElement.remove();
  };

  // Obsługa pojedynczego pobierania
  modalElement.querySelectorAll(".nyaa-btn-mini").forEach((btn) => {
    btn.onclick = async () => {
      const magnet = btn.getAttribute("data-magnet");
      startDownload([magnet], animeTitle, mainBtn);
      modalElement.remove();
    };
  });

  // Obsługa pobierania masowego
  batchBtn.onclick = async () => {
    const selectedMagnets = Array.from(
      modalElement.querySelectorAll(
        ".nyaa-checkbox:checked:not(#nyaa-select-all)",
      ),
    ).map((cb) => cb.getAttribute("data-magnet"));

    if (selectedMagnets.length > 0) {
      startDownload(selectedMagnets, animeTitle, mainBtn);
      modalElement.remove();
    }
  };
}

async function startDownload(magnets, animeTitle, mainBtn) {
  mainBtn.innerText =
    magnets.length > 1 ? "Dodawanie wielu..." : "Dodawanie...";
  mainBtn.style.backgroundColor = "";

  try {
    const res = await fetch(`${CONFIG.BASE_URL}/download-magnet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ magnets, title: animeTitle }),
    });
    const data = await res.json();
    if (res.ok) {
      mainBtn.innerText = "Pobieranie...";
      mainBtn.style.backgroundColor = CONFIG.SUCCESS_COLOR;
      startPolling(data.gids, mainBtn);
    } else {
      throw new Error(data.error);
    }
  } catch (err) {
    alert("Błąd: " + err.message);
    mainBtn.innerText = "Błąd!";
  }
}

async function startPolling(gids, btn) {
  // Jeśli dostaliśmy tylko jeden GID jako string, zamień na tablicę
  const gidList = Array.isArray(gids) ? gids : [gids];
  const lastGid = gidList[gidList.length - 1]; // Polling robimy na ostatnim dla uproszczenia, lub średniej
  const STATUS_URL = `${CONFIG.BASE_URL}/status/${lastGid}`;

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
