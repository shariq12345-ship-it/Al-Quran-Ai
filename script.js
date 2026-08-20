// ================= GLOBAL VARIABLES & STATE =================
let currentMode = 'normal';
let currentAyahAudios = [];
let currentAyahIndex = 0;
let isPlayingAll = false;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const voiceSearchBtn = document.getElementById('voiceSearchBtn');
const modeButtons = document.querySelectorAll('.mode-btn');

const placeholderText = document.getElementById('placeholderText');
const ayahContainer = document.getElementById('ayahContainer');
const pdfDocumentArea = document.getElementById('pdfDocumentArea');

const masterAudioCard = document.getElementById('masterAudioCard');
const currentSurahTitle = document.getElementById('currentSurahTitle');
const masterPlayBtn = document.getElementById('masterPlayBtn');
const masterMuteBtn = document.getElementById('masterMuteBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const globalAudioPlayer = document.getElementById('globalAudioPlayer');

const viewBookmarksBtn = document.getElementById('viewBookmarksBtn');
const bookmarkCountSpan = document.getElementById('bookmarkCount');

// Modals & Profile Elements
const loginModal = document.getElementById('loginModal');
const profileModal = document.getElementById('profileModal');
const closeLoginModal = document.getElementById('closeLoginModal');
const closeProfileModal = document.getElementById('closeProfileModal');
const loginForm = document.getElementById('loginForm');
const userNavContainer = document.getElementById('userNavContainer');
const logoutBtn = document.getElementById('logoutBtn');

const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('i') : null;

// ================= THEME TOGGLE LOGIC =================
function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.classList.add('light-theme');
    if (themeIcon) themeIcon.className = 'fa-solid fa-moon';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.remove('light-theme');
    if (themeIcon) themeIcon.className = 'fa-solid fa-sun';
  }
}

const savedTheme = localStorage.getItem('appTheme') || 'dark';
applyTheme(savedTheme);

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('appTheme', newTheme);
    applyTheme(newTheme);
  });
}

// ================= BOOKMARK STORAGE MANAGEMENT =================
function getStoredBookmarks() {
  return JSON.parse(localStorage.getItem('quranBookmarks')) || [];
}

function updateBookmarkBadge() {
  const bookmarks = getStoredBookmarks();
  if (bookmarkCountSpan) {
    bookmarkCountSpan.innerText = bookmarks.length;
  }
}

// Toggle Single Ayah Bookmark
function toggleBookmark(ayahData) {
  let bookmarks = getStoredBookmarks();
  const existsIndex = bookmarks.findIndex(b => b.key === ayahData.key);

  if (existsIndex > -1) {
    bookmarks.splice(existsIndex, 1);
  } else {
    bookmarks.push(ayahData);
  }

  localStorage.setItem('quranBookmarks', JSON.stringify(bookmarks));
  updateBookmarkBadge();

  const btn = document.getElementById(`bm-btn-${ayahData.key.replace(/[:]/g, '-')}`);
  if (btn) {
    const isSaved = bookmarks.some(b => b.key === ayahData.key);
    btn.classList.toggle('bookmarked', isSaved);
    btn.innerHTML = isSaved
      ? `<i class="fa-solid fa-bookmark"></i> Bookmarked`
      : `<i class="fa-regular fa-bookmark"></i> Bookmark`;
  }
}

// Toggle ENTIRE SURAH Bookmark
function toggleSurahBookmark(surahData) {
  let bookmarks = getStoredBookmarks();
  const surahKey = `surah-${surahData.surahNumber}`;
  const existsIndex = bookmarks.findIndex(b => b.key === surahKey);

  if (existsIndex > -1) {
    bookmarks.splice(existsIndex, 1);
  } else {
    bookmarks.push({
      key: surahKey,
      type: 'surah',
      surahNumber: surahData.surahNumber,
      surahName: surahData.surahName,
      arabicName: surahData.arabicName,
      totalAyahs: surahData.totalAyahs
    });
  }

  localStorage.setItem('quranBookmarks', JSON.stringify(bookmarks));
  updateBookmarkBadge();

  const surahBmBtn = document.getElementById('bookmarkSurahBtn');
  if (surahBmBtn) {
    const isSaved = bookmarks.some(b => b.key === surahKey);
    surahBmBtn.classList.toggle('bookmarked', isSaved);
    surahBmBtn.innerHTML = isSaved
      ? `<i class="fa-solid fa-bookmark"></i> Surah Bookmarked`
      : `<i class="fa-regular fa-bookmark"></i> Bookmark Surah`;
  }
}

