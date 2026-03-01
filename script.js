const container = document.getElementById('container');
const zoneViewer = document.getElementById('zoneViewer');
let zoneFrame = document.getElementById('zoneFrame');
const searchBar = document.getElementById('searchBar');
const sortOptions = document.getElementById('sortOptions');
const filterOptions = document.getElementById('filterOptions');
// https://www.jsdelivr.com/tools/purge
const zonesurls = [
    "https://cdn.jsdelivr.net/gh/%67%6e%2d%6d%61%74%68/assets@main/zones.json",
    "https://cdn.jsdelivr.net/gh/%67%6e%2d%6d%61%74%68/assets@latest/zones.json",
    "https://cdn.jsdelivr.net/gh/%67%6e%2d%6d%61%74%68/assets@master/zones.json",
    "https://cdn.jsdelivr.net/gh/%67%6e%2d%6d%61%74%68/assets/zones.json"
];
let zonesURL = zonesurls[Math.floor(Math.random() * zonesurls.length)];
const coverURL = "https://cdn.jsdelivr.net/gh/%67%6e%2d%6d%61%74%68/covers@main";
const htmlURL = "https://cdn.jsdelivr.net/gh/%67%6e%2d%6d%61%74%68/html@main";
let zones = [];
let popularityData = {};
const featuredContainer = document.getElementById('featuredZones');

// favorites + recently played
function getFavorites() {
    try { return JSON.parse(localStorage.getItem("shrimp-favorites") || "[]"); } catch { return []; }
}
function saveFavorites(favs) {
    localStorage.setItem("shrimp-favorites", JSON.stringify(favs));
}
function toggleFavorite(id) {
    let favs = getFavorites();
    if (favs.includes(id)) {
        favs = favs.filter(f => f !== id);
    } else {
        favs.push(id);
    }
    saveFavorites(favs);
    displayFavoritesSection();
}
function getRecentlyPlayed() {
    try { return JSON.parse(localStorage.getItem("shrimp-recent") || "[]"); } catch { return []; }
}
function addToRecentlyPlayed(id) {
    let recent = getRecentlyPlayed();
    recent = recent.filter(r => r !== id);
    recent.unshift(id);
    if (recent.length > 20) recent = recent.slice(0, 20);
    localStorage.setItem("shrimp-recent", JSON.stringify(recent));
}
function displayFavoritesSection() {
    const favContainer = document.getElementById("favoritesZones");
    const favWrapper = document.getElementById("favoritesWrapper");
    if (!favContainer || !favWrapper) return;
    const favIds = getFavorites();
    const favZones = favIds.map(id => zones.find(z => z.id === id || z.id + "" === id + "")).filter(Boolean);
    favContainer.innerHTML = "";
    if (favZones.length === 0) {
        favWrapper.style.display = "none";
    } else {
        favWrapper.style.display = "";
        document.getElementById("favoritesSummary").textContent = `Favorites (${favZones.length})`;
        favZones.forEach(z => favContainer.appendChild(createZoneCard(z)));
        observeLazyImages(favContainer);
    }
}
function displayRecentSection() {
    const recentContainer = document.getElementById("recentZones");
    const recentWrapper = document.getElementById("recentWrapper");
    if (!recentContainer || !recentWrapper) return;
    const recentIds = getRecentlyPlayed();
    const recentZones = recentIds.map(id => zones.find(z => z.id === id || z.id + "" === id + "")).filter(Boolean);
    recentContainer.innerHTML = "";
    if (recentZones.length === 0) {
        recentWrapper.style.display = "none";
    } else {
        recentWrapper.style.display = "";
        document.getElementById("recentSummary").textContent = `Recently Played (${recentZones.length})`;
        recentZones.forEach(z => recentContainer.appendChild(createZoneCard(z)));
        observeLazyImages(recentContainer);
    }
}

// panic button
let panicActive = false;
let prePanicTitle = "";
let prePanicFavicon = "";
let prePanicDisplay = "";
function getPanicKey() {
    return localStorage.getItem("shrimp-panic-key") || "`";
}
function togglePanic() {
    const panicScreen = document.getElementById("panicScreen");
    if (!panicScreen) return;
    if (!panicActive) {
        prePanicTitle = document.title;
        prePanicFavicon = document.querySelector("link[rel~='icon']")?.href || "";
        panicScreen.style.display = "block";
        if (zoneViewer.style.display === "block") {
            prePanicDisplay = "zone";
            zoneViewer.style.display = "none";
        } else {
            prePanicDisplay = "main";
            document.querySelector("header").style.display = "none";
            document.querySelector("main").style.display = "none";
            document.querySelector("footer").style.display = "none";
        }
        document.title = "Untitled document - Google Docs";
        const link = document.querySelector("link[rel~='icon']");
        if (link) link.href = "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico";
        panicActive = true;
    } else {
        panicScreen.style.display = "none";
        if (prePanicDisplay === "zone") {
            zoneViewer.style.display = "block";
        } else {
            document.querySelector("header").style.display = "";
            document.querySelector("main").style.display = "";
            document.querySelector("footer").style.display = "";
        }
        document.title = prePanicTitle;
        const link = document.querySelector("link[rel~='icon']");
        if (link) link.href = prePanicFavicon;
        panicActive = false;
    }
}
document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
    if (e.key === getPanicKey()) {
        e.preventDefault();
        togglePanic();
    }
});

// random game
function randomGame() {
    const playable = zones.filter(z => z.id !== -1 && !z._custom);
    if (playable.length === 0) return;
    const pick = playable[Math.floor(Math.random() * playable.length)];
    openZone(pick);
}
function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}
async function listZones() {
    try {
      showSkeletons(container, 12);
      showSkeletons(featuredContainer, 4);
      let sharesponse;
      let shajson;
      let sha;
        try {
          sharesponse = await fetch("https://api.github.com/repos/%67%6e%2d%6d%61%74%68/assets/commits?t="+Date.now());
        } catch (error) {}
        if (sharesponse && sharesponse.status === 200) {
          try {
            shajson = await sharesponse.json();
            sha = shajson[0]['sha'];
            if (sha) {
                zonesURL = `https://cdn.jsdelivr.net/gh/%67%6e%2d%6d%61%74%68/assets@${sha}/zones.json`;
            }
          } catch (error) {
            try {
                let secondarysharesponse = await fetch("https://raw.githubusercontent.com/%67%6e%2d%6d%61%74%68/xml/refs/heads/main/sha.txt?t="+Date.now());
                if (secondarysharesponse && secondarysharesponse.status === 200) {
                    sha = (await secondarysharesponse.text()).trim();
                    if (sha) {
                        zonesURL = `https://cdn.jsdelivr.net/gh/%67%6e%2d%6d%61%74%68/assets@${sha}/zones.json`;
                    }
                }
            } catch(error) {}
          }
        }
        const response = await fetch(zonesURL+"?t="+Date.now());
        const json = await response.json();
        zones = json;
        zones[0].featured = true; // always gonna be the discord
        await Promise.all([fetchPopularity("year"), fetchPopularity("month"), fetchPopularity("week"), fetchPopularity("day")]);
        sortZones();
        loadCustomGamesIntoZones();
        try {
        const search = new URLSearchParams(window.location.search);
        const id = search.get('id');
        const embed = window.location.hash.includes("embed");
        if (id) {
            const zone = zones.find(zone => zone.id + '' == id + '');
            if (zone) {
                if (embed) {
                    if (zone.url.startsWith("http")) {
                        window.open(zone.url, "_blank");
                    } else {
                        const url = zone.url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
                        fetch(url+"?t="+Date.now()).then(response => response.text()).then(html => {
                            document.documentElement.innerHTML = html;
                            const popup = document.createElement("div");
                            popup.style.position = "fixed";
                            popup.style.bottom = "20px";
                            popup.style.right = "20px";
                            popup.style.backgroundColor = "#cce5ff";
                            popup.style.color = "#004085";
                            popup.style.padding = "10px";
                            popup.style.border = "1px solid #b8daff";
                            popup.style.borderRadius = "5px";
                            popup.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.1)";
                            popup.style.fontFamily = "Arial, sans-serif";
                            
                            popup.innerHTML = `Play more games at <a href="https://gn-math.dev" target="_blank" style="color:#004085; font-weight:bold;">shrimp</a>!`;
                            
                            const closeBtn = document.createElement("button");
                            closeBtn.innerText = "?";
                            closeBtn.style.marginLeft = "10px";
                            closeBtn.style.background = "none";
                            closeBtn.style.border = "none";
                            closeBtn.style.cursor = "pointer";
                            closeBtn.style.color = "#004085";
                            closeBtn.style.fontWeight = "bold";
                            
                            closeBtn.onclick = () => popup.remove();
                            popup.appendChild(closeBtn);
                            document.body.appendChild(popup);
                            document.documentElement.querySelectorAll('script').forEach(oldScript => {
                                const newScript = document.createElement('script');
                                if (oldScript.src) {
                                    newScript.src = oldScript.src;
                                } else {
                                    newScript.textContent = oldScript.textContent;
                                }
                                document.body.appendChild(newScript);
                            });
                        }).catch(error => alert("Failed to load zone: " + error));
                    }
                } else {
                    openZone(zone);
                }
            }
        }
        } catch(error){}
        let alltags = [];
        for (const obj of json) {
            if (Array.isArray(obj.special)) {
                alltags.push(...obj.special);
            }
        }

        alltags = [...new Set(alltags)];
        let filteroption = document.getElementById("filterOptions");
        if (filteroption && filteroption.children.length > 1) {
            while (filteroption.children.length > 1) {
                filteroption.removeChild(filteroption.lastElementChild);
            }
        }
        for (const tag of alltags) {
            const opt = document.createElement("option");
            opt.value = tag;
            opt.textContent = toTitleCase(tag);
            filteroption.appendChild(opt);
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = `Error loading zones: ${error}`;
    }
}
async function fetchPopularity(duration) {
    try {
        if (!popularityData[duration]) {
            popularityData[duration] = {};
        }
        const response = await fetch(
            "https://data.jsdelivr.com/v1/stats/packages/gh/%67%6e%2d%6d%61%74%68/html@main/files?period=" + duration
        );
        const data = await response.json();
        data.forEach(file => {
            const idMatch = file.name.match(/\/(\d+)\.html$/);
            if (idMatch) {
                const id = parseInt(idMatch[1]);
                popularityData[duration][id] = file.hits?.total ?? 0;
            }
        });
    } catch (error) {
        if (!popularityData[duration]) {
            popularityData[duration] = {};
        }
        popularityData[duration][0] = 0;
    }
}


