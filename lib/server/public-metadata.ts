import "server-only";
import type {Metadata} from "next";
import {imageUrl} from "../cms-validation";
export function publicMetadata({title,description,path,image,example=false}:{title:string;description:string;path:string;image?:string;example?:boolean}):Metadata{
 const base=new URL(process.env.SITE_URL||process.env.BETTER_AUTH_URL||"http://127.0.0.1:3000");
 const index=process.env.SITE_INDEXABLE==="true"&&!!process.env.SITE_URL&&!example;
 return {title,description,metadataBase:base,alternates:{canonical:path},robots:{index,follow:index},openGraph:{title,description,url:path,type:"website",...(image?{images:[{url:imageUrl(image)}]}:{})},twitter:{card:"summary_large_image",title,description,...(image?{images:[imageUrl(image)]}:{})}};
}