updateBookmarkBadge();

if (viewBookmarksBtn) {
  viewBookmarksBtn.addEventListener('click', renderBookmarksView);
}

function renderBookmarksView() {
  stopAudio();
  if (placeholderText) placeholderText.classList.add('hidden');
  if (masterAudioCard) masterAudioCard.classList.add('hidden');
  if (currentSurahTitle) currentSurahTitle.innerText = "Saved Bookmarks";

  const bookmarks = getStoredBookmarks();

  if (!ayahContainer) return;
  ayahContainer.innerHTML = '';

  const titleHeader = document.createElement('div');
  titleHeader.className = 'bookmark-header-title';

  titleHeader.innerHTML = `
    <h3 class="bookmark-heading">
      <i class="fa-solid fa-bookmark"></i> 
      <span>Mahfooz Karda Items (${bookmarks.length})</span>
    </h3>
    <button class="ayah-action-btn back-btn" onclick="goBackFromBookmarks()">
      <i class="fa-solid fa-arrow-left"></i> Back
    </button>
  `;
  ayahContainer.appendChild(titleHeader);

  if (bookmarks.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.style.cssText = 'text-align:center; padding: 40px 15px;';
    emptyState.innerHTML = `
      <i class="fa-regular fa-bookmark" style="font-size: 3rem; color: var(--dark-yellow);"></i>
      <p style="margin-top: 15px; font-size: 1.1rem;">Koi Ayat ya Surah bookmark nahi ki gayi hai.</p>
    `;
    ayahContainer.appendChild(emptyState);
    return;
  }

  bookmarks.forEach((bm) => {
    const card = document.createElement('div');
    card.className = 'ayah-card bookmark-card';

    if (bm.type === 'surah') {
      card.innerHTML = `
        <div class="bookmark-badge">📖 Full Surah Bookmark</div>
        <div class="arabic-text surah-title-text">Surah ${bm.surahName} (${bm.arabicName})</div>
        <div class="total-ayahs-text">Total Ayahs: ${bm.totalAyahs}</div>
        <div class="ayah-actions card-actions">
          <button class="ayah-action-btn" onclick="openBookmarkedSurah(${bm.surahNumber})">
            <i class="fa-solid fa-book-open"></i> Open Surah
          </button>
          <button class="ayah-action-btn bookmarked" onclick='removeBookmarkDirect("${bm.key}")'>
            <i class="fa-solid fa-trash"></i> Remove
          </button>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="bookmark-badge">📌 ${bm.surahName} (Ayah ${bm.numberInSurah})</div>
        <div class="arabic-text">${bm.arabicText}</div>
        ${bm.urduText ? `<div class="urdu-text">${bm.urduText}</div>` : ''}
        <div class="ayah-actions card-actions">
          <button class="ayah-action-btn bookmarked" onclick='removeBookmarkDirect("${bm.key}")'>
            <i class="fa-solid fa-trash"></i> Remove
          </button>
        </div>
      `;
    }

    ayahContainer.appendChild(card);
  });
}

function goBackFromBookmarks() {
  const query = searchInput ? searchInput.value.trim() : '';
  if (query) {
    handleSearch();
  } else {
    if (searchInput) searchInput.value = '1';
    handleSearch();
  }
}

function openBookmarkedSurah(surahNumber) {
  if (searchInput) searchInput.value = surahNumber;
  handleSearch();
}

function removeBookmarkDirect(key) {
  let bookmarks = getStoredBookmarks();
  bookmarks = bookmarks.filter(b => b.key !== key);
  localStorage.setItem('quranBookmarks', JSON.stringify(bookmarks));
  updateBookmarkBadge();
  renderBookmarksView();
}

// ================= AUTH & PROFILE MANAGEMENT =================
function checkUserLogin() {
  const user = JSON.parse(localStorage.getItem('currentUser'));

  if (user && userNavContainer) {
    userNavContainer.innerHTML = `
      <button class="profile-nav-btn" id="openProfileBtn">
        <i class="fas fa-user-circle"></i>
      <span>Profile</span>
      </button>
    `;

    const openProfileBtn = document.getElementById('openProfileBtn');
    if (openProfileBtn) {
      openProfileBtn.onclick = () => {
        if (loginModal) loginModal.classList.add('hidden');
        document.getElementById('profileName').innerText = user.name || 'User';
        document.getElementById('profileEmail').innerText = user.email;
        if (profileModal) profileModal.classList.remove('hidden');
      };
    }
  } else if (userNavContainer) {
    userNavContainer.innerHTML = `
      <button class="login-btn" id="openLoginModal"><i class="fa-solid fa-user"></i> Login</button>
    `;

    const btn = document.getElementById('openLoginModal');
    if (btn) {
      btn.onclick = () => {
        if (profileModal) profileModal.classList.add('hidden');
        if (loginModal) loginModal.classList.remove('hidden');
      };
    }
  }
}

