export const articles = [
  { id: "budaya-literasi", title: "Membangun kebiasaan membaca, satu halaman setiap hari", category: "Literasi", image: "study-illustration.jpg", alt: "Foto ilustrasi pelajar membaca di perpustakaan, bukan dokumentasi MA Annur", excerpt: "Langkah kecil untuk melatih rasa ingin tahu, memahami bacaan, dan berani menyampaikan gagasan.", body: "Mulailah dari bacaan yang dekat dengan minat, sediakan waktu singkat yang konsisten, lalu tuliskan satu gagasan yang paling berkesan. Diskusi dengan teman membantu melihat sebuah topik dari sudut pandang yang berbeda. Contoh kegiatan ini dapat dikembangkan menjadi jurnal membaca atau ruang berbagi rekomendasi buku." },
  { id: "adab-belajar", title: "Ilmu yang tumbuh bersama adab dan kepedulian", category: "Karakter", image: "classroom.jpg", alt: "Ruang kelas madrasah sebagai ilustrasi artikel tentang adab belajar", excerpt: "Mendengarkan, menghargai perbedaan, dan bertanggung jawab adalah bagian dari proses belajar.", body: "Suasana belajar yang baik dibangun bersama. Memberi kesempatan teman berbicara, menjaga kebersihan ruang kelas, dan menyelesaikan tugas dengan jujur menjadi latihan sederhana yang bermakna. Pendampingan guru dan komunikasi keluarga membantu kebiasaan baik tumbuh secara konsisten." },
  { id: "literasi-digital", title: "Cermat mencari informasi, bijak menggunakan teknologi", category: "Teknologi", image: "lab.jpg", alt: "Laboratorium komputer madrasah sebagai ilustrasi pembelajaran digital", excerpt: "Belajar memeriksa sumber, menjaga privasi, dan menggunakan perangkat digital untuk berkarya.", body: "Sebelum membagikan informasi, periksa sumber dan konteksnya. Gunakan kata sandi yang kuat, hindari menyebarkan data pribadi, dan hargai karya orang lain dengan mencantumkan sumber. Teknologi dapat menjadi ruang latihan untuk menulis, merancang presentasi, dan menyusun karya kolaboratif yang bermanfaat." }
];

export const agenda = [
  { title: "Pekan literasi dan berbagi bacaan", description: "Membaca pilihan buku, menulis refleksi singkat, dan bertukar cerita tentang gagasan yang ditemukan.", focus: "Literasi · Diskusi · Refleksi" },
  { title: "Kelas adab dan kepedulian lingkungan", description: "Menghubungkan pembelajaran akhlak dengan kebiasaan merawat kelas, menghargai teman, dan bekerja bersama.", focus: "Karakter · Kebersihan · Gotong royong" },
  { title: "Ruang karya dan kolaborasi siswa", description: "Menyusun karya sederhana dalam kelompok, mempresentasikan prosesnya, dan saling memberi masukan yang membangun.", focus: "Kreativitas · Komunikasi · Kerja tim" }
];

export const services = [
  { title: "Program Pendidikan", description: "Pembelajaran keagamaan dan akademik yang dirancang saling menguatkan, dengan ruang untuk bertanya dan berkarya.", href: "/layanan/program-pendidikan" },
  { title: "Ekstrakurikuler", description: "Ruang eksplorasi minat melalui olahraga, seni, kepemimpinan, dan kegiatan ilmiah yang mendidik.", href: "/layanan/ekstrakurikuler" }
];

export const achievements = [
  { title: "Prestasi Akademik", description: "Melatih penalaran, membangun kebiasaan belajar, dan mengembangkan karya ilmiah melalui proses yang bertahap.", href: "/prestasi/akademik" },
  { title: "Prestasi Nonakademik", description: "Mengembangkan bakat, sportivitas, kreativitas, dan kepemimpinan dengan semangat bertumbuh bersama.", href: "/prestasi/nonakademik" }
];

export const downloads = [
  { title: "Panduan komunikasi orang tua", description: "Contoh panduan menghubungi madrasah dan mendampingi proses belajar.", href: "/documents/contoh-panduan-orang-tua.txt" },
  { title: "Panduan adab dan kebiasaan belajar", description: "Contoh kebiasaan positif di kelas, ruang digital, dan lingkungan madrasah.", href: "/documents/contoh-adab-belajar.txt" }
];