function sortZones() {
    const sortBy = sortOptions.value;
    if (sortBy === 'name') {
        zones.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'id') {
        zones.sort((a, b) => a.id - b.id);
    } else if (sortBy === 'popular') {
        zones.sort((a, b) => ((popularityData['year']?.[b.id]) ?? 0) - ((popularityData['year']?.[a.id]) ?? 0));
    } else if (sortBy === 'trendingMonth') {
        zones.sort((a, b) => ((popularityData['month']?.[b.id]) ?? 0) - ((popularityData['month']?.[a.id]) ?? 0));
    } else if (sortBy === 'trendingWeek') {
        zones.sort((a, b) => ((popularityData['week']?.[b.id]) ?? 0) - ((popularityData['week']?.[a.id]) ?? 0));
    } else if (sortBy === 'trendingDay') {
        zones.sort((a, b) => ((popularityData['day']?.[b.id]) ?? 0) - ((popularityData['day']?.[a.id]) ?? 0));
    }
    zones.sort((a, b) => (a.id === -1 ? -1 : b.id === -1 ? 1 : 0));
    if (featuredContainer.innerHTML === "") {
        const featured = zones.filter(z => z.featured);
        displayFeaturedZones(featured);
    }
    displayFavoritesSection();
    displayRecentSection();
    displayZones(zones);
}

function displayFeaturedZones(featuredZones) {
    featuredContainer.innerHTML = "";
    featuredZones.forEach((file) => {
        featuredContainer.appendChild(createZoneCard(file));
    });
    if (featuredContainer.innerHTML === "") {
        featuredContainer.innerHTML = "No featured zones found.";
    } else {
        document.getElementById("allZonesSummary").textContent = `Featured Zones (${featuredZones.length})`;
    }
    observeLazyImages(featuredContainer);
}
const categoriesContainer = document.getElementById('categoriesContainer');
const prefetchCache = {};

function createZoneCard(file) {
    const zoneItem = document.createElement("div");
    zoneItem.className = "zone-item";
    zoneItem.onclick = () => openZone(file);
    zoneItem.addEventListener("mouseenter", () => prefetchZone(file));
    const img = document.createElement("img");
    img.dataset.src = file.cover.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
    img.alt = file.name;
    img.loading = "lazy";
    img.decoding = "async";
    img.className = "lazy-zone-img";
    zoneItem.appendChild(img);
    // favorite heart
    const heart = document.createElement("span");
    heart.className = "fav-heart" + (getFavorites().includes(file.id) ? " fav-active" : "");
    heart.innerHTML = "&#9829;";
    heart.title = "Toggle favorite";
    heart.onclick = (e) => {
        e.stopPropagation();
        toggleFavorite(file.id);
        heart.classList.toggle("fav-active");
    };
    zoneItem.appendChild(heart);
    const button = document.createElement("button");
    button.textContent = file.name;
    button.onclick = (event) => {
        event.stopPropagation();
        openZone(file);
    };
    zoneItem.appendChild(button);
    return zoneItem;
}

function prefetchZone(file) {
    if (file.url.startsWith("http")) return;
    const url = file.url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
    if (prefetchCache[url]) return;
    prefetchCache[url] = fetch(url + "?t=" + Date.now()).then(r => r.text()).catch(() => null);
}

function observeLazyImages(root) {
    const lazyImages = root.querySelectorAll('img.lazy-zone-img');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !zoneViewer.hidden) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove("lazy-zone-img");
                observer.unobserve(img);
            }
        });
    }, { rootMargin: "100px", threshold: 0.1 });
    lazyImages.forEach(img => imageObserver.observe(img));
}

function renderChunked(items, parent, chunkSize) {
    let i = 0;
    function renderNext() {
        const fragment = document.createDocumentFragment();
        const end = Math.min(i + chunkSize, items.length);
        while (i < end) {
            fragment.appendChild(items[i]);
            i++;
        }
        parent.appendChild(fragment);
        if (i < items.length) {
            requestAnimationFrame(renderNext);
        } else {
            observeLazyImages(parent);
        }
    }
    renderNext();
}

function displayZones(zonesToDisplay) {
    categoriesContainer.innerHTML = "";
    container.innerHTML = "";

    // group zones by tags
    const categoryMap = {};
    const uncategorized = [];
    zonesToDisplay.forEach(file => {
        if (Array.isArray(file.special) && file.special.length > 0) {
            file.special.forEach(tag => {
                if (!categoryMap[tag]) categoryMap[tag] = [];
                categoryMap[tag].push(file);
            });
        } else {
            uncategorized.push(file);
        }
    });

    const sortedTags = Object.keys(categoryMap).sort((a, b) => a.localeCompare(b));

    // render each category
    sortedTags.forEach(tag => {
        const section = document.createElement("details");
        section.className = "category-section";
        section.open = true;
        const summary = document.createElement("summary");
        summary.textContent = `${toTitleCase(tag)} (${categoryMap[tag].length})`;
        section.appendChild(summary);
        const grid = document.createElement("div");
        grid.className = "category-grid";
        section.appendChild(grid);
        categoriesContainer.appendChild(section);

        const cards = categoryMap[tag].map(file => createZoneCard(file));
        renderChunked(cards, grid, 20);
    });

    // uncategorized goes into "other"
    if (uncategorized.length > 0) {
        const section = document.createElement("details");
        section.className = "category-section";
        section.open = true;
        const summary = document.createElement("summary");
        summary.textContent = `Other (${uncategorized.length})`;
        section.appendChild(summary);
        const grid = document.createElement("div");
        grid.className = "category-grid";
        section.appendChild(grid);
        categoriesContainer.appendChild(section);

        const cards = uncategorized.map(file => createZoneCard(file));
        renderChunked(cards, grid, 20);
    }

    // all zones flat list
    const allCards = zonesToDisplay.map(file => createZoneCard(file));
    if (allCards.length === 0) {
        container.innerHTML = "No zones found.";
    } else {
        document.getElementById("allSummary").textContent = `All Zones (${zonesToDisplay.length})`;
        renderChunked(allCards, container, 20);
    }
}

function filterZones2() {
    const query = filterOptions.value;
    if (query === "none") {
        displayZones(zones);
    } else {
        const filteredZones = zones.filter(zone => zone.special?.includes(query));
        if (query.length !== 0) {
            document.getElementById("featuredZonesWrapper").removeAttribute("open");
        }
        displayZones(filteredZones);
    }
}

function filterZones() {
    const query = searchBar.value.toLowerCase();
    const filteredZones = zones.filter(zone => zone.name.toLowerCase().includes(query));
    if (query.length !== 0) {
        document.getElementById("featuredZonesWrapper").removeAttribute("open");
    }
    displayZones(filteredZones);
}

function openZone(file) {
    if (file._custom) {
        openCustomZone(file);
        return;
    }
    addToRecentlyPlayed(file.id);
    if (file.url.startsWith("http")) {
        window.open(file.url, "_blank");
    } else {
        const url = file.url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
        const htmlPromise = prefetchCache[url] || fetch(url+"?t="+Date.now()).then(r => r.text());
        htmlPromise.then(html => {
            if (!html) throw new Error("Empty response");
            if (zoneFrame.contentDocument === null) {
                zoneFrame = document.createElement("iframe");
                zoneFrame.id = "zoneFrame";
                zoneViewer.appendChild(zoneFrame);
            }
            zoneFrame.contentDocument.open();
            zoneFrame.contentDocument.write(html);
            zoneFrame.contentDocument.close();
            document.getElementById('zoneName').textContent = file.name;
            document.getElementById('zoneId').textContent = file.id;
            document.getElementById('zoneAuthor').textContent = "by " + file.author;
            if (file.authorLink) {
                document.getElementById('zoneAuthor').href = file.authorLink;
            }
            zoneViewer.style.display = "block";
            try {
                const url = new URL(window.location);
                url.searchParams.set('id', file.id);
                history.pushState(null, '', url.toString());
            } catch(error){}
            zoneViewer.hidden = true;
        }).catch(error => alert("Failed to load zone: " + error));
    }
}

function aboutBlank() {
    const newWindow = window.open("about:blank", "_blank");
    let zone = zones.find(zone => zone.id + '' === document.getElementById('zoneId').textContent).url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
    fetch(zone+"?t="+Date.now()).then(response => response.text()).then(html => {
        if (newWindow) {
            newWindow.document.open();
            newWindow.document.write(html);
            newWindow.document.close();
        }
    })
}

function closeZone() {
    zoneViewer.hidden = false;
    zoneViewer.style.display = "none";
    zoneViewer.removeChild(zoneFrame);
    try {
    const url = new URL(window.location);
    url.searchParams.delete('id');
    history.pushState(null, '', url.toString());
    } catch(error){}
}

