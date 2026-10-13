// ============================================================
// ADMIN WHATSAPP SENDER & GUEST MANAGEMENT LOGIC - LUKAS & KEZIA
// ============================================================

// Base URL Undangan
// Default selalu mengarah ke https://lukas-kezia.github.io agar tautan WhatsApp dapat dibuka di HP tamu
const BASE_URL = "https://lukas-kezia.github.io";

// Helper: Membuat tautan URL yang 100% URL-Safe untuk WhatsApp & browser
// Mengonversi spasi menjadi '+' dan meng-encode simbol seperti '&', '?', '#', '/', dll.
// Contoh: "Bpk. Toni & Partner" -> "https://lukas-kezia.github.io/?invite=Bpk.+Toni+%26+Partner"
function createSafeInviteUrl(guestName) {
  if (!guestName) return BASE_URL;
  const safeParam = encodeURIComponent(guestName.trim()).replace(/%20/g, "+");
  return `${BASE_URL}/?invite=${safeParam}`;
}

// State Data
let guests = [];
let wishes = [];
let editingGuestId = null;

// Template Preset Defaults
const DEFAULT_TEMPLATES = {
  undangan_formal: `Salam hormat, {Nama}. Semoga senantiasa dalam keadaan sehat dan berbahagia.

Melalui pesan ini kami menyampaikan kabar bahagia sekaligus mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan:

*Lukas Ardianto & Kezia Yunita Santoso*

Merupakan kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu pada hari istimewa kami.

Informasi lengkap mengenai tanggal, waktu, dan lokasi acara dapat diakses melalui tautan berikut:
{URL}

Atas perhatian, kehadiran, dan doa restunya, kami mengucapkan terima kasih yang sebesar‑besarnya.`,

  undangan_santai: `Halo {Nama}! 👋✨

Kabar bahagia untuk kita semua. Kami mengundang {Nama} untuk hadir dan menjadi bagian dari hari bahagia kami berdua:

*The Wedding of Lukas & Kezia* 💍

Detail lengkap tanggal, waktu, dan lokasi resepsi bisa dicek di tautan undangan resmi berikut:
{URL}

Kehadiran serta doa restu dari {Nama} akan sangat berarti buat kami. Sampai jumpa di hari bahagia kami yaaa!

Warm regards,
Lukas & Kezia`,

  pengumuman_santai: `Hallo {Nama}, semoga kabar penuh bahagia ini tiba dengan hangat di hati {Nama} yaaa👋🏻✨

Setelah begitu banyak cerita yang kami lalui, semesta akhirnya mempertemukan kami di titik terindahnya. Perjalanan panjang ini kini menemukan muaranya — kami sedang bersiap memasuki ibadah terpanjang kami. Dengan penuh rasa syukur, kami memohon doa serta restu untuk pernikahan kami yang akan segera berlangsung☺️💛

Mohon maaf sebelumnya, ini bukan undangan yaaaa❌ karena kami memilih merayakannya dengan sederhana dan intim. Doa tulus dari {Nama} sudah lebih dari cukup dan sangat berarti bagi kami berdua🙏🏻✨

Warm hug
🤗
Lukas & Kezia

{URL}`,

  pengumuman_formal: `Salam hormat, {Nama}. Semoga senantiasa dalam keadaan sehat dan penuh berkat.

Melalui pesan ini, perkenankan kami membagikan kabar bahagia atas pernikahan:

*Lukas Ardianto & Kezia Yunita Santoso*

Dengan kerendahan hati, kami memohon doa restu Bapak/Ibu/Saudara/i agar perjalanan rumah tangga kami senantiasa diberkati dan dipenuhi damai sejahtera. Dikarenakan acara diadakan secara sederhana dan terbatas, kiranya doa restu tulus yang diberikan sudah menjadi anugerah yang terindah bagi kami.

Detail kabar bahagia dan doa restu dapat diakses melalui tautan berikut:
{URL}

Terima kasih atas segala doa, kasih, dan perhatian yang senantiasa tercurah.`
};

let currentTemplates = {};

// Inisialisasi
document.addEventListener("DOMContentLoaded", async () => {
  loadTemplates();
  initEventListeners();
  await refreshData();
});

// Load Templates dari LocalStorage atau default
function loadTemplates() {
  const saved = localStorage.getItem("wedding_wa_templates");
  if (saved) {
    try {
      currentTemplates = { ...DEFAULT_TEMPLATES, ...JSON.parse(saved) };
    } catch (e) {
      currentTemplates = { ...DEFAULT_TEMPLATES };
    }
  } else {
    currentTemplates = { ...DEFAULT_TEMPLATES };
  }

  // Isi form template
  const select = document.getElementById("template-selector");
  if (select) {
    select.value = "undangan_formal";
    updateTemplateEditor();
  }
}

