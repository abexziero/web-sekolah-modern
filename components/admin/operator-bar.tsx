import { AdminNavigation } from "./admin-navigation";
import { LogoutButton } from "./auth-form";
export function OperatorBar({ user,type }: { user: { name: string; role: string };type?:string }) {
  return <div className="admin-operator"><AdminNavigation admin={user.role === "super_admin"} activeType={type}/><span>{user.name} · {user.role === "super_admin" ? "Super Admin" : "Editor"}</span><LogoutButton /></div>;
}