function downloadZone() {
    let zone = zones.find(zone => zone.id + '' === document.getElementById('zoneId').textContent);
    fetch(zone.url.replace("{HTML_URL}", htmlURL)+"?t="+Date.now()).then(res => res.text()).then(text => {
        const blob = new Blob([text], {
            type: "text/plain;charset=utf-8"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = zone.name + ".html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

function fullscreenZone() {
    if (zoneFrame.requestFullscreen) {
        zoneFrame.requestFullscreen();
    } else if (zoneFrame.mozRequestFullScreen) {
        zoneFrame.mozRequestFullScreen();
    } else if (zoneFrame.webkitRequestFullscreen) {
        zoneFrame.webkitRequestFullscreen();
    } else if (zoneFrame.msRequestFullscreen) {
        zoneFrame.msRequestFullscreen();
    }
}

function sanitizeData(obj, maxStringLen = 1000, maxArrayLen = 10000) {
    if (typeof obj === 'string') {
      return obj.length > maxStringLen ? obj.slice(0, maxStringLen) + '...[truncated]' : obj;
    }
    
    if (obj instanceof Uint8Array) {
      if (obj.length > maxArrayLen) {
        return `[Uint8Array too large (${obj.length} bytes), truncated]`;
      }
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeData(item, maxStringLen, maxArrayLen));
    }
    
    if (obj && typeof obj === 'object') {
      const newObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          newObj[key] = sanitizeData(obj[key], maxStringLen, maxArrayLen);
        }
      }
      return newObj;
    }
    
    return obj;
  }

async function saveData() {
    alert("This might take a while, dont touch anything other than this OK button");
    const result = {};
    result.cookies = document.cookie;
    result.localStorage = {...localStorage};
    result.sessionStorage = {...sessionStorage};
    result.indexedDB = {};
    const dbs = await indexedDB.databases();
    for (const dbInfo of dbs) {
      if (!dbInfo.name) continue;
      result.indexedDB[dbInfo.name] = {};
      await new Promise((resolve, reject) => {
        const openRequest = indexedDB.open(dbInfo.name, dbInfo.version);
        openRequest.onerror = () => reject(openRequest.error);
        openRequest.onsuccess = () => {
          const db = openRequest.result;
          const storeNames = Array.from(db.objectStoreNames);
          if (storeNames.length === 0) {
            resolve();
            return;
          }
          const transaction = db.transaction(storeNames, "readonly");
          const storePromises = [];
          for (const storeName of storeNames) {
            result.indexedDB[dbInfo.name][storeName] = [];
            const store = transaction.objectStore(storeName);
            const getAllRequest = store.getAll();
            const p = new Promise((res, rej) => {
              getAllRequest.onsuccess = () => {
                result.indexedDB[dbInfo.name][storeName] = sanitizeData(getAllRequest.result, 1000, 100);
                res();
              };
              getAllRequest.onerror = () => rej(getAllRequest.error);
            });
            storePromises.push(p);
          }
          Promise.all(storePromises).then(() => resolve());
        };
      });
    }

    result.caches = {};
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      result.caches[cacheName] = [];
      for (const req of requests) {
        const response = await cache.match(req);
        if (!response) continue;
        const cloned = response.clone();
        const contentType = cloned.headers.get('content-type') || '';
        let body;
        try {
          if (contentType.includes('application/json')) {
            body = await cloned.json();
          } else if (contentType.includes('text') || contentType.includes('javascript')) {
            body = await cloned.text();
          } else {
            const buffer = await cloned.arrayBuffer();
            body = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          }
        } catch (e) {
          body = '[Unable to read body]';
        }
        result.caches[cacheName].push({
          url: req.url,
          body,
          contentType
        });
      }
    }
  
    alert("Done, wait for the download to come");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([JSON.stringify(result)], {
        type: "application/octet-stream"
    }));
    link.download = `${Date.now()}.data`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  async function loadData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function (e) {
        const data = JSON.parse(e.target.result);
        if (data.cookies) {
            data.cookies.split(';').forEach(cookie => {
              document.cookie = cookie.trim();
            });
          }
        
          if (data.localStorage) {
            for (const key in data.localStorage) {
              localStorage.setItem(key, data.localStorage[key]);
            }
          }
        
          if (data.sessionStorage) {
            for (const key in data.sessionStorage) {
              sessionStorage.setItem(key, data.sessionStorage[key]);
            }
          }
        
          if (data.indexedDB) {
            for (const dbName in data.indexedDB) {
              const stores = data.indexedDB[dbName];
              await new Promise((resolve, reject) => {
                const request = indexedDB.open(dbName, 1);
                request.onupgradeneeded = e => {
                  const db = e.target.result;
                  for (const storeName in stores) {
                    if (!db.objectStoreNames.contains(storeName)) {
                      db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                    }
                  }
                };
                request.onsuccess = e => {
                  const db = e.target.result;
                  const transaction = db.transaction(Object.keys(stores), 'readwrite');
                  transaction.onerror = () => reject(transaction.error);
                  let pendingStores = Object.keys(stores).length;
        
                  for (const storeName in stores) {
                    const objectStore = transaction.objectStore(storeName);
                    objectStore.clear().onsuccess = () => {
                      for (const item of stores[storeName]) {
                        objectStore.put(item);
                      }
                      pendingStores--;
                      if (pendingStores === 0) resolve();
                    };
                  }
                };
                request.onerror = () => reject(request.error);
              });
            }
          }
        
          if (data.caches) {
            for (const cacheName in data.caches) {
              const cache = await caches.open(cacheName);
              await cache.keys().then(keys => Promise.all(keys.map(k => cache.delete(k)))); // clear existing
        
              for (const entry of data.caches[cacheName]) {
                let responseBody;
                if (entry.contentType.includes('application/json')) {
                  responseBody = JSON.stringify(entry.body);
                } else if (entry.contentType.includes('text') || entry.contentType.includes('javascript')) {
                  responseBody = entry.body;
                } else {
                  const binaryStr = atob(entry.body);
                  const len = binaryStr.length;
                  const bytes = new Uint8Array(len);
                  for (let i = 0; i < len; i++) {
                    bytes[i] = binaryStr.charCodeAt(i);
                  }
                  responseBody = bytes.buffer;
                }
                const headers = new Headers({ 'content-type': entry.contentType });
                const response = new Response(responseBody, { headers });
                await cache.put(entry.url, response);
              }
            }
          }
        alert("Data loaded");
    };
    alert("This might take a while, dont touch anything other than this OK button");
    reader.readAsText(file);
  }

function darkMode() {
    document.body.classList.toggle("dark-mode");
}

function cloakIcon(url) {
    const link = document.querySelector("link[rel~='icon']");
    link.rel = "icon";
    if ((url+"").trim().length === 0) {
        link.href = "favicon.svg";
    } else {
        link.href = url;
    }
    document.head.appendChild(link);
}
function cloakName(string) {
    if ((string+"").trim().length === 0) {
        document.title = "shrimp";
        return;
    }
    document.title = string;
}

function tabCloak() {
    closePopup();
    document.getElementById('popupTitle').textContent = "Tab Cloak";
    const popupBody = document.getElementById('popupBody');
    popupBody.innerHTML = `
        <label for="tab-cloak-textbox" style="font-weight: bold;">Set Tab Title:</label><br>
        <input type="text" id="tab-cloak-textbox" placeholder="Enter new tab name..." oninput="cloakName(this.value)">
        <br><br><br><br>
        <label for="tab-cloak-textbox" style="font-weight: bold;">Set Tab Icon:</label><br>
        <input type="text" id="tab-cloak-textbox" placeholder="Enter new tab icon..." oninput='cloakIcon(this.value)'>
        <br><br><br>
    `;
    popupBody.contentEditable = false;
    document.getElementById('popupOverlay').style.display = "flex";
}

