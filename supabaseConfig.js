// ==========================================
// KONFIGURASI SUPABASE - LUKAS & KEZIA
// ==========================================
// Silakan masukkan URL dan Anon Key proyek Supabase Anda di sini.
// Keduanya dapat ditemukan di: Dashboard Supabase -> Project Settings -> API.

const SUPABASE_CONFIG = {
  url: "https://anklnqtgipmwwjqpsdby.supabase.co",
  anonKey: "sb_publishable_-Z1rSauFrQ5KHlaJy4JulQ_6JL2iyu3",
};

// Cek apakah Supabase sudah dihubungkan dengan kredensial asli
function isSupabaseConfigured() {
  return (
    SUPABASE_CONFIG.url &&
    !SUPABASE_CONFIG.url.includes("YOUR_PROJECT_ID") &&
    SUPABASE_CONFIG.anonKey &&
    !SUPABASE_CONFIG.anonKey.includes("YOUR_SUPABASE_ANON_KEY")
  );
}

// Request Helper ke Supabase REST API
async function supabaseRequest(endpoint, options = {}) {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase belum dikonfigurasi. Menggunakan mode demonstrasi/lokal.");
    return null;
  }

  const url = `${SUPABASE_CONFIG.url}/rest/v1/${endpoint}`;
  const headers = {
    "apikey": SUPABASE_CONFIG.anonKey,
    "Authorization": `Bearer ${SUPABASE_CONFIG.anonKey}`,
    "Content-Type": "application/json",
    "Prefer": options.prefer || "return=representation",
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase Error (${response.status}): ${errorText}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// API TAMU (GUESTS)
const GuestsAPI = {
  // Ambil tamu berdasarkan nama (Case-Insensitive untuk validasi link ?invite=...)
  async getByName(name) {
    if (!name) return null;
    if (!isSupabaseConfigured()) {
      // Fallback jika belum dihubungkan ke Supabase (Demo / Dev mode)
      const cached = localStorage.getItem("dev_cached_guests");
      if (cached) {
        try {
          const list = JSON.parse(cached);
          const found = list.find(g => g.name.trim().toLowerCase() === name.trim().toLowerCase());
          if (found) return found;
        } catch (e) {}
      }
      // Default demo jika nama ada
      return {
        id: "demo-id",
        name: name,
        type: name.toLowerCase().includes("pengumuman") ? "pengumuman" : "undangan",
        relation: "Teman",
        sender: "Lukas",
        status: "pending"
      };
    }

    // Query ke Supabase dengan pencocokan case-insensitive
    const encodedName = encodeURIComponent(name.trim());
    const data = await supabaseRequest(`guests?name=ilike.${encodedName}&select=*&limit=1`);
    if (data && data.length > 0) {
      return data[0];
    }
    return null;
  },

  // Ambil seluruh daftar tamu (untuk admin)
  async getAll() {
    if (!isSupabaseConfigured()) {
      const cached = localStorage.getItem("dev_cached_guests");
      if (cached) {
        try { return JSON.parse(cached); } catch (e) {}
      }
      return [
        { id: "1", name: "Rubin Kurnianto", phone: "6281234567890", type: "undangan", relation: "Teman Sekolah", sender: "Lukas", status: "terkirim", sent_at: new Date().toISOString() },
        { id: "2", name: "Bpk. Toni & Rekan", phone: "6281987654321", type: "undangan", relation: "Keluarga / Saudara", sender: "Bapak Lukas", status: "pending", sent_at: null },
        { id: "3", name: "Sahabat Kuliah Kezia", phone: "628512345678", type: "pengumuman", relation: "Teman Sekolah", sender: "Kezia", status: "pending", sent_at: null }
      ];
    }

    // Mengambil seluruh tamu berurutan waktu dibuat secara deterministik (stabil saat diedit)
    return await supabaseRequest("guests?select=*&order=created_at.asc,id.asc");
  },

  // Tambah tamu baru
  async create(guestData) {
    if (!isSupabaseConfigured()) {
      const all = await this.getAll();
      const newGuest = {
        id: "local-" + Date.now(),
        ...guestData,
        created_at: new Date().toISOString()
      };
      all.unshift(newGuest);
      localStorage.setItem("dev_cached_guests", JSON.stringify(all));
      return newGuest;
    }

    const result = await supabaseRequest("guests", {
      method: "POST",
      body: guestData
    });
    return result && result[0] ? result[0] : null;
  },

  // Update data tamu
  async update(id, updates) {
    if (!isSupabaseConfigured()) {
      const all = await this.getAll();
      const idx = all.findIndex(g => g.id === id);
      if (idx !== -1) {
        all[idx] = { ...all[idx], ...updates };
        localStorage.setItem("dev_cached_guests", JSON.stringify(all));
        return all[idx];
      }
      return null;
    }

    const result = await supabaseRequest(`guests?id=eq.${id}`, {
      method: "PATCH",
      body: updates
    });
    return result && result[0] ? result[0] : null;
  },

  // Hapus tamu
  async delete(id) {
    if (!isSupabaseConfigured()) {
      const all = await this.getAll();
      const filtered = all.filter(g => g.id !== id);
      localStorage.setItem("dev_cached_guests", JSON.stringify(filtered));
      return true;
    }

    await supabaseRequest(`guests?id=eq.${id}`, {
      method: "DELETE"
    });
    return true;
  }
};

// API UCAPAN & DOA RESTU (WISHES)
const WishesAPI = {
  // Ambil semua ucapan
  async getAll() {
    if (!isSupabaseConfigured()) {
      const cached = localStorage.getItem("dev_cached_wishes");
      if (cached) {
        try { return JSON.parse(cached); } catch (e) {}
      }
      return [
        { id: "1", name: "Rubin Kurnianto", message: "Selamat berbahagia Lukas & Kezia! Semoga langgeng sampai maut memisahkan dan diberkati melimpah.", created_at: new Date().toISOString() },
        { id: "2", name: "Keluarga Handoko", message: "Selamat menempuh hidup baru. Tuhan memberkati rumah tangga baru kalian selalu.", created_at: new Date(Date.now() - 86400000).toISOString() }
      ];
    }

    return await supabaseRequest("wishes?select=*&order=created_at.desc");
  },

  // Kirim ucapan baru
  async send(name, message) {
    if (!isSupabaseConfigured()) {
      const all = await this.getAll();
      const newWish = {
        id: "wish-" + Date.now(),
        name,
        message,
        created_at: new Date().toISOString()
      };
      all.unshift(newWish);
      localStorage.setItem("dev_cached_wishes", JSON.stringify(all));
      return newWish;
    }

    const result = await supabaseRequest("wishes", {
      method: "POST",
      body: { name, message }
    });
    return result && result[0] ? result[0] : null;
  }
};

// Ekspor ke window global
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.isSupabaseConfigured = isSupabaseConfigured;
window.GuestsAPI = GuestsAPI;
window.WishesAPI = WishesAPI;