type ContentSection = { id?: string; heading: string; paragraphs: string[]; items?: string[] };

export const topicCopy: Record<string, ContentSection[]> = {
  "profil/madrasah": [
    { heading: "Belajar dengan ilmu, bertumbuh dengan akhlak", paragraphs: ["MA Annur Samarinda berada di Jl. Kebun Raya, RT08, Tanah Merah, Samarinda Utara. Website ini menjadi ruang untuk mengenal madrasah dan mengakses informasi pendidikan.", "Rancangan pengenalan madrasah menempatkan penguasaan pengetahuan, pembiasaan adab, dan kepedulian sosial sebagai nilai yang berjalan bersama. Setiap siswa diberi ruang untuk belajar dengan rasa ingin tahu dan mengenali potensi dirinya."] },
    { heading: "Madrasah, keluarga, dan lingkungan", paragraphs: ["Pendidikan tumbuh melalui kerja bersama. Komunikasi yang terbuka antara pendidik, keluarga, dan siswa membantu membangun kebiasaan belajar yang lebih terarah, saling menghargai, dan bertanggung jawab."], items: ["Mengenal lingkungan belajar dan fasilitas madrasah.", "Memahami arah pendidikan melalui rancangan visi dan misi.", "Mengikuti informasi dan layanan melalui kanal madrasah."] }
  ],
  "profil/sambutan-kepala": [
    { heading: "Assalamu’alaikum warahmatullahi wabarakatuh", paragraphs: ["Alhamdulillah, pendidikan adalah ikhtiar bersama untuk menumbuhkan ilmu sekaligus akhlak. Selamat datang di ruang informasi MA Annur Samarinda, tempat keluarga dan masyarakat dapat mengenal kehidupan madrasah dengan lebih dekat.", "Kami berharap setiap proses belajar menjadi kesempatan untuk bertanya, berusaha, dan memperbaiki diri. Pengetahuan perlu tumbuh bersama kejujuran, kepedulian, serta penghormatan kepada sesama."] },
    { heading: "Mari mendampingi tumbuhnya generasi berkarakter", paragraphs: ["Kerja sama orang tua dan pendidik menjadi bagian penting dari perjalanan siswa. Melalui komunikasi yang baik, kita dapat menghadirkan lingkungan yang mendorong semangat belajar dan tanggung jawab.", "Wassalamu’alaikum warahmatullahi wabarakatuh. Naskah ini merupakan contoh redaksi sambutan; belum mewakili pernyataan kepala madrasah dan tidak mencantumkan identitas pejabat."] }
  ],
  "profil/sejarah": [
    { heading: "Mengenal perjalanan sebuah madrasah", paragraphs: ["Sejarah madrasah adalah cerita tentang ikhtiar pendidikan, peran masyarakat, dan nilai yang diwariskan kepada generasi berikutnya. Halaman ini disiapkan untuk merangkai kisah MA Annur Samarinda secara runtut dan mudah dipahami.", "Contoh narasi menyoroti semangat menghadirkan pendidikan yang menghubungkan ilmu, adab, dan kehidupan bermasyarakat. Tahun pendirian, nama pendiri, serta tonggak perkembangan belum diisi karena memerlukan dokumen resmi."] },
    { heading: "Jejak yang akan didokumentasikan", paragraphs: ["Riwayat yang lengkap perlu didukung arsip, foto, dan keterangan narasumber. Penyajian dapat menggabungkan cerita singkat dengan dokumentasi pada setiap tahap perkembangan."], items: ["Latar belakang dan gagasan pendirian.", "Perkembangan lingkungan belajar dan fasilitas.", "Kontribusi pendidik, keluarga, serta masyarakat.", "Arah pengembangan madrasah dari masa ke masa."] }
  ],
  "profil/visi-misi": [
    { heading: "Contoh visi", paragraphs: ["Menjadi madrasah yang menumbuhkan generasi berilmu, berakhlak, mandiri, dan peduli terhadap sesama serta lingkungan.", "Rancangan visi ini menghubungkan keberhasilan belajar dengan karakter sehari-hari. Perkembangan siswa dipandang melalui proses, kebiasaan baik, dan kemauan untuk terus memperbaiki diri."] },
    { heading: "Contoh misi", paragraphs: ["Arah tindakan berikut menjadi contoh penerjemahan visi ke dalam pengalaman belajar. Rumusan final ditetapkan melalui pembahasan dan pengesahan sekolah."], items: ["Menguatkan pemahaman agama dan pembiasaan adab dalam keseharian.", "Mengembangkan pembelajaran aktif, kritis, dan bertanggung jawab.", "Mendampingi minat serta bakat melalui kegiatan yang mendidik.", "Membangun kerja sama yang terbuka dengan orang tua dan masyarakat.", "Membiasakan kepedulian terhadap kebersihan dan lingkungan."] }
  ],
  "profil/struktur-organisasi": [
    { heading: "Peran yang saling mendukung", paragraphs: ["Pengelolaan madrasah membutuhkan pembagian peran yang jelas agar pembelajaran, pendampingan siswa, dan layanan administrasi dapat berjalan terarah. Berikut adalah contoh susunan fungsi, bukan struktur resmi MA Annur."] , items: ["Kepala madrasah: arah pengembangan dan koordinasi penyelenggaraan pendidikan.", "Bidang kurikulum: perencanaan pembelajaran dan evaluasi akademik.", "Bidang kesiswaan: pendampingan karakter, kegiatan, dan kedisiplinan.", "Bidang sarana dan hubungan masyarakat: lingkungan belajar serta komunikasi.", "Guru, wali kelas, dan tata usaha: pembelajaran, pendampingan, dan administrasi."] },
    { heading: "Mudah dihubungi, jelas alurnya", paragraphs: ["Pertanyaan awal dapat disampaikan melalui kontak madrasah untuk diarahkan kepada fungsi yang tepat. Nama pejabat, hubungan pelaporan, dan bagan organisasi final akan mengikuti penetapan resmi sekolah."] }
  ],
  "profil/guru-tenaga-kependidikan": [
    { heading: "Pendamping dalam perjalanan belajar", paragraphs: ["Pendidik mendampingi siswa memahami pelajaran, membangun kebiasaan belajar, dan mengenali potensi. Tenaga kependidikan mendukung layanan administrasi serta komunikasi yang membantu kegiatan madrasah.", "Kartu berikut menggunakan peran dan avatar contoh. Nama, riwayat pendidikan, serta foto individu tidak diisi sebagai identitas nyata."] }
  ],
  "informasi/pengumuman": [
    { heading: "Menggunakan kanal informasi madrasah", paragraphs: ["Untuk memastikan informasi yang diterima tepat, gunakan nomor telepon dan alamat email yang tercantum pada halaman kontak. Hindari membagikan informasi yang belum diketahui sumbernya.", "Contoh pengumuman ini mengajak orang tua dan siswa membiasakan pemeriksaan sumber sebelum meneruskan pesan. Jadwal atau keputusan resmi hanya berlaku setelah diterbitkan oleh sekolah."] },
    { heading: "Menyiapkan komunikasi yang jelas", paragraphs: ["Saat menghubungi madrasah, sampaikan nama, keperluan, dan informasi singkat yang relevan. Hindari mengirim dokumen pribadi melalui ruang publik."], items: ["Gunakan bahasa yang sopan dan ringkas.", "Sampaikan pertanyaan melalui kontak resmi.", "Simpan informasi penting untuk rujukan bersama."] }
  ],
  "informasi/agenda": agenda.map((item, index) => ({ id: `kegiatan-${index + 1}`, heading: item.title, paragraphs: [item.description, `Fokus kegiatan: ${item.focus}. Ini adalah rancangan kegiatan contoh; waktu, peserta, dan pelaksanaan belum ditetapkan oleh sekolah.`], items: ["Persiapan bersama pendamping kegiatan.", "Pelaksanaan dengan pembagian peran yang jelas.", "Refleksi dan dokumentasi hasil belajar."] })),
  "informasi/galeri": [
    { heading: "Melihat ruang tempat belajar bertumbuh", paragraphs: ["Dokumentasi ruang kelas, laboratorium komputer, dan lingkungan madrasah membantu pengunjung mengenal suasana sekolah. Tiga foto awal berikut berasal dari website MA Annur sebelumnya; judulnya menjelaskan tempat, bukan mengarang kegiatan.", "Pilih foto untuk melihat lebih dekat. Foto ilustrasi artikel digunakan terpisah dan tidak dimasukkan sebagai dokumentasi kegiatan MA Annur."] }
  ],
  "layanan/program-pendidikan": [
    { heading: "Ilmu agama dan pengetahuan yang saling menguatkan", paragraphs: ["Contoh rancangan program pendidikan menyeimbangkan pemahaman keagamaan, keterampilan akademik, dan kebiasaan belajar yang bertanggung jawab. Siswa diajak memahami materi sekaligus menghubungkannya dengan kehidupan sehari-hari."], items: ["Keagamaan: membaca, memahami, dan membiasakan nilai akhlak.", "Akademik: bahasa, penalaran matematika, sains, dan pengetahuan sosial.", "Keterampilan: literasi digital, komunikasi, dan kerja sama."] },
    { heading: "Belajar aktif, mengenali proses", paragraphs: ["Diskusi, latihan terarah, proyek sederhana, dan refleksi dapat membantu siswa mengenali cara belajarnya. Umpan balik digunakan untuk memperbaiki pemahaman, bukan hanya melihat hasil akhir.", "Daftar mata pelajaran, alokasi waktu, serta ketentuan kurikulum final mengikuti dokumen yang ditetapkan madrasah."] }
  ],
  "layanan/ekstrakurikuler": [
    { heading: "Ruang mencoba, menemukan minat", paragraphs: ["Kegiatan di luar kelas memberi kesempatan untuk belajar melalui pengalaman. Rancangan berikut adalah contoh pilihan pengembangan minat, bukan daftar ekstrakurikuler yang sudah diselenggarakan sekolah."], items: ["Keagamaan: tilawah, latihan pidato, dan berbagi pemahaman.", "Olahraga: kebugaran, permainan beregu, dan sportivitas.", "Seni dan literasi: menulis, desain, serta apresiasi karya.", "Kepemimpinan dan ilmiah: kerja tim, pengamatan, serta presentasi."] },
    { heading: "Memilih dengan tujuan yang jelas", paragraphs: ["Pilih kegiatan yang sesuai minat dan kesiapan waktu. Proses mencoba, berlatih, dan menghargai teman sama pentingnya dengan hasil karya.", "Pembina, jadwal latihan, fasilitas yang digunakan, serta alur keikutsertaan perlu disahkan sekolah sebelum dipublikasikan sebagai layanan aktif."] }
  ],
  "layanan/unduhan": [
    { heading: "Bahan baca untuk keluarga dan siswa", paragraphs: ["Dokumen berikut dapat diunduh sebagai contoh isi pusat informasi. Isinya membahas komunikasi yang baik serta kebiasaan belajar sehari-hari dalam format teks yang ringan.", "Seluruh berkas berlabel CONTOH, tidak memuat data pribadi, dan bukan surat keputusan, persyaratan penerimaan, atau tata tertib resmi sekolah. Dokumen resmi akan menggantikan contoh setelah disahkan."] }
  ],
  "layanan/faq": [
    { heading: "Temukan informasi, lanjutkan percakapan", paragraphs: ["Halaman ini merangkum informasi dasar mengenai lokasi, kontak, dan cara memperoleh keterangan pendidikan. Pertanyaan khusus dapat disampaikan kepada madrasah melalui kontak yang tersedia.", "Jadwal penerimaan, biaya, dan dokumen persyaratan tidak diperkirakan melalui contoh konten ini. Konfirmasi langsung membantu keluarga memperoleh informasi yang sesuai dengan ketentuan sekolah."] }
  ],
  "fasilitas/ruang-kelas": [
    { heading: "Ruang untuk mendengar dan bertanya", paragraphs: ["Ruang kelas mendukung kegiatan membaca, berdiskusi, dan mengerjakan latihan bersama. Penataan yang baik membantu siswa berkonsentrasi sekaligus berinteraksi dengan teman.", "Foto pada halaman ini adalah dokumentasi ruang kelas dari website madrasah sebelumnya. Uraian penggunaan merupakan contoh redaksi; kapasitas, jumlah ruang, dan rincian sarana tidak dinyatakan tanpa verifikasi."] },
    { heading: "Menjaga ruang belajar bersama", paragraphs: ["Kebersihan, kerapian, dan penghargaan terhadap perlengkapan menjadi tanggung jawab bersama. Kebiasaan sederhana membantu ruang belajar tetap nyaman digunakan."], items: ["Menjaga meja, kursi, dan perlengkapan belajar.", "Mengembalikan ruang dalam keadaan rapi.", "Menyampaikan kebutuhan atau kerusakan kepada pendamping."] }
  ],
  "fasilitas/laboratorium": [
    { heading: "Teknologi sebagai alat belajar", paragraphs: ["Laboratorium komputer menjadi konteks untuk mengenal perangkat digital, menyusun dokumen, dan mengembangkan literasi informasi. Pembelajaran dapat diarahkan pada penggunaan teknologi yang bermanfaat dan bertanggung jawab.", "Foto siswa di laboratorium bersumber dari website madrasah sebelumnya. Jumlah perangkat, spesifikasi, dan jadwal penggunaan tidak diisi sebagai fakta pada contoh ini."] },
    { heading: "Cermat dan bertanggung jawab", paragraphs: ["Penggunaan perangkat perlu didampingi kebiasaan menjaga privasi dan menghargai karya orang lain. Kegiatan praktik mengikuti arahan pendamping serta aturan yang berlaku di sekolah."], items: ["Memeriksa sumber sebelum menggunakan informasi.", "Menjaga akun serta data pribadi.", "Merawat perangkat dan menggunakannya sesuai kebutuhan belajar."] }
  ],
  "fasilitas/wifi": [
    { heading: "Koneksi untuk kebutuhan pendidikan", paragraphs: ["Fasilitas Wi-Fi tercantum pada website madrasah sebelumnya. Contoh uraian ini menempatkan akses internet sebagai pendukung pencarian sumber belajar dan kegiatan akademik yang terarah.", "Cakupan jaringan, kecepatan, perangkat yang dapat terhubung, serta mekanisme akses belum ditentukan dalam konten ini. Tidak ada janji akses bebas atau layanan tertentu tanpa konfirmasi sekolah."] },
    { heading: "Belajar digital dengan bijak", paragraphs: ["Gunakan koneksi untuk kegiatan yang relevan dengan pembelajaran. Hindari membagikan kredensial akses, mengunggah data pribadi, atau membuka konten yang tidak sesuai dengan lingkungan pendidikan."], items: ["Ikuti ketentuan akses yang ditetapkan sekolah.", "Gunakan sumber informasi yang dapat dipertanggungjawabkan.", "Hubungi pendamping bila menemukan kendala."] }
  ],
  "prestasi/akademik": [
    { heading: "Prestasi berawal dari proses", paragraphs: ["Pembinaan akademik dapat dimulai dari rasa ingin tahu, latihan yang konsisten, dan keberanian mencoba soal atau gagasan baru. Contoh halaman ini menjelaskan arah pembinaan, bukan menyatakan hasil lomba MA Annur."], items: ["Mengenali minat pada bahasa, sains, matematika, atau kajian keagamaan.", "Membangun pemahaman melalui latihan dan diskusi.", "Menyusun karya atau portofolio sebagai catatan perkembangan."] },
    { heading: "Menghargai usaha dan kejujuran", paragraphs: ["Keberhasilan bukan hanya tentang peringkat. Kemampuan menjelaskan proses, menerima masukan, dan memperbaiki karya menunjukkan kemajuan yang bermakna.", "Nama peserta, nama kompetisi, peringkat, dan tahun pencapaian hanya akan dicantumkan setelah bukti resmi tersedia."] }
  ],
  "prestasi/nonakademik": [
    { heading: "Bakat yang tumbuh melalui kebiasaan baik", paragraphs: ["Olahraga, seni, komunikasi, dan kepemimpinan memberi ruang bagi siswa untuk mengenali kemampuannya. Contoh arah pembinaan mengutamakan latihan teratur, sportivitas, dan kerja sama."], items: ["Menemukan minat dan menetapkan tujuan latihan.", "Membangun keterampilan melalui pendampingan dan evaluasi.", "Menunjukkan karya dengan menghargai proses serta sesama."] },
    { heading: "Berkarya dengan percaya diri", paragraphs: ["Dukungan teman, keluarga, dan pendamping membantu siswa berani tampil serta menerima pengalaman baru. Penghargaan terhadap usaha membentuk motivasi untuk terus belajar.", "Halaman ini tidak memuat medali, nama juara, tanggal lomba, atau hasil kegiatan rekaan. Dokumentasi pencapaian nyata menunggu verifikasi sekolah."] }
  ]
};
