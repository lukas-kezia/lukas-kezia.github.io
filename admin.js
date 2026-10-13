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
let donutChartInstance = null;
let stackedBarChartInstance = null;
let chartMode = "pax"; // "pax" atau "count"

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
  text = text.replace(/{Pax}|{pax}/g, "2");
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
  const paxStr = (guest.pax || 1).toString();

  let message = rawTemplate;
  message = message.replace(/{Nama}|{nama}/g, guest.name);
  message = message.replace(/{Pax}|{pax}/g, paxStr);
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
    const [fetchedGuests, fetchedWishes] = await Promise.all([
      GuestsAPI.getAll(),
      WishesAPI.getAll()
    ]);
    guests = Array.isArray(fetchedGuests) ? fetchedGuests : [];
    wishes = Array.isArray(fetchedWishes) ? fetchedWishes : [];
    renderTable();
    updateStats();
    renderWishesFeed();
  } catch (err) {
    console.error("Gagal menarik data:", err);
    alert("Terjadi kesalahan saat memuat data: " + err.message);
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
  const filterSort = document.getElementById("filter-sort")?.value || "created_asc";

  let filtered = guests.filter(g => {
    const matchSearch = (g.name || "").toLowerCase().includes(search) || (g.phone || "").includes(search);
    const matchType = filterType === "all" ||
      (filterType === "undangan_digital" && (g.type === "undangan_digital" || g.type === "undangan")) ||
      (filterType === "undangan_fisik" && g.type === "undangan_fisik") ||
      (filterType === "pengumuman" && g.type === "pengumuman") ||
      g.type === filterType;
    const matchSender = filterSender === "all" || g.sender === filterSender;
    const matchRelation = filterRelation === "all" || g.relation === filterRelation;
    const matchStatus = filterStatus === "all" || g.status === filterStatus;
    return matchSearch && matchType && matchSender && matchRelation && matchStatus;
  });

  // Sorting
  if (filterSort === "name_asc") {
    filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  } else if (filterSort === "name_desc") {
    filtered.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
  } else if (filterSort === "created_desc") {
    filtered.sort((a, b) => (new Date(b.created_at || 0)) - (new Date(a.created_at || 0)));
  } else if (filterSort === "sender") {
    filtered.sort((a, b) => (a.sender || "").localeCompare(b.sender || ""));
  } else if (filterSort === "status_pending") {
    filtered.sort((a, b) => (a.status === "pending" ? -1 : 1));
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10">
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

    let typeBadge = "";
    if (g.type === "pengumuman") {
      typeBadge = `<span class="badge badge-pengumuman">📢 Pengumuman</span>`;
    } else if (g.type === "undangan_fisik") {
      typeBadge = `<span class="badge badge-undangan-fisik">📜 Fisik</span>`;
    } else {
      typeBadge = `<span class="badge badge-undangan">💌 Digital</span>`;
    }

    const smartKey = getSmartTemplateKey(g);
    const templateLabel = {
      undangan_formal: "Undangan Formal",
      undangan_santai: "Undangan Santai",
      pengumuman_formal: "Pengumuman Formal",
      pengumuman_santai: "Pengumuman Santai"
    }[smartKey] || "Formal";

    const inviteLink = createSafeInviteUrl(g.name);
    const pax = parseInt(g.pax, 10) || 1;
    const paxBadge = pax > 1
      ? `<span class="badge badge-pax-group" title="${pax} Pax (Grup/Keluarga)">${pax} Pax</span>`
      : `<span class="badge badge-pax" title="1 Pax (Personal)">1 Pax</span>`;

    return `
      <tr data-id="${g.id}">
        <td style="text-align: center; color: #888;">${idx + 1}</td>
        <td>
          <strong style="color: #243324; font-size: 0.95rem;">${escapeHtml(g.name)}</strong>
        </td>
        <td>
          <span style="font-family: monospace; color: #444;">${g.phone ? g.phone : '<span style="color:#aaa;">-</span>'}</span>
        </td>
        <td style="text-align: center;">${paxBadge}</td>
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

// Toggle Mode Hitung Chart (Pax vs Kontak)
function setChartMode(mode) {
  chartMode = mode;
  const btnPax = document.getElementById("btn-chart-mode-pax");
  const btnCount = document.getElementById("btn-chart-mode-count");
  if (btnPax) btnPax.classList.toggle("active", mode === "pax");
  if (btnCount) btnCount.classList.toggle("active", mode === "count");
  updateStats();
}

// Update Statistik & Dashboard
function updateStats() {
  const total = guests.length;
  const sent = guests.filter(g => g.status === "terkirim").length;
  const pending = total - sent;

  // Hitung Pax
  const totalPax = guests.reduce((sum, g) => sum + (parseInt(g.pax, 10) || 1), 0);
  const digitalPax = guests.filter(g => g.type === "undangan_digital" || g.type === "undangan" || !g.type)
                           .reduce((sum, g) => sum + (parseInt(g.pax, 10) || 1), 0);
  const fisikPax = guests.filter(g => g.type === "undangan_fisik")
                         .reduce((sum, g) => sum + (parseInt(g.pax, 10) || 1), 0);
  const pengumumanPax = guests.filter(g => g.type === "pengumuman")
                              .reduce((sum, g) => sum + (parseInt(g.pax, 10) || 1), 0);
  const resepsiPax = digitalPax + fisikPax;

  // Hitung Undangan (Baris Kontak)
  const digital = guests.filter(g => g.type === "undangan_digital" || g.type === "undangan" || !g.type).length;
  const fisik = guests.filter(g => g.type === "undangan_fisik").length;
  const pengumuman = guests.filter(g => g.type === "pengumuman").length;

  // Update KPI Cards
  const statTotal = document.getElementById("stat-total");
  if (statTotal) statTotal.textContent = total;

  const statTotalPax = document.getElementById("stat-total-pax");
  if (statTotalPax) statTotalPax.textContent = totalPax + " Pax";

  const statSent = document.getElementById("stat-sent");
  if (statSent) statSent.textContent = sent;

  const statPending = document.getElementById("stat-pending");
  if (statPending) statPending.textContent = pending;

  const pct = total > 0 ? Math.round((sent / total) * 100) : 0;
  const statProgressPct = document.getElementById("stat-progress-pct");
  if (statProgressPct) statProgressPct.textContent = pct + "%";

  const statWishesCount = document.getElementById("stat-wishes-count");
  if (statWishesCount) statWishesCount.textContent = wishes.length;

  const sidebarBadge = document.getElementById("sidebar-wishes-badge");
  if (sidebarBadge) sidebarBadge.textContent = wishes.length;

  // Update Rekap Banner Pax Katering & Kursi
  const elRecapTotal = document.getElementById("recap-total-pax");
  if (elRecapTotal) elRecapTotal.textContent = totalPax + " Pax";

  const elRecapResepsi = document.getElementById("recap-pax-resepsi");
  if (elRecapResepsi) elRecapResepsi.textContent = resepsiPax + " Pax";

  const elRecapFisik = document.getElementById("recap-pax-fisik");
  if (elRecapFisik) elRecapFisik.textContent = fisikPax + " Pax";

  const elRecapDigital = document.getElementById("recap-pax-digital");
  if (elRecapDigital) elRecapDigital.textContent = digitalPax + " Pax";

  const elRecapPengumuman = document.getElementById("recap-pax-pengumuman");
  if (elRecapPengumuman) elRecapPengumuman.textContent = pengumumanPax + " Pax";

  // Update Legenda Donut
  const digitalPct = total > 0 ? Math.round((digital / total) * 100) : 0;
  const fisikPct = total > 0 ? Math.round((fisik / total) * 100) : 0;
  const pengumumanPct = total > 0 ? Math.round((pengumuman / total) * 100) : 0;

  const elDigCount = document.getElementById("legend-digital-count");
  if (elDigCount) elDigCount.textContent = `${digital} (${digitalPax}p)`;
  const elDigPct = document.getElementById("legend-digital-pct");
  if (elDigPct) elDigPct.textContent = `(${digitalPct}%)`;

  const elFisCount = document.getElementById("legend-fisik-count");
  if (elFisCount) elFisCount.textContent = `${fisik} (${fisikPax}p)`;
  const elFisPct = document.getElementById("legend-fisik-pct");
  if (elFisPct) elFisPct.textContent = `(${fisikPct}%)`;

  const elPengCount = document.getElementById("legend-pengumuman-count");
  if (elPengCount) elPengCount.textContent = `${pengumuman} (${pengumumanPax}p)`;
  const elPengPct = document.getElementById("legend-pengumuman-pct");
  if (elPengPct) elPengPct.textContent = `(${pengumumanPct}%)`;

  // Render / Update Charts
  updateDashboardCharts(digital, fisik, pengumuman);
}

// Render / Update Grafik Dashboard (Chart.js)
function updateDashboardCharts(digital, fisik, pengumuman) {
  if (typeof Chart === "undefined") return;

  // 1. DONUT CHART (Row 1)
  const canvasDonut = document.getElementById("chart-invitation-donut");
  if (canvasDonut) {
    if (donutChartInstance) {
      donutChartInstance.destroy();
    }

    const ctxDonut = canvasDonut.getContext("2d");
    donutChartInstance = new Chart(ctxDonut, {
      type: "doughnut",
      data: {
        labels: ["Undangan Digital", "Undangan Fisik", "Pengumuman Saja"],
        datasets: [{
          data: [digital, fisik, pengumuman],
          backgroundColor: ["#3b5d3b", "#c5a059", "#8f3115"],
          hoverBackgroundColor: ["#263d26", "#ab8841", "#6e210b"],
          borderWidth: 3,
          borderColor: "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const val = ctx.raw || 0;
                const p = total > 0 ? Math.round((val / total) * 100) : 0;
                return ` ${ctx.label}: ${val} Tamu (${p}%)`;
              }
            }
          }
        }
      }
    });
  }

  // 2. STACKED BAR CHART (Row 2): Pihak Pengundang x Jenis Undangan
  const canvasBar = document.getElementById("chart-stacked-bar");
  if (canvasBar) {
    if (stackedBarChartInstance) {
      stackedBarChartInstance.destroy();
    }

    const senders = ["Lukas", "Bapak Lukas", "Kezia", "Papa Kezia", "Mama Kezia"];
    const digitalPerSender = senders.map(s =>
      guests.filter(g => g.sender === s && (g.type === "undangan_digital" || g.type === "undangan" || !g.type))
            .reduce((sum, g) => sum + (chartMode === "pax" ? (parseInt(g.pax, 10) || 1) : 1), 0)
    );
    const fisikPerSender = senders.map(s =>
      guests.filter(g => g.sender === s && g.type === "undangan_fisik")
            .reduce((sum, g) => sum + (chartMode === "pax" ? (parseInt(g.pax, 10) || 1) : 1), 0)
    );
    const pengumumanPerSender = senders.map(s =>
      guests.filter(g => g.sender === s && g.type === "pengumuman")
            .reduce((sum, g) => sum + (chartMode === "pax" ? (parseInt(g.pax, 10) || 1) : 1), 0)
    );

    const ctxBar = canvasBar.getContext("2d");
    stackedBarChartInstance = new Chart(ctxBar, {
      type: "bar",
      data: {
        labels: senders,
        datasets: [
          {
            label: "Undangan Digital",
            data: digitalPerSender,
            backgroundColor: "#3b5d3b",
            borderRadius: 4
          },
          {
            label: "Undangan Fisik",
            data: fisikPerSender,
            backgroundColor: "#c5a059",
            borderRadius: 4
          },
          {
            label: "Pengumuman Saja",
            data: pengumumanPerSender,
            backgroundColor: "#8f3115",
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: {
              font: { family: "'Plus Jakarta Sans', sans-serif", weight: "600", size: 12 },
              color: "#2f3e2f"
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: "rgba(59, 93, 59, 0.08)" },
            ticks: {
              stepSize: chartMode === "pax" ? 10 : 5,
              font: { family: "'Plus Jakarta Sans', sans-serif" },
              color: "#5e705e"
            }
          }
        },
        plugins: {
          legend: {
            position: "top",
            labels: {
              boxWidth: 14,
              font: { family: "'Plus Jakarta Sans', sans-serif", weight: "600", size: 12 },
              color: "#243324",
              padding: 16
            }
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: function(ctx) {
                return ` ${ctx.dataset.label}: ${ctx.raw} ${chartMode === "pax" ? "Pax" : "Kontak"}`;
              }
            }
          }
        }
      }
    });
  }
}

// Navigasi Pindah View Sidebar
function switchView(viewId, btnEl) {
  document.querySelectorAll(".sidebar-nav .nav-item").forEach(el => el.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");

  document.querySelectorAll(".admin-view").forEach(v => v.classList.remove("active"));
  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.add("active");

  const titleEl = document.getElementById("top-title");
  const subEl = document.getElementById("top-subtitle");

  const viewTitles = {
    "view-dashboard": {
      title: "Dashboard Analitik",
      sub: "Visualisasi distribusi undangan, kuota pengundang, dan metrik kirim"
    },
    "view-spreadsheet": {
      title: "Data Tamu (Spreadsheet Grid)",
      sub: "Edit langsung pada sel tabel atau paste banyak data sekaligus dari Excel"
    },
    "view-messages": {
      title: "Kirim Pesan & Broadcast WhatsApp",
      sub: "Kirim tautan undangan ke kontak tamu dengan format template otomatis"
    },
    "view-wishes": {
      title: "Doa Restu & Ucapan Tamu",
      sub: "Daftar ucapan dan doa yang dikirimkan oleh tamu undangan melalui website"
    }
  };

  if (viewTitles[viewId]) {
    if (titleEl) titleEl.textContent = viewTitles[viewId].title;
    if (subEl) subEl.textContent = viewTitles[viewId].sub;
  }

  if (viewId === "view-spreadsheet") {
    loadSpreadsheetFromGuests();
  } else if (viewId === "view-dashboard") {
    updateStats();
  }
}

// Sub-tab di View Kirim Pesan
function switchMessagesSubTab(subTab) {
  const btnList = document.getElementById("subtab-btn-list");
  const btnTmpl = document.getElementById("subtab-btn-templates");
  const subList = document.getElementById("messages-sub-list");
  const subTmpl = document.getElementById("messages-sub-templates");

  if (subTab === "list") {
    btnList.classList.add("active");
    btnTmpl.classList.remove("active");
    subList.style.display = "block";
    subTmpl.style.display = "none";
  } else {
    btnList.classList.remove("active");
    btnTmpl.classList.add("active");
    subList.style.display = "none";
    subTmpl.style.display = "block";
  }
}

// Filter Interaktif via Klik Legenda Chart
function filterByChartType(type) {
  const navBtn = document.querySelector(".sidebar-nav .nav-item[data-view='view-messages']");
  switchView("view-messages", navBtn);
  switchMessagesSubTab("list");

  const select = document.getElementById("filter-type");
  if (select) {
    select.value = type;
    renderTable();
  }
}

function toggleSidebarMobile() {
  const sidebar = document.getElementById("admin-sidebar");
  if (sidebar) sidebar.classList.toggle("mobile-open");
}

// Load Ucapan Tamu Masuk (Wishes)
async function loadWishesAdmin() {
  try {
    wishes = await WishesAPI.getAll();
    if (!Array.isArray(wishes)) wishes = [];
    updateStats();
    renderWishesFeed();
  } catch (err) {
    console.error("Gagal memuat ucapan:", err);
  }
}

// Render Kartu-Kartu Ucapan Masuk
function renderWishesFeed() {
  const container = document.getElementById("wishes-feed");
  if (!container) return;

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
}

// Modal Tambah / Edit Tamu
function openAddModal() {
  editingGuestId = null;
  document.getElementById("modal-guest-title").textContent = "Tambah Tamu Baru";
  document.getElementById("guest-form").reset();
  const paxEl = document.getElementById("guest-pax");
  if (paxEl) paxEl.value = "1";
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
  const paxEl = document.getElementById("guest-pax");
  if (paxEl) paxEl.value = (guest.pax || 1).toString();
  document.getElementById("guest-type").value = (guest.type === "undangan" ? "undangan_digital" : (guest.type || "undangan_digital"));
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
  const pax = parseInt(document.getElementById("guest-pax")?.value || "1", 10) || 1;
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
    pax,
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

  const headers = ["Nama Tamu", "Nomor WhatsApp", "Pax", "Kategori", "Relasi", "Pihak Pengundang", "Status", "Link Undangan"];
  const rows = guests.map(g => [
    `"${(g.name || '').replace(/"/g, '""')}"`,
    `"${g.phone || ''}"`,
    `"${parseInt(g.pax, 10) || 1}"`,
    `"${g.type || 'undangan_digital'}"`,
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
  const headers = ["Nama Tamu", "Nomor WhatsApp", "Pax", "Kategori (undangan_digital/undangan_fisik/pengumuman)", "Relasi", "Pihak (Lukas/Bapak Lukas/Kezia/Papa Kezia/Mama Kezia)"];
  const sample = [
    `"Budi Santoso","081234567890","1","undangan_digital","Teman Sekolah","Lukas"`,
    `"Teman Sekolah SMP N 1","081987654321","10","undangan_digital","Teman Sekolah","Lukas"`,
    `"Keluarga Bpk. Handoko","081987654321","4","undangan_fisik","Keluarga / Saudara","Bapak Lukas"`,
    `"Rina Wijaya","08512345678","1","pengumuman","Teman Kuliah","Kezia"`
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
      if (parts.length >= 1 && parts[0].trim() !== "") {
        const name = parts[0].trim();
        const phone = formatPhoneNumber(parts[1] || "");
        let pax = 1;
        let typeCol = parts[2] || "";
        let relationCol = parts[3] || "";
        let senderCol = parts[4] || "";

        // Jika kolom ke-3 adalah angka (pax)
        if (/^\d+$/.test(typeCol.trim())) {
          pax = parseInt(typeCol.trim(), 10) || 1;
          typeCol = parts[3] || "";
          relationCol = parts[4] || "";
          senderCol = parts[5] || "";
        }

        const rawType = typeCol.toLowerCase().trim();
        let type = "undangan_digital";
        if (rawType.includes("pengumuman")) type = "pengumuman";
        else if (rawType.includes("fisik")) type = "undangan_fisik";

        const relation = relationCol ? relationCol.trim() : "Lainnya";
        const sender = senderCol ? senderCol.trim() : "Lukas";

        try {
          await GuestsAPI.create({
            name,
            phone,
            pax,
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
  ["filter-search", "filter-type", "filter-sender", "filter-relation", "filter-status", "filter-sort"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", renderTable);
      el.addEventListener("change", renderTable);
    }
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

  // Keyboard shortcut Ctrl+S untuk simpan spreadsheet
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      const sheetTab = document.getElementById("tab-spreadsheet");
      if (sheetTab && sheetTab.style.display !== "none") {
        e.preventDefault();
        saveAllSpreadsheetChanges();
      }
    }
  });

  // Listener tab spreadsheet
  const sheetTabBtn = document.getElementById("tab-btn-spreadsheet");
  if (sheetTabBtn) {
    sheetTabBtn.addEventListener("click", () => {
      loadSpreadsheetFromGuests();
    });
  }
}

// ============================================================
// SPREADSHEET GRID EDITOR LOGIC
// ============================================================

const SHEET_TYPES = [
  { val: "undangan_digital", label: "💌 Undangan Digital" },
  { val: "undangan_fisik", label: "📜 Undangan Fisik" },
  { val: "pengumuman", label: "📢 Pengumuman Saja" }
];

const SHEET_RELATIONS = [
  "Keluarga / Saudara",
  "Teman Sekolah",
  "Teman Kuliah",
  "Teman Kerja / Rekan Bisnis",
  "Jemaat / Pelayanan Gereja",
  "Sahabat Dekat",
  "Lainnya"
];

const SHEET_SENDERS = [
  "Lukas",
  "Bapak Lukas",
  "Kezia",
  "Papa Kezia",
  "Mama Kezia"
];

const SHEET_STATUSES = [
  { val: "pending", label: "Pending" },
  { val: "terkirim", label: "Terkirim" }
];

let spreadsheetData = [];
let dirtyRowIds = new Set();
let deletedGuestIds = new Set();
let newRowTempId = 1;

// Pindah tab ke spreadsheet
function switchToSpreadsheetTab() {
  const tabBtn = document.getElementById("tab-btn-spreadsheet");
  if (tabBtn) tabBtn.click();
}

// Muat data dari guests ke spreadsheetData
function loadSpreadsheetFromGuests() {
  spreadsheetData = guests.map(g => ({
    id: g.id,
    name: g.name || "",
    phone: g.phone || "",
    pax: parseInt(g.pax, 10) || 1,
    type: (g.type === "undangan" ? "undangan_digital" : (g.type || "undangan_digital")),
    relation: g.relation || "Lainnya",
    sender: g.sender || "Lukas",
    status: g.status || "pending",
    isNew: false
  }));

  dirtyRowIds.clear();
  deletedGuestIds.clear();
  updateDirtyBadge();
  renderSpreadsheetTable();
}

// Render Tabel Spreadsheet
function renderSpreadsheetTable() {
  const tbody = document.getElementById("spreadsheet-tbody");
  if (!tbody) return;

  const filterText = (document.getElementById("sheet-filter")?.value || "").toLowerCase().trim();
  const filterType = document.getElementById("sheet-filter-type")?.value || "all";
  const filterSender = document.getElementById("sheet-filter-sender")?.value || "all";
  const filterStatus = document.getElementById("sheet-filter-status")?.value || "all";
  const sheetSort = document.getElementById("sheet-sort")?.value || "created_asc";

  // Hitung live recap pax dan kontak di spreadsheet
  const totalPaxInSheet = spreadsheetData.reduce((s, r) => s + (parseInt(r.pax, 10) || 1), 0);
  const totalCountInSheet = spreadsheetData.length;
  const badgePax = document.getElementById("sheet-summary-pax");
  const badgeCount = document.getElementById("sheet-summary-count");
  if (badgePax) badgePax.textContent = totalPaxInSheet;
  if (badgeCount) badgeCount.textContent = totalCountInSheet;

  let filtered = spreadsheetData.filter(row => {
    const matchSearch = !filterText || (
      (row.name || "").toLowerCase().includes(filterText) ||
      (row.phone || "").includes(filterText) ||
      (row.relation || "").toLowerCase().includes(filterText) ||
      (row.sender || "").toLowerCase().includes(filterText)
    );
    const matchType = filterType === "all" ||
      (filterType === "undangan_digital" && (row.type === "undangan_digital" || row.type === "undangan")) ||
      (filterType === "undangan_fisik" && row.type === "undangan_fisik") ||
      (filterType === "pengumuman" && row.type === "pengumuman") ||
      row.type === filterType;
    const matchSender = filterSender === "all" || row.sender === filterSender;
    const matchStatus = filterStatus === "all" || row.status === filterStatus;
    return matchSearch && matchType && matchSender && matchStatus;
  });

  // Sorting
  if (sheetSort === "name_asc") {
    filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  } else if (sheetSort === "name_desc") {
    filtered.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
  } else if (sheetSort === "created_desc") {
    filtered = [...filtered].reverse();
  } else if (sheetSort === "sender") {
    filtered.sort((a, b) => (a.sender || "").localeCompare(b.sender || ""));
  } else if (sheetSort === "status_pending") {
    filtered.sort((a, b) => (a.status === "pending" ? -1 : 1));
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px; color: #888;">
          <i class="fas fa-table" style="font-size: 32px; color: #bbb; margin-bottom: 10px; display: block;"></i>
          ${spreadsheetData.length === 0 ? 'Belum ada baris data. Klik <strong>+1 Baris</strong> atau <strong>Paste dari Excel</strong> untuk memulai.' : 'Tidak ada data tamu yang cocok dengan filter.'}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((row, idx) => {
    const isDirty = dirtyRowIds.has(row.id);
    const rowClass = row.isNew ? "is-new" : (isDirty ? "is-dirty" : "");
    const paxVal = parseInt(row.pax, 10) || 1;

    return `
      <tr class="${rowClass}" data-row-id="${row.id}">
        <td class="sheet-cell-idx">${idx + 1}</td>
        <td>
          <input type="text" class="sheet-input sheet-focus-name" value="${escapeHtml(row.name)}"
            placeholder="Ketik nama tamu..."
            oninput="onSheetCellInput('${row.id}', 'name', this.value)"
            onkeydown="handleSheetKeyNav(event, ${idx}, 'name')">
        </td>
        <td>
          <input type="text" class="sheet-input" value="${escapeHtml(row.phone)}"
            placeholder="08... / 628..."
            oninput="onSheetCellInput('${row.id}', 'phone', this.value)"
            onchange="onSheetPhoneBlur('${row.id}', this)"
            onkeydown="handleSheetKeyNav(event, ${idx}, 'phone')">
        </td>
        <td style="text-align: center;">
          <input type="number" min="1" class="sheet-input sheet-input-pax" value="${paxVal}"
            style="text-align: center; font-weight: 700; width: 100%; color: var(--primary);"
            title="Jumlah orang / pax untuk rekap (misal 1, 2, atau 10 untuk teman sekolah)"
            oninput="onSheetCellInput('${row.id}', 'pax', this.value)"
            onkeydown="handleSheetKeyNav(event, ${idx}, 'pax')">
        </td>
        <td>
          <select class="sheet-select" onchange="onSheetCellInput('${row.id}', 'type', this.value)">
            ${SHEET_TYPES.map(t => `<option value="${t.val}" ${row.type === t.val ? 'selected' : ''}>${t.label}</option>`).join("")}
          </select>
        </td>
        <td>
          <select class="sheet-select" onchange="onSheetCellInput('${row.id}', 'relation', this.value)">
            ${SHEET_RELATIONS.map(r => `<option value="${r}" ${row.relation === r ? 'selected' : ''}>${r}</option>`).join("")}
          </select>
        </td>
        <td>
          <select class="sheet-select" onchange="onSheetCellInput('${row.id}', 'sender', this.value)">
            ${SHEET_SENDERS.map(s => `<option value="${s}" ${row.sender === s ? 'selected' : ''}>${s}</option>`).join("")}
          </select>
        </td>
        <td>
          <select class="sheet-select" onchange="onSheetCellInput('${row.id}', 'status', this.value)">
            ${SHEET_STATUSES.map(st => `<option value="${st.val}" ${row.status === st.val ? 'selected' : ''}>${st.label}</option>`).join("")}
          </select>
        </td>
        <td style="text-align: center;">
          <button class="sheet-btn-delete" onclick="deleteSpreadsheetRow('${row.id}')" title="Hapus baris ini">
            <i class="fas fa-times"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function filterSpreadsheetRows() {
  renderSpreadsheetTable();
}

function sortSpreadsheetRows(val) {
  renderSpreadsheetTable();
}

// Tangani perubahan pada sel input
function onSheetCellInput(rowId, field, value) {
  const row = spreadsheetData.find(r => r.id === rowId);
  if (!row) return;

  if (field === "pax") {
    row.pax = parseInt(value, 10) || 1;
    const badgePax = document.getElementById("sheet-summary-pax");
    if (badgePax) {
      badgePax.textContent = spreadsheetData.reduce((s, r) => s + (parseInt(r.pax, 10) || 1), 0);
    }
  } else {
    row[field] = value;
  }

  dirtyRowIds.add(rowId);

  // Tandai visual baris
  const tr = document.querySelector(`tr[data-row-id="${rowId}"]`);
  if (tr && !row.isNew) tr.classList.add("is-dirty");

  updateDirtyBadge();
}

// Format nomor HP saat blur
function onSheetPhoneBlur(rowId, inputEl) {
  const formatted = formatPhoneNumber(inputEl.value);
  inputEl.value = formatted;
  onSheetCellInput(rowId, "phone", formatted);
}

// Navigasi Keyboard seperti Spreadsheet (Enter = pindah ke baris berikutnya)
function handleSheetKeyNav(e, currentIdx, fieldName) {
  if (e.key === "Enter") {
    e.preventDefault();
    const rows = document.querySelectorAll("#spreadsheet-tbody tr");
    if (currentIdx + 1 < rows.length) {
      // Pindah ke baris berikutnya
      const nextInput = rows[currentIdx + 1].querySelector(`.sheet-input[placeholder*="${fieldName === 'name' ? 'nama' : '08'}"]`);
      if (nextInput) nextInput.focus();
    } else {
      // Sudah di baris terakhir: buat baris baru otomatis!
      addSpreadsheetRow(1, true);
    }
  }
}

// Tambah baris kosong
function addSpreadsheetRow(count = 1, focusNew = false) {
  const newIds = [];
  for (let i = 0; i < count; i++) {
    const tempId = "new_" + Date.now() + "_" + (newRowTempId++);
    const newRow = {
      id: tempId,
      name: "",
      phone: "",
      pax: 1,
      type: "undangan_digital",
      relation: "Lainnya",
      sender: "Lukas",
      status: "pending",
      isNew: true
    };
    spreadsheetData.push(newRow);
    dirtyRowIds.add(tempId);
    newIds.push(tempId);
  }

  updateDirtyBadge();
  renderSpreadsheetTable();

  // Scroll ke bawah
  const wrapper = document.getElementById("spreadsheet-wrapper");
  if (wrapper) wrapper.scrollTop = wrapper.scrollHeight;

  // Fokuskan ke baris baru pertama
  if (focusNew && newIds.length > 0) {
    setTimeout(() => {
      const firstNewTr = document.querySelector(`tr[data-row-id="${newIds[0]}"] .sheet-focus-name`);
      if (firstNewTr) firstNewTr.focus();
    }, 50);
  }
}

// Hapus baris dari spreadsheet
function deleteSpreadsheetRow(rowId) {
  const row = spreadsheetData.find(r => r.id === rowId);
  if (!row) return;

  if (row.name && !confirm(`Hapus baris tamu "${row.name}"?`)) {
    return;
  }

  if (!row.isNew) {
    deletedGuestIds.add(row.id);
  }

  spreadsheetData = spreadsheetData.filter(r => r.id !== rowId);
  dirtyRowIds.delete(rowId);

  updateDirtyBadge();
  renderSpreadsheetTable();
}

// Filter pencarian tabel spreadsheet
function filterSpreadsheetRows() {
  renderSpreadsheetTable();
}

// Update badge perubahan
function updateDirtyBadge() {
  const badge = document.getElementById("sheet-dirty-badge");
  const countEl = document.getElementById("sheet-dirty-count");
  const totalChanges = dirtyRowIds.size + deletedGuestIds.size;

  if (badge && countEl) {
    if (totalChanges > 0) {
      badge.style.display = "inline-flex";
      countEl.textContent = totalChanges;
    } else {
      badge.style.display = "none";
    }
  }
}

// Simpan Semua Perubahan Spreadsheet ke Supabase
async function saveAllSpreadsheetChanges() {
  const saveBtn = document.getElementById("btn-save-spreadsheet");
  const totalChanges = dirtyRowIds.size + deletedGuestIds.size;

  if (totalChanges === 0) {
    alert("ℹ️ Tidak ada perubahan yang perlu disimpan.");
    return;
  }

  // Validasi: pastikan nama tidak kosong untuk baris yang diubah/baru
  const invalidRows = spreadsheetData.filter(r => dirtyRowIds.has(r.id) && !r.name.trim());
  if (invalidRows.length > 0) {
    alert("⚠️ Ditemukan baris tanpa Nama Tamu! Harap isi nama tamu atau hapus baris yang kosong sebelum menyimpan.");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

  try {
    let successCount = 0;

    // 1. Eksekusi Hapus
    for (const delId of deletedGuestIds) {
      await GuestsAPI.delete(delId);
      successCount++;
    }

    // 2. Eksekusi Tambah & Update
    for (const rowId of dirtyRowIds) {
      const row = spreadsheetData.find(r => r.id === rowId);
      if (!row) continue;

      const payload = {
        name: row.name.trim(),
        phone: formatPhoneNumber(row.phone),
        pax: parseInt(row.pax, 10) || 1,
        type: row.type,
        relation: row.relation,
        sender: row.sender,
        status: row.status
      };

      if (row.isNew) {
        await GuestsAPI.create(payload);
      } else {
        await GuestsAPI.update(row.id, payload);
      }
      successCount++;
    }

    alert(`✅ Berhasil menyimpan ${successCount} perubahan ke database Supabase!`);

    // Muat ulang data terbaru
    await refreshData();
    loadSpreadsheetFromGuests();

  } catch (err) {
    console.error("Gagal menyimpan spreadsheet:", err);
    alert("Terjadi kesalahan saat menyimpan perubahan: " + err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Semua';
  }
}

// ============================================================
// PASTE DARI EXCEL MODAL LOGIC
// ============================================================

function openPasteModal() {
  document.getElementById("paste-input").value = "";
  document.getElementById("modal-paste").classList.add("active");
  setTimeout(() => document.getElementById("paste-input").focus(), 100);
}

function closePasteModal() {
  document.getElementById("modal-paste").classList.remove("active");
}

function processPastedText() {
  const text = document.getElementById("paste-input").value;
  if (!text.trim()) {
    alert("Kotak teks masih kosong!");
    return;
  }

  const lines = text.split(/\r\n|\n/).filter(l => l.trim() !== "");
  let added = 0;

  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length >= 1 && parts[0].trim()) {
      const name = parts[0].trim();
      const col2 = parts[1] ? parts[1].trim() : "";
      const col3 = parts[2] ? parts[2].trim() : "";

      // Deteksi otomatis jika kolom 2 adalah No HP atau Relasi atau Pax
      let phone = "";
      let relation = "Lainnya";
      let sender = "Lukas";
      let pax = 1;
      const col4 = parts[3] ? parts[3].trim() : "";

      // Cek apakah ada kolom angka 1-500 sebagai pax
      [col2, col3, col4].forEach(c => {
        if (/^\d{1,3}$/.test(c) && parseInt(c, 10) > 0 && parseInt(c, 10) <= 500) {
          pax = parseInt(c, 10);
        }
      });

      if (/^\+?[\d\s-]{6,}$/.test(col2)) {
        phone = formatPhoneNumber(col2);
        if (col3 && !/^\d{1,3}$/.test(col3)) relation = col3;
      } else if (col2 && !/^\d{1,3}$/.test(col2)) {
        relation = col2;
      }

      // Deteksi pihak pengundang berdasarkan teks relasi
      const relLower = (relation + " " + col3 + " " + col4).toLowerCase();
      if (relLower.includes("bapak") || relLower.includes("bapake")) sender = "Bapak Lukas";
      else if (relLower.includes("papa")) sender = "Papa Kezia";
      else if (relLower.includes("mama")) sender = "Mama Kezia";
      else if (relLower.includes("kezia")) sender = "Kezia";

      const tempId = "new_" + Date.now() + "_" + (newRowTempId++);
      spreadsheetData.push({
        id: tempId,
        name,
        phone,
        pax,
        type: "undangan_digital",
        relation,
        sender,
        status: "pending",
        isNew: true
      });

      dirtyRowIds.add(tempId);
      added++;
    }
  }

  closePasteModal();
  updateDirtyBadge();
  renderSpreadsheetTable();

  // Scroll ke bawah
  const wrapper = document.getElementById("spreadsheet-wrapper");
  if (wrapper) wrapper.scrollTop = wrapper.scrollHeight;

  alert(`✅ Berhasil menambahkan ${added} baris tamu baru dari Excel ke spreadsheet! Tekan "Simpan Semua" untuk menyimpannya ke database.`);
}