function saveTemplates() {
  const currentKey = document.getElementById("template-selector").value;
  const textarea = document.getElementById("template-text");
  currentTemplates[currentKey] = textarea.value;

  localStorage.setItem("wedding_wa_templates", JSON.stringify(currentTemplates));
  alert("✅ Template berhasil disimpan!");
  updatePreview();
}

function resetTemplates() {
  if (confirm("Kembalikan semua template ke teks default?")) {
    currentTemplates = { ...DEFAULT_TEMPLATES };
    localStorage.removeItem("wedding_wa_templates");
    updateTemplateEditor();
    alert("✅ Template dikembalikan ke default!");
  }
}

function updateTemplateEditor() {
  const currentKey = document.getElementById("template-selector").value;
  const textarea = document.getElementById("template-text");
  textarea.value = currentTemplates[currentKey] || "";
  updatePreview();
}

function insertPlaceholder(tag) {
  const textarea = document.getElementById("template-text");
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;
  textarea.value = val.substring(0, start) + tag + val.substring(end);
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + tag.length;
  updatePreview();
}

function updatePreview() {
  const textarea = document.getElementById("template-text");
  const preview = document.getElementById("template-preview");
  const dummyName = "Bapak Budi Santoso";
  const dummyUrl = createSafeInviteUrl(dummyName);

  let text = textarea.value;
  text = text.replace(/{Nama}|{nama}/g, dummyName);
  text = text.replace(/{URL}|{url}/g, dummyUrl);
  text = text.replace(/{Pihak}|{pihak}/g, "Lukas");
  text = text.replace(/{Relasi}|{relasi}/g, "Keluarga / Saudara");

  preview.textContent = text;
}

// Logika Pemilihan Template Otomatis berdasarkan profil tamu
function getSmartTemplateKey(guest) {
  const isPengumuman = guest.type === "pengumuman";
  const isParentSender = ["Bapak Lukas", "Papa Kezia", "Mama Kezia"].includes(guest.sender);
  const isFormalRelation = ["Keluarga / Saudara", "Teman Kerja / Rekan Bisnis"].includes(guest.relation);

  if (isPengumuman) {
    return (isParentSender || isFormalRelation) ? "pengumuman_formal" : "pengumuman_santai";
  } else {
    return (isParentSender || isFormalRelation) ? "undangan_formal" : "undangan_santai";
  }
}

// Format Pesan Tamu
function compileMessageForGuest(guest, templateKeyOverride = null) {
  const key = templateKeyOverride || getSmartTemplateKey(guest);
  const rawTemplate = currentTemplates[key] || DEFAULT_TEMPLATES[key] || DEFAULT_TEMPLATES.undangan_formal;
  const inviteUrl = createSafeInviteUrl(guest.name);

  let message = rawTemplate;
  message = message.replace(/{Nama}|{nama}/g, guest.name);
  message = message.replace(/{URL}|{url}/g, inviteUrl);
  message = message.replace(/{Pihak}|{pihak}/g, guest.sender || "Lukas & Kezia");
  message = message.replace(/{Relasi}|{relasi}/g, guest.relation || "");

  return message;
}

// Normalisasi Nomor WhatsApp (08xxx -> 628xxx)
function formatPhoneNumber(phone) {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("08")) {
    digits = "628" + digits.substring(2);
  } else if (digits.startsWith("8")) {
    digits = "62" + digits;
  }
  return digits;
}

// Tarik Data dari Database
async function refreshData() {
  const refreshBtn = document.getElementById("btn-refresh");
  if (refreshBtn) refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat...';

  try {
    guests = await GuestsAPI.getAll();
    if (!Array.isArray(guests)) guests = [];
    renderTable();
    updateStats();
    loadWishesAdmin();
  } catch (err) {
    console.error("Gagal menarik data:", err);
    alert("Terjadi kesalahan saat memuat data tamu: " + err.message);
  } finally {
    if (refreshBtn) refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Tarik Data';
  }
}

