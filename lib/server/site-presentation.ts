import "server-only";
import {getPublicCms} from "./public-cms";
export async function getSitePresentation(){
 const [settings,navigation]=await Promise.all([getPublicCms("settings"),getPublicCms("navigation")]);
 return {
  settings:settings?.payload,
  navigation:navigation?.payload
 };
}
