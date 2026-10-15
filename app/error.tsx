"use client";
export default function PublicError({ reset }: { reset: () => void }) {
  return <main id="konten" tabIndex={-1} className="container-wrap py-24"><h1 className="section-title">Informasi belum dapat dimuat.</h1><p className="section-description my-6">Silakan coba kembali beberapa saat lagi.</p><button className="button" onClick={reset}>Coba kembali</button></main>;
}