// Render Tabel Kontak
function renderTable() {
  const tbody = document.getElementById("guests-table-body");
  const search = (document.getElementById("filter-search").value || "").toLowerCase().trim();
  const filterType = document.getElementById("filter-type").value;
  const filterSender = document.getElementById("filter-sender").value;
  const filterRelation = document.getElementById("filter-relation").value;
  const filterStatus = document.getElementById("filter-status").value;

  const filtered = guests.filter(g => {
    const matchSearch = (g.name || "").toLowerCase().includes(search) || (g.phone || "").includes(search);
    const matchType = filterType === "all" || g.type === filterType;
    const matchSender = filterSender === "all" || g.sender === filterSender;
    const matchRelation = filterRelation === "all" || g.relation === filterRelation;
    const matchStatus = filterStatus === "all" || g.status === filterStatus;
    return matchSearch && matchType && matchSender && matchRelation && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">
          <div class="empty-state">
            <i class="fas fa-user-friends"></i>
            <p>Tidak ada data tamu yang cocok dengan filter pencarian.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((g, idx) => {
    const isSent = g.status === "terkirim";
    const statusBadge = isSent
      ? `<span class="badge badge-sent"><i class="fas fa-check"></i> Terkirim</span>`
      : `<span class="badge badge-pending"><i class="fas fa-clock"></i> Pending</span>`;

    const typeBadge = g.type === "pengumuman"
      ? `<span class="badge badge-pengumuman">📢 Pengumuman</span>`
      : `<span class="badge badge-undangan">💌 Undangan</span>`;

    const smartKey = getSmartTemplateKey(g);
    const templateLabel = {
      undangan_formal: "Undangan Formal",
      undangan_santai: "Undangan Santai",
      pengumuman_formal: "Pengumuman Formal",
      pengumuman_santai: "Pengumuman Santai"
    }[smartKey] || "Formal";

    const inviteLink = createSafeInviteUrl(g.name);

    return `
      <tr data-id="${g.id}">
        <td style="text-align: center; color: #888;">${idx + 1}</td>
        <td>
          <strong style="color: #243324; font-size: 0.95rem;">${escapeHtml(g.name)}</strong>
        </td>
        <td>
          <span style="font-family: monospace; color: #444;">${g.phone ? g.phone : '<span style="color:#aaa;">-</span>'}</span>
        </td>
        <td>${typeBadge}</td>
        <td>
          <span style="font-size: 0.85rem; color: #555;">${escapeHtml(g.relation || "-")}</span>
        </td>
        <td>
          <span class="badge badge-sender">${escapeHtml(g.sender || "-")}</span>
        </td>
        <td>
          <span style="font-size: 0.78rem; color: #666; background: #eee; padding: 2px 6px; border-radius: 4px;">${templateLabel}</span>
        </td>
        <td>
          <button class="link-pill" onclick="copyGuestLink('${encodeURIComponent(g.name)}')" title="Salin Link">
            <i class="fas fa-copy"></i> Salin
          </button>
          <a href="${inviteLink}" target="_blank" class="link-pill" style="margin-left: 4px;" title="Cek Halaman">
            <i class="fas fa-external-link-alt"></i>
          </a>
        </td>
        <td>${statusBadge}</td>
        <td>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button class="btn-whatsapp ${isSent ? 'sent' : ''}" onclick="sendWhatsApp('${g.id}')" title="Kirim Pesan WhatsApp">
              <i class="fab fa-whatsapp"></i> ${isSent ? 'Kirim Ulang' : 'Kirim'}
            </button>
            <button class="btn-icon-sm" onclick="openEditModal('${g.id}')" title="Edit Tamu">
              <i class="fas fa-pencil-alt"></i>
            </button>
            <button class="btn-icon-sm delete" onclick="confirmDeleteGuest('${g.id}')" title="Hapus Tamu">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// Kirim Pesan WhatsApp
async function sendWhatsApp(guestId) {
  const guest = guests.find(g => g.id === guestId);
  if (!guest) return;

  const phone = formatPhoneNumber(guest.phone);
  if (!phone) {
    alert("⚠️ Nomor WhatsApp tamu belum diisi atau tidak valid.");
    return;
  }

  const message = compileMessageForGuest(guest);
  const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;

  // Buka WhatsApp
  window.open(waUrl, "_blank");

  // Tandai sebagai terkirim di database
  try {
    const updated = await GuestsAPI.update(guestId, {
      status: "terkirim",
      sent_at: new Date().toISOString()
    });

    if (updated) {
      guest.status = "terkirim";
      guest.sent_at = updated.sent_at;
      renderTable();
      updateStats();
    }
  } catch (err) {
    console.warn("Gagal memperbarui status terkirim:", err);
  }
}

// Salin Link Undangan Tamu
function copyGuestLink(rawOrEncodedName) {
  const decoded = decodeURIComponent(rawOrEncodedName);
  const url = createSafeInviteUrl(decoded);
  navigator.clipboard.writeText(url).then(() => {
    alert("✅ Tautan undangan berhasil disalin:\n" + url);
  }).catch(() => {
    prompt("Salin tautan berikut:", url);
  });
}

// Update Statistik & Dashboard
function updateStats() {
  const total = guests.length;
  const sent = guests.filter(g => g.status === "terkirim").length;
  const pending = total - sent;
  const undangan = guests.filter(g => g.type === "undangan").length;
  const pengumuman = guests.filter(g => g.type === "pengumuman").length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-undangan").textContent = undangan;
  document.getElementById("stat-pengumuman").textContent = pengumuman;
  document.getElementById("stat-sent").textContent = sent;
  document.getElementById("stat-pending").textContent = pending;

  const pct = total > 0 ? Math.round((sent / total) * 100) : 0;
  document.getElementById("progress-percentage").textContent = pct + "%";
  document.getElementById("progress-bar").style.width = pct + "%";
}

// Load Ucapan Tamu Masuk (Wishes)
async function loadWishesAdmin() {
  const container = document.getElementById("wishes-feed");
  if (!container) return;

  try {
    wishes = await WishesAPI.getAll();
    if (!wishes || wishes.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <i class="fas fa-envelope-open"></i>
          <p>Belum ada ucapan doa restu yang masuk dari tamu.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = wishes.map(w => {
      const date = w.created_at ? new Date(w.created_at).toLocaleString("id-ID") : "-";
      return `
        <div class="wish-item glass">
          <div class="wish-header">
            <span class="wish-name">💌 ${escapeHtml(w.name)}</span>
            <span class="wish-time">${date}</span>
          </div>
          <p class="wish-text">${escapeHtml(w.message)}</p>
        </div>
      `;
    }).join("");
  } catch (err) {
    console.error("Gagal memuat ucapan:", err);
  }
}

// Modal Tambah / Edit Tamu
function openAddModal() {
  editingGuestId = null;
  document.getElementById("modal-guest-title").textContent = "Tambah Tamu Baru";
  document.getElementById("guest-form").reset();
  document.getElementById("guest-status").value = "pending";
  document.getElementById("modal-guest").classList.add("active");
}

function openEditModal(id) {
  const guest = guests.find(g => g.id === id);
  if (!guest) return;

  editingGuestId = id;
  document.getElementById("modal-guest-title").textContent = "Edit Data Tamu";
  document.getElementById("guest-name").value = guest.name || "";
  document.getElementById("guest-phone").value = guest.phone || "";
  document.getElementById("guest-type").value = guest.type || "undangan";
  document.getElementById("guest-relation").value = guest.relation || "Lainnya";
  document.getElementById("guest-sender").value = guest.sender || "Lukas";
  document.getElementById("guest-status").value = guest.status || "pending";
  document.getElementById("modal-guest").classList.add("active");
}

function closeGuestModal() {
  document.getElementById("modal-guest").classList.remove("active");
}

async function handleSaveGuest(e) {
  e.preventDefault();

  const name = document.getElementById("guest-name").value.trim();
  const rawPhone = document.getElementById("guest-phone").value.trim();
  const phone = formatPhoneNumber(rawPhone);
  const type = document.getElementById("guest-type").value;
  const relation = document.getElementById("guest-relation").value;
  const sender = document.getElementById("guest-sender").value;
  const status = document.getElementById("guest-status").value;

  if (!name) {
    alert("Harap isi nama tamu!");
    return;
  }

  const payload = {
    name,
    phone,
    type,
    relation,
    sender,
    status
  };

  const submitBtn = document.getElementById("btn-submit-guest");
  submitBtn.disabled = true;
  submitBtn.textContent = "Menyimpan...";

  try {
    if (editingGuestId) {
      await GuestsAPI.update(editingGuestId, payload);
    } else {
      await GuestsAPI.create(payload);
    }

    closeGuestModal();
    await refreshData();
    alert("✅ Data tamu berhasil disimpan!");
  } catch (err) {
    console.error("Gagal menyimpan tamu:", err);
    alert("Terjadi kesalahan saat menyimpan: " + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Simpan Data";
  }
}

async function confirmDeleteGuest(id) {
  const guest = guests.find(g => g.id === id);
  if (!guest) return;

  if (confirm(`Apakah Anda yakin ingin menghapus "${guest.name}" dari daftar tamu?`)) {
    try {
      await GuestsAPI.delete(id);
      await refreshData();
    } catch (err) {
      alert("Gagal menghapus: " + err.message);
    }
  }
}

// Reset semua status ke pending
async function resetAllStatuses() {
  if (!confirm("Apakah Anda yakin ingin mereset semua status pengiriman menjadi 'Pending'?")) return;

  for (const g of guests) {
    if (g.status === "terkirim") {
      try {
        await GuestsAPI.update(g.id, { status: "pending", sent_at: null });
      } catch (e) {}
    }
  }
  await refreshData();
  alert("✅ Seluruh status berhasil direset!");
}

// Ekspor ke CSV
function exportToCSV() {
  if (guests.length === 0) {
    alert("Belum ada data tamu untuk diekspor!");
    return;
  }

  const headers = ["Nama Tamu", "Nomor WhatsApp", "Tipe", "Relasi", "Pihak Pengundang", "Status", "Link Undangan"];
  const rows = guests.map(g => [
    `"${(g.name || '').replace(/"/g, '""')}"`,
    `"${g.phone || ''}"`,
    `"${g.type || 'undangan'}"`,
    `"${g.relation || ''}"`,
    `"${g.sender || ''}"`,
    `"${g.status || 'pending'}"`,
    `"${createSafeInviteUrl(g.name)}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Daftar_Tamu_Lukas_Kezia_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Download CSV Template
function downloadCSVTemplate() {
  const headers = ["Nama Tamu", "Nomor WhatsApp", "Tipe (undangan/pengumuman)", "Relasi", "Pihak (Lukas/Bapak Lukas/Kezia/Papa Kezia/Mama Kezia)"];
  const sample = [
    `"Budi Santoso","081234567890","undangan","Teman Sekolah","Lukas"`,
    `"Keluarga Bpk. Handoko","081987654321","undangan","Keluarga / Saudara","Bapak Lukas"`,
    `"Rina Wijaya","08512345678","pengumuman","Teman Kuliah","Kezia"`
  ];

  const content = "\uFEFF" + [headers.join(","), ...sample].join("\r\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "Template_Import_Tamu.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Import dari CSV
async function importFromCSV(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const text = e.target.result;
    const lines = text.split(/\r\n|\n/).filter(l => l.trim() !== "");
    if (lines.length <= 1) {
      alert("Berkas CSV kosong atau hanya berisi baris judul.");
      return;
    }

    let addedCount = 0;
    // Lewati baris 0 (header)
    for (let i = 1; i < lines.length; i++) {
      const parts = parseCSVLine(lines[i]);
      if (parts.length >= 1 && parts[0].trim() !== "") {
        const name = parts[0].trim();
        const phone = formatPhoneNumber(parts[1] || "");
        const rawType = (parts[2] || "").toLowerCase().trim();
        const type = rawType.includes("pengumuman") ? "pengumuman" : "undangan";
        const relation = parts[3] ? parts[3].trim() : "Lainnya";
        const sender = parts[4] ? parts[4].trim() : "Lukas";

        try {
          await GuestsAPI.create({
            name,
            phone,
            type,
            relation,
            sender,
            status: "pending"
          });
          addedCount++;
        } catch (err) {
          console.warn("Gagal menambahkan baris CSV:", lines[i], err);
        }
      }
    }

    alert(`✅ Berhasil mengimpor ${addedCount} tamu baru!`);
    await refreshData();
  };
  reader.readAsText(file);
}

// Simple CSV parser supporting quotes
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

// Helper XSS Escape
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Inisialisasi Event Listener
function initEventListeners() {
  // Nav tabs
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");

      btn.classList.add("active");
      const target = document.getElementById(btn.getAttribute("data-tab"));
      if (target) target.style.display = "block";
    });
  });

  // Filter input listeners
  ["filter-search", "filter-type", "filter-sender", "filter-relation", "filter-status"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", renderTable);
  });

  // Template editor selector
  const tmplSelector = document.getElementById("template-selector");
  if (tmplSelector) {
    tmplSelector.addEventListener("change", updateTemplateEditor);
  }

  const tmplText = document.getElementById("template-text");
  if (tmplText) {
    tmplText.addEventListener("input", updatePreview);
  }

  // Import file listener
  const csvInput = document.getElementById("csv-file-input");
  if (csvInput) {
    csvInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        importFromCSV(e.target.files[0]);
        e.target.value = "";
      }
    });
  }
}
