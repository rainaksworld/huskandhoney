import { adminLogout } from "@/app/admin/actions";

export function LogoutButton() {
  return (
    <form action={adminLogout} style={{ display: "inline" }}>
      <button className="admin-nav-logout" type="submit">
        Log out
      </button>
    </form>
  );
}