checkUserLogin();

if (closeLoginModal) closeLoginModal.onclick = () => loginModal.classList.add('hidden');
if (closeProfileModal) closeProfileModal.onclick = () => profileModal.classList.add('hidden');

window.addEventListener('click', (e) => {
  if (e.target === loginModal) loginModal.classList.add('hidden');
  if (e.target === profileModal) profileModal.classList.add('hidden');
});

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('email');
    if (!emailInput) return;
    const email = emailInput.value;
    const name = email.split('@')[0];
    const userData = { email: email, name: name.charAt(0).toUpperCase() + name.slice(1) };

    localStorage.setItem('currentUser', JSON.stringify(userData));
    if (loginModal) loginModal.classList.add('hidden');
    checkUserLogin();
  });
}

if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.removeItem('currentUser');
    if (profileModal) profileModal.classList.add('hidden');
    checkUserLogin();
  };
}

// ================= SEARCH MODE SWITCHING =================
function updateSearchPlaceholder() {
  if (!searchInput) return;

  if (currentMode === 'ai') {
    searchInput.placeholder = "Ask any Islamic question to get instant AI answers...";
  } else if (currentMode === 'urdu') {
    searchInput.placeholder = "Search Surah or Ayah to read & listen with Urdu translation...";
  } else {
    searchInput.placeholder = "Enter Surah name or Ayah number to read & listen Arabic...";
  }
}

modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    modeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
    updateSearchPlaceholder();
  });
});

// Refresh / Page Load hone par placeholder set karne ke liye
updateSearchPlaceholder();

// ================= SEARCH TRIGGER =================
if (searchBtn) searchBtn.addEventListener('click', handleSearch);
if (searchInput) {
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
}

async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) return;

  if (placeholderText) placeholderText.classList.add('hidden');
  stopAudio();

  if (currentMode === 'ai') {
    if (ayahContainer) {
      ayahContainer.innerHTML = '<p style="text-align:center; padding: 30px; color: var(--dark-yellow);"> AI is thinking...</p>';
    }
    await fetchAIChatbotResponse(query);
  } else {
    if (ayahContainer) {
      ayahContainer.innerHTML = '<p style="text-align:center; padding: 30px; color: var(--dark-yellow);">⏳ Loading Quran Data...</p>';
    }
    await fetchQuranData(query);
  }
}

// ================= SURAH & AYAH SEARCH HELPER =================
const popularSurahsMap = {
  "fatiha": 1, "faatiha": 1, "fateha": 1, "alhamd": 1,
  "baqarah": 2, "baqara": 2, "baqar": 2,
  "imran": 3, "aliimran": 3, "nisa": 4, "maidah": 5,
  "kahf": 18, "yasin": 36, "yaseen": 36, "rahman": 55, "rehman": 55, "rehaam": 55,
  "waqiah": 56, "mulk": 67, "qadr": 97, "kausar": 108, "kauthar": 108,
  "kawthar": 108, "ikhlas": 112, "falaq": 113, "nas": 114
};

// Common/Famous Ayah Aliases Mapping
const specialAyahAliases = {
  "ayatalkursi": { surah: 2, ayah: 255 },
  "ayatulkursi": { surah: 2, ayah: 255 },
  "ayatkursi": { surah: 2, ayah: 255 },
  "ayatal-kursi": { surah: 2, ayah: 255 },
  "ayaturkursi": { surah: 2, ayah: 255 },
  "amanarrasul": { surah: 2, ayah: 285 }
};

let surahListCache = null;

