import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteConfig } from "@/components/site-config";
import { getPublicCms } from "@/lib/server/public-cms";
import {getSitePresentation} from "@/lib/server/site-presentation";
import {publicMetadata} from "@/lib/server/public-metadata";

const geist = localFont({ src: "../public/fonts/geist-latin.woff2", variable: "--font-geist", weight: "100 900", display: "swap" });

export async function generateMetadata():Promise<Metadata>{
 const [home,settings]=await Promise.all([getPublicCms("home"),getPublicCms("settings")]);
 const title=settings?.payload.name||"MA Annur Samarinda — Tumbuh Berilmu, Melangkah Berkarakter";
 const description=home?.payload.copy.find((item:{id:string;text:string})=>item.id==="text-4")?.text||"Kenali Madrasah Aliyah Annur Samarinda, lingkungan belajar, kegiatan, dan informasi sekolah.";
 return {...publicMetadata({title,description,path:"/",image:home?.payload.images.find((item:{id:string})=>item.id==="hero")?.image||"school.jpg",example:!home||home.payload.example}),icons:{icon:"/images/logo.png"}};
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const presentation=await getSitePresentation();
  return <html lang="id" className={geist.variable} data-scroll-behavior="smooth"><body><SiteConfig value={presentation}>{children}</SiteConfig></body></html>;
}
