import Image from "next/image";
import { imageUrl } from "@/lib/cms-validation";

export function TeacherCards({ heading }: { heading: "h2" | "h4" }) {
  const Heading = heading;
  const profiles = [
    { role: "Pendidik Keagamaan", description: "Mendampingi pemahaman keagamaan serta pembiasaan adab dan akhlak dalam keseharian." },
    { role: "Pendidik Akademik", description: "Mengajak siswa mengembangkan penalaran, rasa ingin tahu, dan keterampilan memecahkan masalah." },
    { role: "Tenaga Administrasi", description: "Mendukung pencatatan, layanan informasi, dan komunikasi antara madrasah dengan keluarga." }
  ];
  return <div className="teacher-grid">{profiles.map((profile, index) => <article className="teacher-card" key={profile.role} data-reveal data-delay={index * 0.14}>
    <div className="teacher-photo" data-photo-reveal><Image src={imageUrl("teacher-placeholder.svg")} alt="Avatar dummy untuk pratinjau profil guru" fill sizes="(max-width: 767px) 92vw, 380px" className="object-cover" /><span className="dummy-label">Gambar dummy</span></div>
    <div className="teacher-content"><Heading>{profile.role}</Heading><p>{profile.description}</p><span className="content-note">Konten contoh · Bukan identitas pegawai</span></div>
  </article>)}</div>;
}