async function getSurahInfoFromQuery(query) {
  let cleanInput = query.toLowerCase()
    .replace(/\b(surah|sura|soorah|soora)\b/g, '')
    .replace(/al-|an-|at-|ar-|az-|ash-/g, '')
    .replace(/[^a-z0-9:\s]/g, '')
    .trim();

  const normalizedKey = cleanInput.replace(/[^a-z0-9]/g, '');

  // 1. Check for Special Named Ayahs (e.g. "Ayat al Kursi")
  if (specialAyahAliases[normalizedKey]) {
    return specialAyahAliases[normalizedKey];
  }

  // 2. Check for "Surah:Ayah" or "Surah Ayah" format (e.g. "2:255" ya "2 255")
  const ayahPatternMatch = cleanInput.match(/^(\d+)[\s:]+(\d+)$/);
  if (ayahPatternMatch) {
    return {
      surah: parseInt(ayahPatternMatch[1]),
      targetAyah: parseInt(ayahPatternMatch[2])
    };
  }

  // 3. Check for Direct Surah Number (1-114)
  if (!isNaN(normalizedKey) && parseInt(normalizedKey) >= 1 && parseInt(normalizedKey) <= 114) {
    return { surah: parseInt(normalizedKey) };
  }

  // 4. Check Popular Surah Names
  if (popularSurahsMap[normalizedKey]) {
    return { surah: popularSurahsMap[normalizedKey] };
  }

  // 5. Check API Surah List Cache
  if (!surahListCache) {
    try {
      const res = await fetch('https://api.alquran.cloud/v1/surah');
      const data = await res.json();
      if (data.code === 200) surahListCache = data.data;
    } catch (e) { console.error(e); }
  }

  if (surahListCache) {
    const found = surahListCache.find(s => {
      const eng = s.englishName.toLowerCase().replace(/[^a-z0-9]/g, '');
      return eng.includes(normalizedKey) || normalizedKey.includes(eng);
    });
    if (found) return { surah: found.number };
  }

  return { surah: query };
}

