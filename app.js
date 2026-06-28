const config = window.CHATBOT_CONFIG;
const messages = document.querySelector("#messages");
const suggestions = document.querySelector("#suggestions");
const form = document.querySelector("#chatForm");
const input = document.querySelector("#questionInput");
const statusDot = document.querySelector("#statusDot");
const statusText = document.querySelector("#statusText");
const reloadButton = document.querySelector("#reloadButton");

let knowledgeBase = [];

const demoData = [
  { question: "Apa jam operasional?", answer: "Jam operasional kami Senin–Jumat, pukul 09.00–17.00 WIB.", keywords: "jam buka, operasional, buka, tutup" },
  { question: "Bagaimana cara menghubungi admin?", answer: "Silakan hubungi admin melalui WhatsApp di 0812-0000-0000.", keywords: "kontak, admin, whatsapp, nomor telepon" },
  { question: "Di mana lokasi kantor?", answer: "Kantor kami berada di Jakarta. Silakan hubungi admin untuk petunjuk lengkap.", keywords: "alamat, lokasi, kantor, tempat" },
  { question: "Apa saja layanan yang tersedia?", answer: "Kami menyediakan layanan konsultasi, pemesanan, dan dukungan pelanggan.", keywords: "layanan, jasa, produk" },
];

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  const stopWords = new Set(["apa", "yang", "dan", "di", "ke", "dari", "untuk", "saya", "cara", "bagaimana", "apakah"]);
  return normalize(text).split(" ").filter((word) => word.length > 1 && !stopWords.has(word));
}

function similarity(query, item) {
  const queryText = normalize(query);
  const questionText = normalize(item.question);
  const keywordText = normalize(item.keywords);
  if (queryText === questionText) return 1;
  if (questionText.includes(queryText) || queryText.includes(questionText)) return 0.88;

  const queryWords = tokenize(query);
  const sourceWords = new Set(tokenize(`${item.question} ${item.keywords}`));
  if (!queryWords.length) return 0;

  let matches = 0;
  queryWords.forEach((word) => {
    if (sourceWords.has(word)) matches += 1;
    else if ([...sourceWords].some((source) => source.includes(word) || word.includes(source))) matches += 0.55;
  });
  const wordScore = matches / queryWords.length;
  const keywordBonus = queryWords.some((word) => keywordText.split(" ").includes(word)) ? 0.12 : 0;
  return Math.min(wordScore + keywordBonus, 1);
}

// Parser CSV kecil yang mendukung koma, baris baru, dan tanda kutip di dalam sel.
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') { field += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field); field = "";
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
    } else field += char;
  }
  row.push(field);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

function rowsToKnowledgeBase(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map(normalize);
  const questionIndex = headers.findIndex((header) => ["pertanyaan", "question", "tanya"].includes(header));
  const answerIndex = headers.findIndex((header) => ["jawaban", "answer", "respon", "response"].includes(header));
  const keywordIndex = headers.findIndex((header) => ["kata kunci", "katakunci", "keywords", "keyword"].includes(header));
  if (questionIndex >= 0 && answerIndex >= 0) {
    return rows.slice(1)
      .map((row) => ({ question: row[questionIndex]?.trim(), answer: row[answerIndex]?.trim(), keywords: row[keywordIndex]?.trim() || "" }))
      .filter((item) => item.question && item.answer);
  }

  // Format transparansi berita: kolom pertama berisi nama field,
  // kolom kedua berisi nilainya (satu field per baris).
  if (rows.every((row) => row.length >= 2)) {
    return rows
      .map(([key, ...values]) => fieldToKnowledge(key, values.join(",").trim()))
      .filter(Boolean);
  }
  throw new Error("Format spreadsheet tidak dikenali");
}

