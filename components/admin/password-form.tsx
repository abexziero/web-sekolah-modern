"use client";
import { useActionState, useEffect } from "react";
import { changeInitialPassword } from "@/app/admin/akun/actions";
export function PasswordForm() {
    const [state, action, pending] = useActionState(changeInitialPassword, { error: "", success: false });
    useEffect(() => {
        if (state.success)
            window.location.assign("/admin/mfa");
    }, [state]);
    return <form className="admin-form" action={action}><fieldset disabled={pending}><label>Password awal<input type="password" name="currentPassword" required autoComplete="current-password" maxLength={128}/></label><label>Password baru<input type="password" name="newPassword" required minLength={16} maxLength={128} autoComplete="new-password"/></label>{state.error && <p role="alert" className="admin-error">{state.error}</p>}<button className="button">Ganti password dan lanjutkan</button></fieldset></form>;
}
