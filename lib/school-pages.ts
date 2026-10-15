export type SchoolPage = {
  area: string;
  slug: string;
  title: string;
  description: string;
  group?: string;
  kind?: "overview" | "teachers" | "gallery" | "faq" | "facility";
  image?: string;
};

export const schoolPages: SchoolPage[] = [
  { area: "profil", slug: "madrasah", title: "Profil Madrasah", group: "Madrasah", description: "Mengenal Madrasah Aliyah Annur Samarinda.", kind: "overview", image: "school.jpg" },
  { area: "profil", slug: "sambutan-kepala", title: "Sambutan Kepala Madrasah", group: "Madrasah", description: "Ikhtiar bersama menumbuhkan ilmu, akhlak, dan kepedulian.", image: "teacher-placeholder.svg" },
  { area: "profil", slug: "sejarah", title: "Sejarah Madrasah", group: "Madrasah", description: "Merangkai cerita pendidikan, nilai, dan peran masyarakat dalam perjalanan madrasah.", image: "school.jpg" },
  { area: "profil", slug: "visi-misi", title: "Visi & Misi", group: "Madrasah", description: "Arah pendidikan yang menghubungkan pengetahuan, karakter, dan kemandirian.", image: "study-illustration.jpg" },
  { area: "profil", slug: "struktur-organisasi", title: "Struktur Organisasi", group: "Kelembagaan", description: "Mengenal fungsi pengelolaan pendidikan dan pendampingan siswa." },
  { area: "profil", slug: "guru-tenaga-kependidikan", title: "Guru & Tenaga Kependidikan", group: "Kelembagaan", description: "Kenali pendidik dan tenaga kependidikan madrasah.", kind: "teachers" },
  { area: "informasi", slug: "berita", title: "Berita Terbaru", description: "Bacaan tentang literasi, karakter, dan kebiasaan belajar di lingkungan madrasah." },
  { area: "informasi", slug: "pengumuman", title: "Pengumuman", description: "Informasi untuk membangun komunikasi yang jelas antara keluarga dan madrasah." },
  { area: "informasi", slug: "agenda", title: "Agenda Madrasah", description: "Rancangan kegiatan yang mengajak siswa membaca, peduli, dan berkarya bersama." },
  { area: "informasi", slug: "galeri", title: "Galeri Madrasah", description: "Kenali lingkungan madrasah melalui foto dari website sekolah sebelumnya.", kind: "gallery" },
  { area: "layanan", slug: "program-pendidikan", title: "Program Pendidikan", description: "Belajar ilmu agama dan pengetahuan, mengembangkan keterampilan untuk kehidupan.", image: "study-illustration.jpg" },
  { area: "layanan", slug: "ekstrakurikuler", title: "Ekstrakurikuler", description: "Mencoba hal baru, menemukan minat, dan bertumbuh melalui pengalaman." },
  { area: "layanan", slug: "unduhan", title: "Pusat Unduhan", description: "Bahan baca ringan untuk mendampingi komunikasi dan kebiasaan belajar." },
  { area: "layanan", slug: "faq", title: "Pertanyaan Umum", description: "Jawaban untuk pertanyaan umum tentang madrasah.", kind: "faq" },
  { area: "fasilitas", slug: "ruang-kelas", title: "Ruang Kelas", description: "Mengenal ruang untuk membaca, mendengarkan, berdiskusi, dan bertanya.", kind: "facility", image: "classroom.jpg" },
  { area: "fasilitas", slug: "laboratorium", title: "Laboratorium Komputer", description: "Mengenal perangkat dan menggunakan teknologi secara cermat serta bertanggung jawab.", kind: "facility", image: "lab.jpg" },
  { area: "fasilitas", slug: "wifi", title: "Wi-Fi Madrasah", description: "Akses informasi sebagai pendukung kegiatan belajar yang terarah.", kind: "facility" },
  { area: "prestasi", slug: "akademik", title: "Prestasi Akademik", description: "Mengembangkan penalaran dan ketekunan melalui proses belajar yang konsisten." },
  { area: "prestasi", slug: "nonakademik", title: "Prestasi Nonakademik", description: "Mendampingi bakat, kreativitas, sportivitas, dan kepemimpinan." }
];

export const navigation = [
  { label: "Beranda", section: "beranda", href: "/#beranda" },
  { label: "Profil Madrasah", section: "profil", area: "profil" },
  { label: "Informasi", section: "informasi galeri agenda pengumuman", area: "informasi" },
  { label: "Layanan", section: "akses-informasi", area: "layanan" },
  { label: "Fasilitas", section: "fasilitas", area: "fasilitas" },
  { label: "Prestasi", section: "prestasi", area: "prestasi" },
  { label: "Kontak", section: "kontak", href: "/#kontak" }
];
