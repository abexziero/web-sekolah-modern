import { Download } from "lucide-react";
import { downloads } from "@/lib/preview-content";
import { sitePath } from "@/lib/site-path";

export function DownloadList() {
  return <div className="download-list">{downloads.map(item => <a key={item.href} href={sitePath(item.href)} download className="download-item">
    <Download size={24} aria-hidden="true" /><div><strong>{item.title}</strong><p>{item.description}</p><span className="content-note">TXT · Konten contoh</span></div>
  </a>)}</div>;
}
