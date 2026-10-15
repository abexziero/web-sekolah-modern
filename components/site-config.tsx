"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { CmsPayload } from "@/lib/cms-validation";
type Config = {
    settings?: CmsPayload;
    navigation?: CmsPayload;
};
const Context = createContext<Config>({});
export const useSiteConfig = () => useContext(Context);
export function SiteConfig({ value, children }: {
    value: Config;
    children: ReactNode;
}) {
    return <Context.Provider value={value}>{children}</Context.Provider>;
}
