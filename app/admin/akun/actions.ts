"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getOperatorManagement } from "@/lib/server/operator-management";
import { AccountError } from "@/lib/server/operator-management.mjs";
export async function manageAccount(_state: {
    error: string;
    success: string;
}, form: FormData) {
    try {
        const service = getOperatorManagement(), h = await headers(), intent = String(form.get("intent")), email = String(form.get("email")), role = String(form.get("role")), reauth = String(form.get("reauth"));
        if (intent === "create")
            await service.create(h, { email, role, reauth, name: String(form.get("name")), password: String(form.get("password")) });
        else
            await service.change(h, { email, role, reauth, action: intent, name: String(form.get("name") || "") });
        revalidatePath("/admin/akun");
        return { error: "", success: "Perubahan akun tersimpan. Sesi terkait dicabut jika diperlukan." };
    }
    catch (error) {
        return { error: error instanceof AccountError ? error.message : "Operasi ditolak atau belum tersimpan.", success: "" };
    }
}
export async function changeInitialPassword(_state: {
    error: string;
}, form: FormData) {
    try {
        await getOperatorManagement().changeInitialPassword(await headers(), { currentPassword: String(form.get("currentPassword")), newPassword: String(form.get("newPassword")) });
        return { error: "", success: true };
    }
    catch (error) {
        return { error: error instanceof AccountError ? error.message : "Password belum diperbarui.", success: false };
    }
}
