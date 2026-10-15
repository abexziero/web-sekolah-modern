import { Download } from "lucide-react";
import { downloads } from "@/lib/preview-content";

export function DownloadList() {
  return <div className="download-list">{downloads.map(item => <a key={item.href} href={item.href} download className="download-item">
    <Download size={24} aria-hidden="true" /><div><strong>{item.title}</strong><p>{item.description}</p><span className="content-note">TXT · Konten contoh</span></div>
  </a>)}</div>;
}
