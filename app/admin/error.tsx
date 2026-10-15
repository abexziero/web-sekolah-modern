"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return <section className="admin-auth"><h1>Ruang operator belum tersedia.</h1><p>Periksa koneksi lalu coba kembali. Jika berlanjut, hubungi pengelola sistem.</p><button onClick={reset} className="button">Coba kembali</button></section>;
}
