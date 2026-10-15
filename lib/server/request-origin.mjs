export function assertRequestOrigin(request, env = process.env) {
    const base = new URL(env.BETTER_AUTH_URL || "http://127.0.0.1:3000");
    const origins = base.protocol === "http:" && ["localhost", "127.0.0.1"].includes(base.hostname) ? [new URL(`http://localhost:${base.port || 80}`).origin, new URL(`http://127.0.0.1:${base.port || 80}`).origin] : [base.origin];
    if (!origins.includes(request.headers.get("origin")))
        throw new Error("Asal permintaan ditolak.");
}