const fieldRules = [
  { match: /^judul$/, question: "Apa judul beritanya?", keywords: "judul artikel berita nama liputan" },
  { match: /^link_berita$/, question: "Di mana saya bisa membaca beritanya?", keywords: "link tautan baca artikel berita url" },
  { match: /^tanggal_liputan/, question: "Kapan liputan ini dilakukan?", keywords: "tanggal waktu kapan liputan terbit" },
  { match: /^nama_reporter$/, question: "Siapa reporter berita ini?", keywords: "reporter wartawan jurnalis penulis siapa" },
  { match: /^cara_peliputan$/, question: "Bagaimana cara peliputan berita ini?", keywords: "cara proses peliputan wawancara pengamatan reportase" },
  { match: /^metode_verifikasi$/, question: "Bagaimana informasi dalam berita diverifikasi?", keywords: "metode verifikasi cek fakta data dokumen sumber validasi" },
  { match: /^metode_penunjang$/, question: "Apa metode penunjang liputan ini?", keywords: "metode penunjang referensi tambahan data" },
  { match: /^alasan_angle$/, question: "Mengapa angle berita ini dipilih?", keywords: "alasan angle sudut pandang fokus berita" },
  { match: /^latar_belakang_pemberitaan$/, question: "Apa latar belakang pemberitaan ini?", keywords: "latar belakang konteks alasan liputan" },
  { match: /^apakah_ai_digunakan/, question: "Apakah AI digunakan dalam proses berita ini?", keywords: "ai artificial intelligence kecerdasan buatan transkripsi penggunaan" },
  { match: /^nama_narasumber/, question: "Siapa narasumber {n}?", keywords: "nama narasumber sumber wawancara ahli siapa {n}" },
  { match: /^atribusi_narasumber/, question: "Apa keahlian atau atribusi narasumber {n}?", keywords: "atribusi profil jabatan keahlian narasumber {n}" },
  { match: /^alasan_pemilihan_narasumber/, question: "Mengapa narasumber {n} dipilih?", keywords: "alasan pemilihan narasumber sumber ahli {n}" },
];

function fieldToKnowledge(rawKey, value) {
  if (!rawKey?.trim() || !value) return null;
  const key = normalize(rawKey).replace(/\s/g, "_");
  const number = key.match(/(\d+)$/)?.[1] || "";
  const rule = fieldRules.find((item) => item.match.test(key));
  const label = rawKey.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const question = (rule?.question || `Apa informasi ${label}?`).replace("{n}", number).replace(/\s+\?/g, "?");
  const keywords = `${rawKey.replace(/_/g, " ")} ${(rule?.keywords || "").replace("{n}", number)}`;
  return { question, answer: value, keywords, key };
}

function setStatus(type, text) {
  statusDot.className = `status-dot ${type}`;
  statusText.textContent = text;
}

function addMessage(text, sender = "bot") {
  const wrapper = document.createElement("div");
  const bubble = document.createElement("div");
  wrapper.className = `message ${sender}`;
  bubble.className = "bubble";
  if (sender === "bot" && /^https?:\/\/\S+$/i.test(text.trim())) {
    const link = document.createElement("a");
    link.href = text.trim();
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Baca artikel lengkap ↗";
    bubble.appendChild(link);
  } else {
    bubble.textContent = text;
  }
  wrapper.appendChild(bubble);
  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
}

function showSuggestions() {
  suggestions.replaceChildren();
  const preferredKeys = ["judul", "nama_reporter", "cara_peliputan", "metode_verifikasi", "apakah_ai_digunakan_dalam_proses_berita_ini"];
  const preferred = preferredKeys.map((key) => knowledgeBase.find((item) => item.key === key)).filter(Boolean);
  const remaining = knowledgeBase.filter((item) => !preferred.includes(item));
  [...preferred, ...remaining].slice(0, config.suggestionCount).forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.question;
    button.addEventListener("click", () => ask(item.question));
    suggestions.appendChild(button);
  });
}

function ask(question) {
  const cleanQuestion = question.trim();
  if (!cleanQuestion) return;
  addMessage(cleanQuestion, "user");
  input.value = "";

  const best = knowledgeBase
    .map((item) => ({ item, score: similarity(cleanQuestion, item) }))
    .sort((a, b) => b.score - a.score)[0];

  window.setTimeout(() => {
    addMessage(best && best.score >= config.minimumScore ? best.item.answer : config.fallbackMessage);
  }, 250);
}

async function loadData() {
  setStatus("loading", "Memuat data...");
  reloadButton.disabled = true;
  try {
    if (!config.sheetUrl) {
      knowledgeBase = demoData;
      setStatus("", "Mode demo · atur URL Sheet");
    } else {
      const separator = config.sheetUrl.includes("?") ? "&" : "?";
      const response = await fetch(`${config.sheetUrl}${separator}cache=${Date.now()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      knowledgeBase = rowsToKnowledgeBase(parseCSV(await response.text()));
      if (!knowledgeBase.length) throw new Error("Spreadsheet tidak berisi data");
      setStatus("", `${knowledgeBase.length} jawaban tersedia`);
    }
    showSuggestions();
  } catch (error) {
    knowledgeBase = demoData;
    setStatus("error", "Sheet gagal dimuat · memakai demo");
    console.error("Gagal memuat spreadsheet:", error);
    showSuggestions();
  } finally {
    reloadButton.disabled = false;
  }
}

form.addEventListener("submit", (event) => { event.preventDefault(); ask(input.value); });
reloadButton.addEventListener("click", loadData);

document.title = config.botName;
document.querySelector("h1").textContent = config.botName;
addMessage(config.welcomeMessage);
loadData();