// ================= FETCH QURAN DATA =================
async function fetchQuranData(query) {
  try {
    const targetInfo = await getSurahInfoFromQuery(query);
    const surahId = targetInfo.surah;
    const targetAyah = targetInfo.ayah || targetInfo.targetAyah || null;

    if (typeof surahId === 'string' && isNaN(surahId)) {
      showSearchError(query);
      return;
    }

    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}/editions/quran-uthmani,ur.jalandhry,ar.alafasy,ur.khan`);
    const data = await response.json();

    if (data.code !== 200) {
      showSearchError(query);
      return;
    }

    const arabicData = data.data[0];
    const urduData = data.data[1];
    const arabicAudioData = data.data[2];
    const urduAudioData = data.data[3];

    renderQuranPage(arabicData, urduData, arabicAudioData, urduAudioData, targetAyah);

  } catch (err) {
    showSearchError(query);
  }
}

function showSearchError(query) {
  if (currentSurahTitle) currentSurahTitle.innerText = "Surah / Ayah Not Found";
  if (ayahContainer) {
    ayahContainer.innerHTML = `
      <div style="text-align:center; padding: 30px 15px;">
        <p style="color:#ff4d4d; font-size: 1.1rem;">"<b>${query}</b>" not found.</p>
      </div>`;
  }
}

// ================= RENDER QURAN PAGE VIEW =================
function renderQuranPage(arabicData, urduData, arabicAudioData, urduAudioData, targetAyahNum = null) {
  if (!ayahContainer) return;
  ayahContainer.innerHTML = '';
  currentAyahAudios = [];

  if (currentSurahTitle) {
    currentSurahTitle.innerText = `${arabicData.englishName} (${arabicData.name})`;
  }
  if (masterAudioCard) {
    masterAudioCard.classList.remove('hidden');
  }

  const surahNumber = arabicData.number;
  const bookmarks = getStoredBookmarks();

  const surahKey = `surah-${surahNumber}`;
  const isSurahBookmarked = bookmarks.some(b => b.key === surahKey);

  const surahBookmarkData = JSON.stringify({
    surahNumber: surahNumber,
    surahName: arabicData.englishName,
    arabicName: arabicData.name,
    totalAyahs: arabicData.numberOfAyahs
  }).replace(/'/g, "&apos;");

  const surahHeaderActions = document.createElement('div');
  surahHeaderActions.style.cssText = 'text-align: center; margin-bottom: 20px;';
  surahHeaderActions.innerHTML = `
    <button id="bookmarkSurahBtn" class="ayah-action-btn ${isSurahBookmarked ? 'bookmarked' : ''}" onclick='toggleSurahBookmark(${surahBookmarkData})'>
      <i class="fa-${isSurahBookmarked ? 'solid' : 'regular'} fa-bookmark"></i> ${isSurahBookmarked ? 'Surah Bookmarked' : 'Bookmark Surah'}
    </button>
  `;
  ayahContainer.appendChild(surahHeaderActions);

  if (surahNumber !== 1 && surahNumber !== 9) {
    const bismillahHeader = document.createElement('div');
    bismillahHeader.className = 'bismillah-header';
    bismillahHeader.style.cssText = `
      text-align: center;
      padding: 20px 10px;
      margin-bottom: 20px;
      border-bottom: 1px dashed var(--dark-yellow, #d4af37);
    `;

    let bismillahUrduHTML = '';
    if (currentMode === 'urdu') {
      bismillahUrduHTML = `<div class="urdu-text" style="font-size: 1.25rem; margin-top: 8px; color: var(--text-color);">شروع اللہ کے نام سے جو بڑا مہربان نہایت رحم والا ہے</div>`;
    }

    bismillahHeader.innerHTML = `
      <div class="arabic-text" style="font-size: 2rem; color: var(--primary-gold, #f1c40f);">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
      ${bismillahUrduHTML}
    `;
    ayahContainer.appendChild(bismillahHeader);
  }

  let targetCardElementId = null;

  arabicData.ayahs.forEach((ayah, index) => {
    const ayahCard = document.createElement('div');
    ayahCard.className = 'ayah-card';
    ayahCard.id = `ayah-card-${index}`;

    if (targetAyahNum && ayah.numberInSurah === targetAyahNum) {
      targetCardElementId = `ayah-card-${index}`;
    }

    const arabicAudioUrl = arabicAudioData.ayahs[index].audio;
    const urduAudioUrl = urduAudioData ? urduAudioData.ayahs[index].audio : null;
    const urduText = urduData.ayahs[index].text;

    currentAyahAudios.push({
      arabicAudio: arabicAudioUrl,
      urduAudio: urduAudioUrl,
      urduText: urduText,
      elementId: `ayah-card-${index}`
    });

    let cleanArabicText = ayah.text;
    if (index === 0 && surahNumber !== 1 && surahNumber !== 9) {
      cleanArabicText = cleanArabicText.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '').trim();
    }

    let urduHTML = '';
    if (currentMode === 'urdu') {
      urduHTML = `<div class="urdu-text">${urduText}</div>`;
    }

    const ayahKey = `${surahNumber}:${ayah.numberInSurah}`;
    const isBookmarked = bookmarks.some(b => b.key === ayahKey);
    const btnId = `bm-btn-${surahNumber}-${ayah.numberInSurah}`;

    const ayahBookmarkData = JSON.stringify({
      key: ayahKey,
      surahNumber: surahNumber,
      surahName: arabicData.englishName,
      numberInSurah: ayah.numberInSurah,
      arabicText: cleanArabicText,
      urduText: urduText
    }).replace(/'/g, "&apos;");

    ayahCard.innerHTML = `
      <div class="arabic-text">${cleanArabicText} ﴿${ayah.numberInSurah}﴾</div>
      ${urduHTML}
      <div class="ayah-actions">
        <button class="ayah-action-btn" onclick="playSingleAyah(${index})">
          <i class="fa-solid fa-play"></i> Listen
        </button>
        <button id="${btnId}" class="ayah-action-btn ${isBookmarked ? 'bookmarked' : ''}" onclick='toggleBookmark(${ayahBookmarkData})'>
          <i class="fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark"></i> ${isBookmarked ? 'Bookmarked' : 'Bookmark'}
        </button>
      </div>
    `;

    ayahContainer.appendChild(ayahCard);
  });

  // Target Ayah auto scroll aur highlight logic
  if (targetCardElementId) {
    setTimeout(() => {
      highlightAyahCard(targetCardElementId);
    }, 100);
  }
}

// ================= AI CHATBOT MODE =================
async function fetchAIChatbotResponse(prompt) {
  if (masterAudioCard) masterAudioCard.classList.add('hidden');

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: prompt })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch response");
    }

    if (data.choices && data.choices.length > 0) {
      const aiReply = data.choices[0].message.content.replace(/\n/g, '<br>');
      if (ayahContainer) {
        ayahContainer.innerHTML = `
          <div class="ayah-card ai-response-card" style="text-align:left; direction:ltr; line-height: 1.8;">
            <h3 style="color: var(--primary-gold, #f1c40f); margin-bottom: 12px;"> Islamic AI Assistant Response:</h3>
            <div class="ai-response-content" style="font-size: 1.05rem;">${aiReply}</div>
          </div>`;
      }
    } else {
      throw new Error("No response content from AI");
    }

  } catch (error) {
    console.error("AI Error:", error);
    if (ayahContainer) {
      ayahContainer.innerHTML = `
        <div class="ayah-card" style="text-align:center;">
          <p style="color: #ff4d4d;">❌ Error generating response. Please try again later.</p>
        </div>`;
    }
  }
}

// ================= PLAYBACK LOGIC =================
function playSingleAyah(index) {
  stopAudio();
  const ayahObj = currentAyahAudios[index];
  if (!ayahObj || !globalAudioPlayer) return;

  highlightAyahCard(ayahObj.elementId);

  globalAudioPlayer.src = ayahObj.arabicAudio;
  globalAudioPlayer.play();

  globalAudioPlayer.onended = () => {
    if (currentMode === 'urdu' && ayahObj.urduAudio) {
      globalAudioPlayer.src = ayahObj.urduAudio;
      globalAudioPlayer.play();

      globalAudioPlayer.onended = () => {
        removeHighlights();
      };
    } else {
      removeHighlights();
    }
  };
}

if (masterPlayBtn) {
  masterPlayBtn.addEventListener('click', () => {
    if (isPlayingAll) {
      stopAudio();
      return;
    }
    if (currentAyahAudios.length === 0) return;

    isPlayingAll = true;
    currentAyahIndex = 0;

    masterPlayBtn.innerHTML = `<i class="fa-solid fa-square"></i> Stop`;
    masterPlayBtn.style.background = '#e74c3c';

    playNextInSequence();
  });
}

function playNextInSequence() {
  if (currentAyahIndex >= currentAyahAudios.length || !isPlayingAll || !globalAudioPlayer) {
    stopAudio();
    return;
  }

  const currentObj = currentAyahAudios[currentAyahIndex];
  highlightAyahCard(currentObj.elementId);

  globalAudioPlayer.src = currentObj.arabicAudio;
  globalAudioPlayer.play();

  globalAudioPlayer.onended = () => {
    if (currentMode === 'urdu' && currentObj.urduAudio) {
      globalAudioPlayer.src = currentObj.urduAudio;
      globalAudioPlayer.play();

      globalAudioPlayer.onended = () => {
        currentAyahIndex++;
        playNextInSequence();
      };
    } else {
      currentAyahIndex++;
      playNextInSequence();
    }
  };
}

function highlightAyahCard(cardId) {
  removeHighlights();
  const card = document.getElementById(cardId);
  if (card) {
    card.classList.add('highlight');
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function removeHighlights() {
  document.querySelectorAll('.ayah-card').forEach(c => c.classList.remove('highlight'));
}

function stopAudio() {
  isPlayingAll = false;
  if (globalAudioPlayer) {
    globalAudioPlayer.pause();
    globalAudioPlayer.currentTime = 0;
  }
  removeHighlights();

  if (masterPlayBtn) {
    masterPlayBtn.innerHTML = `<i class="fa-solid fa-play"></i> Play All`;
    masterPlayBtn.style.background = '';
  }
}

if (masterMuteBtn && globalAudioPlayer) {
  masterMuteBtn.addEventListener('click', () => {
    globalAudioPlayer.muted = !globalAudioPlayer.muted;
    masterMuteBtn.innerHTML = globalAudioPlayer.muted
      ? `<i class="fa-solid fa-volume-xmark"></i> Unmute`
      : `<i class="fa-solid fa-volume-high"></i> Mute`;
  });
}

// ================= VOICE SEARCH =================
if (voiceSearchBtn) {
  voiceSearchBtn.addEventListener('click', () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice Search is not supported in this browser.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.start();

    voiceSearchBtn.style.color = 'red';

    recognition.onresult = (event) => {
      if (searchInput) {
        searchInput.value = event.results[0][0].transcript;
      }
      voiceSearchBtn.style.color = 'var(--dark-yellow)';
      handleSearch();
    };

    recognition.onerror = () => { voiceSearchBtn.style.color = 'var(--dark-yellow)'; };
  });
}

// ================= FULLSCREEN & PDF EXPORT =================
if (pdfDocumentArea) {
  pdfDocumentArea.addEventListener('click', (e) => {
    if (e.target.closest('.ayah-action-btn')) return;
    pdfDocumentArea.classList.toggle('fullscreen-mode');
  });
}

if (downloadPdfBtn) {
  downloadPdfBtn.addEventListener('click', () => {
    document.body.classList.add('pdf-export-active');
    const opt = {
      margin: 10,
      filename: 'Quran_Document.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    if (typeof html2pdf !== 'undefined') {
      html2pdf().set(opt).from(pdfDocumentArea).save().then(() => {
        document.body.classList.remove('pdf-export-active');
      });
    }
  });
}