const settings = document.getElementById('settings');
const settingsSidebarItems = [
    { key: 'appearance', label: 'Appearance', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>' },
    { key: 'tools', label: 'Tools', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>' },
    { key: 'games', label: 'Custom Games', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>' },
    { key: 'hacks', label: 'School Hacks', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' },
    { key: 'panic', label: 'Panic Button', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
    { key: 'about', label: 'About', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' },
];

function openSettingsToPanel(key) {
    openSettingsPopup(key);
}

function openSettingsPopup(activeKey) {
    activeKey = activeKey || 'appearance';
    document.getElementById('popupTitle').textContent = "Settings";
    const popup = document.querySelector('.popup');
    popup.classList.add('popup-wide');
    const popupBody = document.getElementById('popupBody');
    popupBody.style.padding = '0';
    popupBody.contentEditable = false;

    let sidebarHTML = '<div class="settings-sidebar">';
    settingsSidebarItems.forEach(item => {
        sidebarHTML += `<button class="settings-sidebar-item${item.key === activeKey ? ' active' : ''}" data-key="${item.key}" onclick="switchSettingsPanel('${item.key}')">${item.icon}<span>${item.label}</span></button>`;
    });
    sidebarHTML += '</div>';

    popupBody.innerHTML = `<div class="settings-layout">${sidebarHTML}<div class="settings-content" id="settingsContent"></div></div>`;
    renderSettingsPanel(activeKey);
    document.getElementById('popupOverlay').style.display = "flex";
}

function switchSettingsPanel(key) {
    document.querySelectorAll('.settings-sidebar-item').forEach(el => {
        el.classList.toggle('active', el.dataset.key === key);
    });
    renderSettingsPanel(key);
}

function renderSettingsPanel(key) {
    const content = document.getElementById('settingsContent');
    if (!content) return;
    content.innerHTML = '';
    content.style.animation = 'none';
    content.offsetHeight; // trigger reflow
    content.style.animation = '';

    switch(key) {
        case 'appearance': renderAppearancePanel(content); break;
        case 'tools': renderToolsPanel(content); break;
        case 'games': renderGamesPanel(content); break;
        case 'hacks': renderHacksPanel(content); break;
        case 'panic': renderPanicPanel(content); break;
        case 'about': renderAboutPanel(content); break;
    }
}

function renderAppearancePanel(el) {
    el.innerHTML = `
        <h3>Appearance</h3>
        <div class="settings-toggle-row">
            <div>
                <div class="settings-toggle-label">Dark Mode</div>
                <div class="settings-toggle-desc">Switch between light and dark themes</div>
            </div>
            <button class="settings-toggle-btn" onclick="darkMode()">Toggle</button>
        </div>
        <div class="settings-toggle-row">
            <div>
                <div class="settings-toggle-label">Tab Cloak</div>
                <div class="settings-toggle-desc">Disguise the tab name and icon</div>
            </div>
            <button class="settings-toggle-btn" onclick="tabCloak()">Configure</button>
        </div>
    `;
}

function renderToolsPanel(el) {
    el.innerHTML = `
        <h3>Tools</h3>
        <p style="margin-bottom:16px;">Built-in utilities to help you study and stay productive.</p>
        <div class="tools-grid">
            <div class="tool-card" onclick="openCalculator()">
                <div class="tool-icon" style="font-size:2rem">&#128290;</div>
                <div class="tool-name">Calculator</div>
            </div>
            <div class="tool-card" onclick="openNotes()">
                <div class="tool-icon" style="font-size:2rem">&#128221;</div>
                <div class="tool-name">Notes</div>
            </div>
            <div class="tool-card" onclick="openTimer()">
                <div class="tool-icon" style="font-size:2rem">&#9201;</div>
                <div class="tool-name">Pomodoro</div>
            </div>
            <div class="tool-card" onclick="openAIHelper()">
                <div class="tool-icon" style="font-size:2rem">&#129302;</div>
                <div class="tool-name">AI Helper</div>
            </div>
        </div>
    `;
}

function renderGamesPanel(el) {
    el.innerHTML = `
        <h3>Custom Games</h3>
        <p style="margin-bottom:16px;">Add your own games by uploading a zip or pasting a URL.</p>
        <div class="settings-toggle-row">
            <div>
                <div class="settings-toggle-label">Add a Game</div>
                <div class="settings-toggle-desc">Upload a .zip or add a link to a web game</div>
            </div>
            <button class="settings-toggle-btn" onclick="openAddGame()">Add</button>
        </div>
        <div class="settings-toggle-row">
            <div>
                <div class="settings-toggle-label">Manage Games</div>
                <div class="settings-toggle-desc">View and delete your custom games</div>
            </div>
            <button class="settings-toggle-btn" onclick="manageCustomGames()">Manage</button>
        </div>
    `;
}

function renderHacksPanel(el) {
    const platforms = {
        kahoot: {
            name: "Kahoot",
            cheats: [
                { name: "Answer Revealer", desc: "Shows the correct answer highlighted on your screen during a Kahoot game.", bookmarklet: "javascript:void(function(){let s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/jokob-sk/Kahoot-Hack@master/kahoot-hack.js';document.head.appendChild(s)}())" },
                { name: "Kahoot Flooder (GitHub)", desc: "Flood a Kahoot game with bots. Opens the popular GitHub tool.", link: "https://github.com/unixpickle/kahoot-hack" }
            ]
        },
        blooket: {
            name: "Blooket",
            cheats: [
                { name: "Auto Answer", desc: "Automatically answers questions correctly in Blooket games.", bookmarklet: "javascript:void(document.querySelectorAll('[class*=\"answerContainer\"]').forEach(function(el){el.click()}))" },
                { name: "Blooket Hacks (GitHub)", desc: "Full collection of Blooket cheats - tokens, auto-answer, and more.", link: "https://github.com/glixzzy/blooket-hack" }
            ]
        },
        gimkit: {
            name: "Gimkit",
            cheats: [
                { name: "Auto Answer", desc: "Highlights and auto-selects the correct answer in Gimkit.", bookmarklet: "javascript:void(function(){setInterval(function(){try{document.querySelectorAll('button').forEach(function(b){if(b.dataset&&b.dataset.correct==='true')b.click()})}catch{}},500)}())" },
                { name: "Gimkit Hacks (GitHub)", desc: "Collection of Gimkit scripts and tools.", link: "https://github.com/Topics/gimkit-hack" }
            ]
        },
        quizizz: {
            name: "Quizizz",
            cheats: [
                { name: "Answer Revealer", desc: "Reveals all correct answers in Quizizz quizzes.", bookmarklet: "javascript:void(function(){let s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/gbaranski/quizizz-cheat@master/dist/bundle.js';document.head.appendChild(s)}())" },
                { name: "Quizizz Cheat (GitHub)", desc: "Feature-rich Quizizz answer bot.", link: "https://github.com/gbaranski/quizizz-cheat" }
            ]
        },
        edpuzzle: {
            name: "Edpuzzle",
            cheats: [
                { name: "Skip Video", desc: "Skips to the end of Edpuzzle videos and auto-completes them.", bookmarklet: "javascript:void(function(){let v=document.querySelector('video');if(v){v.currentTime=v.duration;v.playbackRate=16}}())" },
                { name: "Edpuzzle Answers (GitHub)", desc: "Reveals answers to Edpuzzle questions.", link: "https://github.com/ading2210/edpuzzle-answers" }
            ]
        }
    };

    const keys = Object.keys(platforms);
    let tabs = '<div class="cheats-tabs">';
    keys.forEach((k, i) => {
        tabs += `<button class="cheats-tab${i===0?' active':''}" onclick="switchCheatTab('${k}')">${platforms[k].name}</button>`;
    });
    tabs += '</div>';

    let panels = '';
    keys.forEach((k, i) => {
        panels += `<div id="cheatPanel_${k}" style="${i>0?'display:none':''}">`;
        platforms[k].cheats.forEach(c => {
            panels += `<div class="cheat-item"><h4>${c.name}</h4><p>${c.desc}</p>`;
            if (c.bookmarklet) {
                panels += `<button class="copy-btn" onclick="navigator.clipboard.writeText('${c.bookmarklet.replace(/'/g,"\\'")}');this.textContent='Copied!';setTimeout(()=>this.textContent='Copy Bookmarklet',1500)">Copy Bookmarklet</button>`;
                panels += ` <span style="font-size:11px;color:var(--text-light);margin-left:8px;">paste into address bar or save as bookmark</span>`;
            }
            if (c.link) {
                panels += `<a href="${c.link}" target="_blank" class="copy-btn" style="text-decoration:none;display:inline-block;">Open GitHub</a>`;
            }
            panels += `</div>`;
        });
        panels += '</div>';
    });

    el.innerHTML = `
        <h3>School Hacks</h3>
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:12px; padding:8px 12px; background:var(--bg-secondary); border-radius:var(--radius-sm); border:1px solid var(--border);">
            Use at your own risk. These are publicly available tools from GitHub. shrimp doesn't guarantee they work or are safe.
        </p>
        ${tabs}
        ${panels}
        <h4 style="margin-top:16px;">How to use bookmarklets:</h4>
        <ol style="font-size:13px; color:var(--text-muted); padding-left:20px; line-height:1.8;">
            <li>Click "Copy Bookmarklet" to copy the code</li>
            <li>Go to the game site (e.g. kahoot.it)</li>
            <li>Click the address bar and type <code>javascript:</code></li>
            <li>Paste the copied code after it and press Enter</li>
            <li>Or: create a new bookmark and paste the code as the URL</li>
        </ol>
    `;
}

function renderPanicPanel(el) {
    el.innerHTML = `
        <h3>Panic Button</h3>
        <p style="margin-bottom:20px;">Instantly disguise this page as Google Docs when you press the panic key. Everything hides and a fake document appears.</p>
        <div class="settings-toggle-row">
            <div>
                <div class="settings-toggle-label">Panic Key</div>
                <div class="settings-toggle-desc">Press this key to instantly hide everything</div>
            </div>
            <input type="text" id="panicKeyInput" value="${getPanicKey()}" maxlength="1" style="width:50px; text-align:center; padding:8px; border:1px solid var(--border); border-radius:var(--radius-sm); background:var(--bg-secondary); color:var(--text); font-size:16px; font-weight:700;" oninput="localStorage.setItem('shrimp-panic-key', this.value || '\`')">
        </div>
        <div style="margin-top:16px; padding:12px; background:var(--bg-secondary); border-radius:var(--radius-sm); border:1px solid var(--border);">
            <p style="font-size:13px; color:var(--text-muted); margin:0;">
                <strong>How it works:</strong> Press the <kbd style="background:var(--surface-hover); padding:2px 6px; border-radius:4px; font-family:monospace; border:1px solid var(--border);">${getPanicKey()}</kbd> key anywhere on the site. The page will instantly switch to a fake Google Docs page. Press it again to return.
            </p>
        </div>
    `;
}

function renderAboutPanel(el) {
    el.innerHTML = `
        <h3>About shrimp</h3>
        <h4 style="margin:16px 0 8px;">why shrimp?</h4>
        <p style="line-height:1.7;">
            shrimp was built because every other unblocked games site is bloated, slow, covered in ads, and looks like it was made in 2012.
            we wanted something <strong>fast</strong>, <strong>clean</strong>, and <strong>actually useful</strong> for students who need a break.
        </p>
        <h4 style="margin:20px 0 8px;">what makes shrimp different</h4>
        <ul style="color:var(--text-muted); line-height:1.8; padding-left:20px; font-size:14px;">
            <li><strong>disguise system</strong> — login page looks like khan academy, google classroom, canvas, or desmos</li>
            <li><strong>panic button</strong> — instantly switch to a fake google docs page</li>
            <li><strong>built-in tools</strong> — calculator, notes, timer, AI helper</li>
            <li><strong>school hacks</strong> — bookmarklets for kahoot, blooket, gimkit, and more</li>
            <li><strong>favorites & history</strong> — save and track your games</li>
            <li><strong>custom games</strong> — upload your own games via zip or url</li>
            <li><strong>offline support</strong> — service worker caches everything</li>
            <li><strong>no ads in the UI</strong> — clean, minimal design</li>
        </ul>
        <h4 style="margin:20px 0 8px;">quick launch bookmarklet</h4>
        <p style="line-height:1.7; margin-bottom:8px; font-size:14px;">
            drag this link to your bookmarks bar to instantly open shrimp in a clean tab:
        </p>
        <a href="javascript:void(function(){var w=window.open('about:blank','_blank');w.document.write('<html><head><title>Google Docs</title></head><body style=\\'margin:0\\'><iframe src=\\''+location.origin+'/main.html\\' style=\\'width:100%;height:100vh;border:none\\'></iframe></body></html>');w.document.close()}())" style="display:inline-block; background:var(--gradient-primary); color:white; padding:10px 20px; border-radius:var(--radius); text-decoration:none; font-weight:600; font-size:14px; margin-bottom:8px;">
            shrimp launcher
        </a>
        <p style="color:var(--text-light); font-size:12px;">tip: drag the button above to your bookmarks bar</p>
        <hr style="border:none; border-top:1px solid var(--border); margin:20px 0;">
        <p style="color:var(--text-light); font-size:12px;">shrimp v2.0 &middot; built with love and javascript</p>
    `;
}

// keep closePopup cleanup for the wide class
const _origClosePopup = closePopup;
closePopup = function() {
    const popup = document.querySelector('.popup');
    if (popup) popup.classList.remove('popup-wide');
    const popupBody = document.getElementById('popupBody');
    if (popupBody) popupBody.style.padding = '';
    _origClosePopup();
};

settings.addEventListener('click', () => {
    openSettingsPopup('appearance');
});


function showContact() {
    document.getElementById('popupTitle').textContent = "Contact";
    const popupBody = document.getElementById('popupBody');
    popupBody.innerHTML = `
    <p>Discord: https://discord.gg/NAFw4ykZ7n</p>
    <p>Email: gn.math.business@gmail.com</p>`;
    popupBody.contentEditable = false;
    document.getElementById('popupOverlay').style.display = "flex";
}

function loadPrivacy() {
    document.getElementById('popupTitle').textContent = "Privacy Policy";
    const popupBody = document.getElementById('popupBody');
    popupBody.innerHTML = `
        <div style="max-height: 60vh; overflow-y: auto;">
            <h2>PRIVACY POLICY</h2>
            <p>Last updated Feburary 20, 2026</p>
            <p>This Privacy Notice for shrimp ("we," "us," or "our"), describes how and why we might access, collect, store, use, and/or share ("process") your personal information when you use our services ("Services"), including when you:</p>
            <ul>
                <li>Visit our website at <a href="https://gn-math.dev">https://gn-math.dev</a>, or any website of ours that links to this Privacy Notice</li>
                <li>Engage with us in other related ways, including any sales, marketing, or events</li>
            </ul>
            <p>Questions or concerns? Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <a href="https://discord.gg/NAFw4ykZ7n">https://discord.gg/NAFw4ykZ7n</a>.</p>
            
            <h3>SUMMARY OF KEY POINTS</h3>
            <p>This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by clicking the link following each key point or by using our table of contents below to find the section you are looking for.</p>
            
            <p><strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use. Learn more about personal information you disclose to us.</p>
            
            <p><strong>Do we process any sensitive personal information?</strong> Some of the information may be considered "special" or "sensitive" in certain jurisdictions, for example your racial or ethnic origins, sexual orientation, and religious beliefs. We do not process sensitive personal information.</p>
            
            <p><strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.</p>
            
            <p><strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so. Learn more about how we process your information.</p>
            
            <p><strong>In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific third parties. Learn more about when and with whom we share your personal information.</p>
            
            <p><strong>How do we keep your information safe?</strong> We have adequate organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Learn more about how we keep your information safe.</p>
            
            <p><strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information. Learn more about your privacy rights.</p>
            
            <p><strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by submitting a data subject access request, or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.</p>
        </div>
    `;
    popupBody.contentEditable = false;
    document.getElementById('popupOverlay').style.display = "flex";
}

function loadDMCA() {
    document.getElementById('popupTitle').textContent = "DMCA";
    const popupBody = document.getElementById('popupBody');
    popupBody.innerHTML = `
        <div class="dmca-content">
            <p>
                If you own or developed a game that is on <strong>shrimp</strong>
                and would like it removed, please do one of the following:
            </p>
            <ol>
                <li>
                    <a href="https://discord.gg/D4c9VFYWyU" target="_blank" rel="noopener noreferrer">
                        Join the Discord
                    </a> and DM <strong>breadbb</strong> or ping me in a public channel 
                    <strong>[INSTANT RESPONSE]</strong>
                </li>
                <li>
                    Email me at 
                    <a href="mailto:gn.math.business@gmail.com">gn.math.business@gmail.com</a> 
                    with the subject starting with <code>!DMCA</code>.
                    <strong>[DELAYED RESPONSE]</strong>
                </li>
            </ol>
            <p>
                If you are going to do an email, please show proof you own the game before I have to ask.
            </p>
        </div>
    `;
    popupBody.contentEditable = false;
    document.getElementById('popupOverlay').style.display = "flex";
}

let _allStatsCache = null;

async function getAllStats() {
  if (_allStatsCache) {
    return _allStatsCache;
  }

  const BASE_URL =
    "https://data.jsdelivr.com/v1/stats/packages/gh/%67%6e%2d%6d%61%74%68/html@main/files";
  const PERIOD = "year";
  const PAGE_BATCH = 5;

  let page = 1;
  let done = false;
  const combinedMap = Object.create(null);

  while (!done) {
    const pages = Array.from({ length: PAGE_BATCH }, (_, i) => page + i);

    const responses = await Promise.all(
      pages.map(p =>
        fetch(`${BASE_URL}?period=${PERIOD}&page=${p}&limit=100`)
          .then(r => (r.ok ? r.json() : []))
      )
    );

    for (const data of responses) {
      if (!Array.isArray(data) || data.length === 0) {
        done = true;
        break;
      }

      for (const item of data) {
        if (!item?.name) continue;

        const match = item.name.match(/^\/(\d+)([.-])/);
        if (!match) continue;

        const id = match[1];

        if (!combinedMap[id]) {
          combinedMap[id] = {
            hits: 0,
            bandwidth: 0
          };
        }

        combinedMap[id].hits += item.hits?.total ?? 0;
        combinedMap[id].bandwidth += item.bandwidth?.total ?? 0;
      }
    }

    page += PAGE_BATCH;
  }

  _allStatsCache = combinedMap;
  return combinedMap;
}

async function getStats(id) {
  id = String(id);
  const allStats = await getAllStats();

  return allStats[id]?.hits ?? 0;
}

function showZoneInfo() {
    let id = Number(document.getElementById('zoneId').textContent);
    document.getElementById('popupTitle').textContent = "Info";
    const popupBody = document.getElementById('popupBody');
    popupBody.innerHTML = `<p>Loading...</p>`
    popupBody.contentEditable = false;
    document.getElementById('popupOverlay').style.display = "flex";
    fetch(`https://api.github.com/repos/%67%6e%2d%6d%61%74%68/html/commits?path=${id}.html`).then(res => res.json()).then(async json => {
        let stats = await getStats (id);
        idjson = zones.filter(a=>a.id===id)[0]
        document.getElementById('popupTitle').textContent = `${idjson.name} Info`;
        const date = new Date(json.at(-1).commit.author.date);
        let formatteddate = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true
}).format(date);
        popupBody.innerHTML = `
        <p>
        <b>Id</b>: ${id}<br>
        <b>Name</b>: ${idjson.name}<br>
        ${idjson.author?`<b>Game Author</b>: ${idjson.author}<br>`:""}
        ${idjson.authorLink?`<b>Game Author Link</b>: <a style="color:#FFFF00;" href=${idjson.authorLink}>${idjson.authorLink}</a><br>`:""}
        ${idjson.special?`<b>Tags</b>: ${idjson.special}<br>`:""}
        <b>shrimp adder</b>: ${json.at(-1).commit.author.name}<br>
        <b>Date Added</b>: ${formatteddate}<br>
        <b>Times Played (Globally)</b>: ${Number(stats).toLocaleString("en-US")}
        </p>`;
    })
}

function closePopup() {
    document.getElementById('popupOverlay').style.display = "none";
}

// custom game upload plugin
const CUSTOM_DB_NAME = "shrimp-custom-games";
const CUSTOM_STORE_NAME = "games";

function openCustomDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(CUSTOM_DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(CUSTOM_STORE_NAME)) {
                db.createObjectStore(CUSTOM_STORE_NAME, { keyPath: "id" });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getCustomGames() {
    const db = await openCustomDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CUSTOM_STORE_NAME, "readonly");
        const store = tx.objectStore(CUSTOM_STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function saveCustomGame(game) {
    const db = await openCustomDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CUSTOM_STORE_NAME, "readwrite");
        const store = tx.objectStore(CUSTOM_STORE_NAME);
        store.put(game);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function deleteCustomGame(id) {
    const db = await openCustomDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(CUSTOM_STORE_NAME, "readwrite");
        const store = tx.objectStore(CUSTOM_STORE_NAME);
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

function openAddGame() {
    closePopup();
    document.getElementById('popupTitle').textContent = "add custom game";
    const popupBody = document.getElementById('popupBody');
    popupBody.innerHTML = `
        <p style="color:var(--text-muted); font-size:14px; margin-bottom:16px;">
            add a game by uploading a .zip or by pasting a link to a web game.
        </p>
        <label style="font-weight:bold;">game name:</label><br>
        <input type="text" id="customGameName" placeholder="my game">

        <div style="display:flex; gap:8px; margin-bottom:12px;">
            <button class="settings-button" style="flex:1; min-width:0;" id="tabZip" onclick="switchAddTab('zip')">upload zip</button>
            <button class="settings-button" style="flex:1; min-width:0; opacity:0.5;" id="tabUrl" onclick="switchAddTab('url')">add by url</button>
        </div>

        <div id="addZipPanel">
            <p style="color:var(--text-muted); font-size:13px; margin-bottom:8px;">
                zip must contain an index.html at the root. supports html, js, css, wasm, and assets.
            </p>
            <input type="file" id="customGameFile" accept=".zip">
            <br><br>
            <button class="settings-button" onclick="uploadCustomGame()">upload & add</button>
        </div>

        <div id="addUrlPanel" style="display:none;">
            <p style="color:var(--text-muted); font-size:13px; margin-bottom:8px;">
                paste a direct link to a playable web game (html5, itch.io embed, etc).
            </p>
            <input type="text" id="customGameUrl" placeholder="https://example.com/game">
            <br><br>
            <button class="settings-button" onclick="addGameByUrl()">add game</button>
        </div>
    `;
    popupBody.contentEditable = false;
    document.getElementById('popupOverlay').style.display = "flex";
}

function switchAddTab(tab) {
    const zipPanel = document.getElementById("addZipPanel");
    const urlPanel = document.getElementById("addUrlPanel");
    const tabZip = document.getElementById("tabZip");
    const tabUrl = document.getElementById("tabUrl");
    if (tab === "zip") {
        zipPanel.style.display = "block";
        urlPanel.style.display = "none";
        tabZip.style.opacity = "1";
        tabUrl.style.opacity = "0.5";
    } else {
        zipPanel.style.display = "none";
        urlPanel.style.display = "block";
        tabZip.style.opacity = "0.5";
        tabUrl.style.opacity = "1";
    }
}

async function addGameByUrl() {
    const name = document.getElementById("customGameName").value.trim();
    const url = document.getElementById("customGameUrl").value.trim();

    if (!name) return alert("please enter a game name.");
    if (!url) return alert("please enter a game url.");

    try {
        new URL(url);
    } catch {
        return alert("please enter a valid url (including https://).");
    }

    const gameId = "custom_" + Date.now();
    await saveCustomGame({
        id: gameId,
        name: name,
        html: null,
        externalUrl: url,
        files: {},
        baseDir: "",
        dateAdded: Date.now()
    });

    closePopup();
    alert("game added! it will appear in the 'my games' category.");
    loadCustomGamesIntoZones();
}

async function uploadCustomGame() {
    const nameInput = document.getElementById("customGameName");
    const fileInput = document.getElementById("customGameFile");
    const name = nameInput.value.trim();
    const file = fileInput.files[0];

    if (!name) return alert("please enter a game name.");
    if (!file) return alert("please select a zip file.");

    try {
        const JSZip = (await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm")).default;
        const zip = await JSZip.loadAsync(file);

        // find index.html
        let indexEntry = zip.file("index.html");
        if (!indexEntry) {
            // check one level deep
            const files = Object.keys(zip.files);
            const nested = files.find(f => f.endsWith("/index.html") && f.split("/").length === 2);
            if (nested) {
                indexEntry = zip.file(nested);
            }
        }
        if (!indexEntry) return alert("no index.html found in the zip root.");

        // extract all files into a map of name -> base64 data URLs
        const fileMap = {};
        const entries = Object.entries(zip.files);
        for (const [path, entry] of entries) {
            if (entry.dir) continue;
            const data = await entry.async("uint8array");
            const ext = path.split(".").pop().toLowerCase();
            const mimeMap = {
                html: "text/html", htm: "text/html",
                js: "application/javascript", mjs: "application/javascript",
                css: "text/css",
                json: "application/json",
                wasm: "application/wasm",
                png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
                gif: "image/gif", svg: "image/svg+xml", webp: "image/webp",
                mp3: "audio/mpeg", ogg: "audio/ogg", wav: "audio/wav",
                mp4: "video/mp4", webm: "video/webm",
                woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf",
                txt: "text/plain", xml: "text/xml",
            };
            const mime = mimeMap[ext] || "application/octet-stream";
            const blob = new Blob([data], { type: mime });
            fileMap[path] = URL.createObjectURL(blob);
        }

        // read index.html and rewrite relative paths to blob URLs
        let html = await indexEntry.async("text");

        // get the base directory of index.html
        const indexPath = indexEntry.name;
        const baseDir = indexPath.includes("/") ? indexPath.substring(0, indexPath.lastIndexOf("/") + 1) : "";

        // store for later use
        const gameId = "custom_" + Date.now();
        await saveCustomGame({
            id: gameId,
            name: name,
            html: html,
            files: fileMap,
            baseDir: baseDir,
            dateAdded: Date.now()
        });

        closePopup();
        alert("game added! it will appear in the 'my games' category.");
        loadCustomGamesIntoZones();
    } catch (error) {
        alert("failed to process zip: " + error.message);
    }
}

async function loadCustomGamesIntoZones() {
    try {
        const customGames = await getCustomGames();
        // remove old custom zones
        zones = zones.filter(z => !z._custom);

        customGames.forEach(game => {
            zones.push({
                id: game.id,
                name: game.name,
                url: game.externalUrl || ("custom:" + game.id),
                cover: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#3a3a3a"/><text x="100" y="105" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="16">' + game.name.substring(0, 12) + '</text></svg>'),
                author: "you",
                special: ["my games"],
                _custom: true,
                _gameData: game
            });
        });

        sortZones();
    } catch (error) {
        console.error("failed to load custom games:", error);
    }
}

function openCustomZone(file) {
    const game = file._gameData;
    if (!game) return;

    if (game.externalUrl) {
        window.open(game.externalUrl, "_blank");
        return;
    }

    if (zoneFrame.contentDocument === null) {
        zoneFrame = document.createElement("iframe");
        zoneFrame.id = "zoneFrame";
        zoneViewer.appendChild(zoneFrame);
    }
    zoneFrame.contentDocument.open();
    zoneFrame.contentDocument.write(game.html);
    zoneFrame.contentDocument.close();
    document.getElementById('zoneName').textContent = file.name;
    document.getElementById('zoneId').textContent = file.id;
    document.getElementById('zoneAuthor').textContent = "by you";
    zoneViewer.style.display = "block";
    zoneViewer.hidden = true;
}

async function manageCustomGames() {
    closePopup();
    document.getElementById('popupTitle').textContent = "manage custom games";
    const popupBody = document.getElementById('popupBody');
    popupBody.innerHTML = "<p>loading...</p>";
    popupBody.contentEditable = false;
    document.getElementById('popupOverlay').style.display = "flex";

    try {
        const games = await getCustomGames();
        if (games.length === 0) {
            popupBody.innerHTML = "<p>no custom games yet. add one from settings.</p>";
            return;
        }
        let html = "";
        games.forEach(game => {
            html += `<div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border);">
                <span style="font-weight:600;">${game.name}</span>
                <button class="settings-button" style="min-width:auto; width:auto; padding:6px 16px; font-size:13px;" onclick="removeCustomGame('${game.id}')">delete</button>
            </div>`;
        });
        popupBody.innerHTML = html;
    } catch (error) {
        popupBody.innerHTML = "<p>error loading games.</p>";
    }
}

async function removeCustomGame(id) {
    await deleteCustomGame(id);
    zones = zones.filter(z => z.id !== id);
    sortZones();
    manageCustomGames();
}
listZones();

HTMLCanvasElement.prototype.toDataURL = function (...args) {
    return "";
};

// debounced search
let _searchTimer = null;
function debouncedFilter() {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(filterZones, 150);
}

// scroll to top button
window.addEventListener("scroll", () => {
    const btn = document.getElementById("scrollTop");
    if (!btn) return;
    if (window.scrollY > 400) {
        btn.classList.add("visible");
    } else {
        btn.classList.remove("visible");
    }
});

// loading skeletons
function showSkeletons(parent, count) {
    parent.innerHTML = "";
    for (let i = 0; i < count; i++) {
        const sk = document.createElement("div");
        sk.className = "skeleton skeleton-card";
        parent.appendChild(sk);
    }
}

function openToolInViewer(name, html) {
    closePopup();
    if (zoneFrame.contentDocument === null) {
        zoneFrame = document.createElement("iframe");
        zoneFrame.id = "zoneFrame";
        zoneViewer.appendChild(zoneFrame);
    }
    zoneFrame.contentDocument.open();
    zoneFrame.contentDocument.write(html);
    zoneFrame.contentDocument.close();
    document.getElementById('zoneName').textContent = name;
    document.getElementById('zoneId').textContent = "";
    document.getElementById('zoneAuthor').textContent = "shrimp tools";
    document.getElementById('zoneAuthor').href = "#";
    zoneViewer.style.display = "block";
    zoneViewer.hidden = true;
}

// scientific calculator
function openCalculator() {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0f172a;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.calc{background:#1e293b;border-radius:16px;padding:24px;width:100%;max-width:380px;box-shadow:0 20px 40px rgba(0,0,0,0.4)}
.display{background:#0f172a;border-radius:12px;padding:20px;margin-bottom:16px;text-align:right;min-height:90px;display:flex;flex-direction:column;justify-content:flex-end}
.expr{font-size:14px;color:#94a3b8;margin-bottom:4px;word-break:break-all;min-height:20px}
.result{font-size:32px;font-weight:700;word-break:break-all}
.buttons{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.btn{padding:16px 8px;border:none;border-radius:10px;font-size:16px;font-weight:600;cursor:pointer;transition:all 0.15s ease;text-align:center}
.btn:active{transform:scale(0.95)}
.num{background:#334155;color:#f1f5f9}.num:hover{background:#475569}
.op{background:#3b82f6;color:#fff}.op:hover{background:#2563eb}
.fn{background:#1e293b;color:#94a3b8;border:1px solid #334155}.fn:hover{background:#334155;color:#f1f5f9}
.eq{background:#10b981;color:#fff}.eq:hover{background:#059669}
.clear{background:#ef4444;color:#fff}.clear:hover{background:#dc2626}
.history{margin-top:16px;max-height:120px;overflow-y:auto;font-size:12px;color:#64748b}
.history div{padding:4px 0;border-bottom:1px solid #1e293b}
</style></head><body>
<div class="calc">
<div class="display"><div class="expr" id="expr"></div><div class="result" id="result">0</div></div>
<div class="buttons">
<button class="btn fn" onclick="fn('sin(')">sin</button>
<button class="btn fn" onclick="fn('cos(')">cos</button>
<button class="btn fn" onclick="fn('tan(')">tan</button>
<button class="btn fn" onclick="fn('log(')">log</button>
<button class="btn fn" onclick="fn('ln(')">ln</button>
<button class="btn fn" onclick="fn('sqrt(')">√</button>
<button class="btn fn" onclick="fn('pow(')">x^y</button>
<button class="btn fn" onclick="fn('PI')">π</button>
<button class="btn fn" onclick="fn('E')">e</button>
<button class="btn fn" onclick="input('(')">(</button>
<button class="btn clear" onclick="clearAll()">AC</button>
<button class="btn fn" onclick="backspace()">⌫</button>
<button class="btn fn" onclick="input(')')">)</button>
<button class="btn op" onclick="input('%')">%</button>
<button class="btn op" onclick="input('/')">/</button>
<button class="btn num" onclick="input('7')">7</button>
<button class="btn num" onclick="input('8')">8</button>
<button class="btn num" onclick="input('9')">9</button>
<button class="btn op" onclick="input('*')">×</button>
<button class="btn op" onclick="input('-')">-</button>
<button class="btn num" onclick="input('4')">4</button>
<button class="btn num" onclick="input('5')">5</button>
<button class="btn num" onclick="input('6')">6</button>
<button class="btn op" onclick="input('+')">+</button>
<button class="btn fn" onclick="input('.')">.</button>
<button class="btn num" onclick="input('1')">1</button>
<button class="btn num" onclick="input('2')">2</button>
<button class="btn num" onclick="input('3')">3</button>
<button class="btn eq" onclick="calc()" style="grid-row:span 2">=</button>
<button class="btn fn" onclick="negate()">±</button>
<button class="btn num" style="grid-column:span 2" onclick="input('0')">0</button>
</div>
<div class="history" id="history"></div>
</div>
<script>
let expression='';
const exprEl=document.getElementById('expr');
const resultEl=document.getElementById('result');
const historyEl=document.getElementById('history');
function input(v){expression+=v;exprEl.textContent=expression;try{resultEl.textContent=evalExpr(expression)}catch{}}
function fn(v){expression+=v;exprEl.textContent=expression}
function clearAll(){expression='';exprEl.textContent='';resultEl.textContent='0'}
function backspace(){expression=expression.slice(0,-1);exprEl.textContent=expression;try{resultEl.textContent=evalExpr(expression)||'0'}catch{}}
function negate(){try{let r=evalExpr(expression);expression=String(-r);exprEl.textContent=expression;resultEl.textContent=expression}catch{}}
function calc(){try{let r=evalExpr(expression);historyEl.innerHTML='<div>'+expression+' = '+r+'</div>'+historyEl.innerHTML;expression=String(r);exprEl.textContent='';resultEl.textContent=r}catch{resultEl.textContent='Error'}}
function evalExpr(e){
e=e.replace(/sin\\(/g,'Math.sin(').replace(/cos\\(/g,'Math.cos(').replace(/tan\\(/g,'Math.tan(')
.replace(/log\\(/g,'Math.log10(').replace(/ln\\(/g,'Math.log(').replace(/sqrt\\(/g,'Math.sqrt(')
.replace(/pow\\(/g,'Math.pow(').replace(/PI/g,'Math.PI').replace(/E/g,'Math.E');
let r=Function('"use strict";return ('+e+')')();
return Math.round(r*1e10)/1e10;
}
document.addEventListener('keydown',e=>{
if(e.key>='0'&&e.key<='9'||e.key==='.'||['+','-','*','/','(',')','%'].includes(e.key))input(e.key);
else if(e.key==='Enter')calc();
else if(e.key==='Backspace')backspace();
else if(e.key==='Escape')clearAll();
});
</script></body></html>`;
    openToolInViewer("Calculator", html);
}

// notes app
function openNotes() {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0f172a;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;display:flex;height:100vh}
.sidebar{width:220px;background:#1e293b;border-right:1px solid #334155;display:flex;flex-direction:column;flex-shrink:0}
.sidebar-header{padding:16px;border-bottom:1px solid #334155;display:flex;justify-content:space-between;align-items:center}
.sidebar-header h3{font-size:14px;font-weight:700}
.new-btn{background:#3b82f6;color:#fff;border:none;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer}
.new-btn:hover{background:#2563eb}
.note-list{flex:1;overflow-y:auto;padding:8px}
.note-item{padding:10px 12px;border-radius:8px;cursor:pointer;margin-bottom:4px;font-size:13px;transition:background 0.15s}
.note-item:hover{background:#334155}
.note-item.active{background:#334155;font-weight:600}
.note-item .note-preview{color:#64748b;font-size:11px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.editor{flex:1;display:flex;flex-direction:column}
.toolbar{padding:8px 16px;border-bottom:1px solid #334155;display:flex;gap:8px;background:#1e293b}
.toolbar button{background:#334155;color:#94a3b8;border:none;padding:6px 10px;border-radius:6px;font-size:12px;cursor:pointer}
.toolbar button:hover{background:#475569;color:#f1f5f9}
.title-input{background:transparent;border:none;color:#f1f5f9;font-size:20px;font-weight:700;padding:16px 20px 8px;outline:none;width:100%}
.content{flex:1;padding:0 20px 20px;outline:none;font-size:15px;line-height:1.7;color:#cbd5e1;overflow-y:auto}
.content:empty::before{content:'start typing...';color:#475569}
.delete-btn{background:#ef4444;color:#fff;border:none;padding:6px 12px;border-radius:8px;font-size:12px;cursor:pointer;margin:8px}
</style></head><body>
<div class="sidebar">
<div class="sidebar-header"><h3>Notes</h3><button class="new-btn" onclick="newNote()">+ New</button></div>
<div class="note-list" id="noteList"></div>
<button class="delete-btn" onclick="deleteNote()">Delete Note</button>
<button class="new-btn" style="margin:0 8px 8px" onclick="exportNote()">Export .txt</button>
</div>
<div class="editor">
<div class="toolbar">
<button onclick="fmt('bold')"><b>B</b></button>
<button onclick="fmt('italic')"><i>I</i></button>
<button onclick="fmt('underline')"><u>U</u></button>
<button onclick="fmt('insertUnorderedList')">List</button>
<button onclick="fmt('insertOrderedList')">1. List</button>
</div>
<input class="title-input" id="noteTitle" placeholder="Note title..." oninput="saveCurrentNote()">
<div class="content" id="noteContent" contenteditable="true" oninput="saveCurrentNote()"></div>
</div>
<script>
let notes=JSON.parse(localStorage.getItem('shrimp-notes')||'[]');
let currentId=null;
function render(){
const list=document.getElementById('noteList');
list.innerHTML='';
notes.forEach(n=>{
const d=document.createElement('div');
d.className='note-item'+(n.id===currentId?' active':'');
d.innerHTML='<div>'+esc(n.title||'Untitled')+'</div><div class="note-preview">'+esc(stripHtml(n.content||'').substring(0,40))+'</div>';
d.onclick=()=>loadNote(n.id);
list.appendChild(d);
});
}
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}
function stripHtml(h){const d=document.createElement('div');d.innerHTML=h;return d.textContent||''}
function newNote(){
const n={id:Date.now(),title:'',content:''};
notes.unshift(n);save();loadNote(n.id);
}
function loadNote(id){
currentId=id;
const n=notes.find(x=>x.id===id);
if(!n)return;
document.getElementById('noteTitle').value=n.title;
document.getElementById('noteContent').innerHTML=n.content;
render();
}
function saveCurrentNote(){
if(!currentId)return;
const n=notes.find(x=>x.id===currentId);
if(!n)return;
n.title=document.getElementById('noteTitle').value;
n.content=document.getElementById('noteContent').innerHTML;
save();render();
}
function deleteNote(){
if(!currentId)return;
notes=notes.filter(x=>x.id!==currentId);
save();currentId=null;
document.getElementById('noteTitle').value='';
document.getElementById('noteContent').innerHTML='';
render();
}
function exportNote(){
if(!currentId)return;
const n=notes.find(x=>x.id===currentId);
if(!n)return;
const blob=new Blob([n.title+'\\n\\n'+stripHtml(n.content)],{type:'text/plain'});
const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(n.title||'note')+'.txt';a.click();
}
function save(){localStorage.setItem('shrimp-notes',JSON.stringify(notes))}
function fmt(cmd){document.execCommand(cmd,false,null);saveCurrentNote()}
render();
if(notes.length>0)loadNote(notes[0].id);else newNote();
</script></body></html>`;
    openToolInViewer("Notes", html);
}

// pomodoro timer
function openTimer() {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0f172a;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh}
.timer-app{text-align:center;max-width:400px;width:100%;padding:40px 20px}
h1{font-size:24px;font-weight:700;margin-bottom:8px}
.subtitle{color:#64748b;font-size:14px;margin-bottom:32px}
.ring-container{position:relative;width:260px;height:260px;margin:0 auto 32px}
svg{transform:rotate(-90deg)}
.ring-bg{fill:none;stroke:#334155;stroke-width:8}
.ring-progress{fill:none;stroke:#3b82f6;stroke-width:8;stroke-linecap:round;transition:stroke-dashoffset 0.5s ease,stroke 0.3s}
.time-display{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.time{font-size:48px;font-weight:800;letter-spacing:-2px}
.label{font-size:14px;color:#64748b;margin-top:4px}
.controls{display:flex;gap:12px;justify-content:center;margin-bottom:24px}
.ctrl-btn{padding:12px 28px;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.15s}
.start{background:#3b82f6;color:white}.start:hover{background:#2563eb}
.pause{background:#f59e0b;color:white}.pause:hover{background:#d97706}
.reset{background:#334155;color:#94a3b8}.reset:hover{background:#475569}
.config{display:flex;gap:16px;justify-content:center;margin-bottom:16px}
.config label{font-size:13px;color:#64748b}
.config input{width:60px;padding:6px;border-radius:8px;border:1px solid #334155;background:#1e293b;color:#f1f5f9;text-align:center;font-size:14px}
.sessions{color:#64748b;font-size:13px}
.sessions span{color:#3b82f6;font-weight:700}
</style></head><body>
<div class="timer-app">
<h1>Pomodoro Timer</h1>
<p class="subtitle">stay focused, take breaks</p>
<div class="config">
<div><label>Work (min)</label><br><input type="number" id="workMin" value="25" min="1" max="120" onchange="resetTimer()"></div>
<div><label>Break (min)</label><br><input type="number" id="breakMin" value="5" min="1" max="60" onchange="resetTimer()"></div>
</div>
<div class="ring-container">
<svg width="260" height="260" viewBox="0 0 260 260">
<circle class="ring-bg" cx="130" cy="130" r="120"/>
<circle class="ring-progress" id="progress" cx="130" cy="130" r="120" stroke-dasharray="754" stroke-dashoffset="0"/>
</svg>
<div class="time-display">
<div class="time" id="timeDisplay">25:00</div>
<div class="label" id="phaseLabel">work time</div>
</div>
</div>
<div class="controls">
<button class="ctrl-btn start" id="startBtn" onclick="toggleTimer()">Start</button>
<button class="ctrl-btn reset" onclick="resetTimer()">Reset</button>
</div>
<div class="sessions">Sessions completed: <span id="sessionCount">0</span></div>
</div>
<script>
let running=false,interval=null,timeLeft=25*60,totalTime=25*60,isBreak=false,sessions=0;
const progress=document.getElementById('progress');
const timeDisplay=document.getElementById('timeDisplay');
const phaseLabel=document.getElementById('phaseLabel');
const startBtn=document.getElementById('startBtn');
const sessionCount=document.getElementById('sessionCount');
const C=2*Math.PI*120;
progress.setAttribute('stroke-dasharray',C);
function update(){
const m=Math.floor(timeLeft/60);const s=timeLeft%60;
timeDisplay.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
const offset=C*(1-timeLeft/totalTime);
progress.setAttribute('stroke-dashoffset',offset);
progress.setAttribute('stroke',isBreak?'#10b981':'#3b82f6');
}
function toggleTimer(){
if(running){running=false;clearInterval(interval);startBtn.textContent='Resume';startBtn.className='ctrl-btn start';return}
running=true;startBtn.textContent='Pause';startBtn.className='ctrl-btn pause';
interval=setInterval(()=>{
timeLeft--;update();
if(timeLeft<=0){clearInterval(interval);running=false;
try{new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=').play()}catch{}
if(!isBreak){sessions++;sessionCount.textContent=sessions;isBreak=true;totalTime=parseInt(document.getElementById('breakMin').value)*60;timeLeft=totalTime;phaseLabel.textContent='break time';startBtn.textContent='Start Break';startBtn.className='ctrl-btn start'}
else{isBreak=false;totalTime=parseInt(document.getElementById('workMin').value)*60;timeLeft=totalTime;phaseLabel.textContent='work time';startBtn.textContent='Start';startBtn.className='ctrl-btn start'}
update();
}
},1000);
}
function resetTimer(){clearInterval(interval);running=false;isBreak=false;totalTime=parseInt(document.getElementById('workMin').value)*60;timeLeft=totalTime;phaseLabel.textContent='work time';startBtn.textContent='Start';startBtn.className='ctrl-btn start';update()}
update();
</script></body></html>`;
    openToolInViewer("Pomodoro Timer", html);
}

// AI helper
function openAIHelper() {
    closePopup();
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0f172a;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;display:flex;flex-direction:column;height:100vh}
.header{padding:16px 20px;border-bottom:1px solid #334155;background:#1e293b;display:flex;align-items:center;justify-content:space-between}
.header h2{font-size:18px;font-weight:700}
.service-btns{display:flex;gap:8px}
.service-btn{padding:8px 16px;border-radius:8px;border:1px solid #334155;background:#334155;color:#f1f5f9;font-size:12px;font-weight:600;cursor:pointer;text-decoration:none;transition:all 0.15s}
.service-btn:hover{background:#475569}
.chat{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:12px}
.msg{max-width:80%;padding:12px 16px;border-radius:12px;font-size:14px;line-height:1.6}
.user-msg{background:#3b82f6;color:white;align-self:flex-end;border-bottom-right-radius:4px}
.ai-msg{background:#1e293b;border:1px solid #334155;align-self:flex-start;border-bottom-left-radius:4px}
.input-area{padding:16px 20px;border-top:1px solid #334155;background:#1e293b;display:flex;gap:12px}
.input-area input{flex:1;padding:12px 16px;border-radius:12px;border:1px solid #334155;background:#0f172a;color:#f1f5f9;font-size:14px;outline:none}
.input-area input:focus{border-color:#3b82f6}
.send-btn{padding:12px 24px;border-radius:12px;background:#3b82f6;color:white;border:none;font-weight:600;cursor:pointer;font-size:14px}
.send-btn:hover{background:#2563eb}
.typing{color:#64748b;font-style:italic;font-size:13px}
</style></head><body>
<div class="header">
<h2>AI Study Helper</h2>
<div class="service-btns">
<a class="service-btn" href="https://chatgpt.com" target="_blank">ChatGPT</a>
<a class="service-btn" href="https://claude.ai" target="_blank">Claude</a>
<a class="service-btn" href="https://www.perplexity.ai" target="_blank">Perplexity</a>
</div>
</div>
<div class="chat" id="chat">
<div class="msg ai-msg">hey! i'm your study helper. ask me anything - math, science, history, writing, etc. i'll do my best to help!<br><br>you can also use the buttons above to open full AI services in a new tab.</div>
</div>
<div class="input-area">
<input type="text" id="userInput" placeholder="ask me anything..." onkeydown="if(event.key==='Enter')sendMessage()">
<button class="send-btn" onclick="sendMessage()">Send</button>
</div>
<script>
const chat=document.getElementById('chat');
const input=document.getElementById('userInput');
function addMsg(text,isUser){
const d=document.createElement('div');
d.className='msg '+(isUser?'user-msg':'ai-msg');
d.textContent=text;
chat.appendChild(d);
chat.scrollTop=chat.scrollHeight;
return d;
}
async function sendMessage(){
const q=input.value.trim();
if(!q)return;
input.value='';
addMsg(q,true);
const typing=document.createElement('div');
typing.className='typing';typing.textContent='thinking...';
chat.appendChild(typing);chat.scrollTop=chat.scrollHeight;
try{
const r=await fetch('https://api.duckduckgo.com/duckchat/v1/chat',{
method:'POST',
headers:{'Content-Type':'application/json','x-vqd-4':await getVQD()},
body:JSON.stringify({model:'gpt-4o-mini',messages:[{role:'user',content:q}]})
});
typing.remove();
if(!r.ok)throw new Error('API error');
const text=await r.text();
const lines=text.split('\\n').filter(l=>l.startsWith('data: '));
let answer='';
for(const line of lines){
const data=line.slice(6);
if(data==='[DONE]')break;
try{const j=JSON.parse(data);if(j.message)answer+=j.message}catch{}
}
addMsg(answer||'sorry, i could not get a response. try the full AI services above!',false);
}catch(e){
typing.remove();
addMsg('could not connect to AI service. try clicking ChatGPT, Claude, or Perplexity above for a full AI experience!',false);
}
}
let vqdToken='';
async function getVQD(){
if(vqdToken)return vqdToken;
try{
const r=await fetch('https://duckduckgo.com/duckchat/v1/status',{headers:{'x-vqd-accept':'1'}});
vqdToken=r.headers.get('x-vqd-4')||'';
return vqdToken;
}catch{return ''}
}
</script></body></html>`;
    openToolInViewer("AI Study Helper", html);
}

function switchCheatTab(key) {
    document.querySelectorAll('.cheats-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('[id^="cheatPanel_"]').forEach(p => p.style.display = 'none');
    event.target.classList.add('active');
    const panel = document.getElementById('cheatPanel_' + key);
    if (panel) panel.style.display = 'block';
}