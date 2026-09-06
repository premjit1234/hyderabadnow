import Link from "next/link";
import { getAllUsersForAdmin } from "@/db/queries";
import { adminUpdateUserRoleAction, adminDeleteUserAction } from "@/app/admin/actions";

const ERROR_MESSAGES: Record<string, string> = {
  has_listings: "Can't delete that account — it still owns listings. Delete or reassign those first (use the link in the Listings column).",
  self_delete: "You can't delete the account you're currently logged in as.",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const allUsers = await getAllUsersForAdmin(q);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Users ({allUsers.length})</h1>
          <p className="mt-1 text-sm text-stone-500">Change roles or remove accounts.</p>
        </div>
        <form className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search name or email…"
            className="w-56 rounded-md border border-stone-200 px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800"
          >
            Search
          </button>
        </form>
      </div>

      {error && ERROR_MESSAGES[error] && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{ERROR_MESSAGES[error]}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Signed in via</th>
              <th className="px-4 py-3">Listings</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u) => (
              <tr key={u.id} className="border-t border-stone-100">
                <td className="px-4 py-3 font-medium text-stone-900">{u.name}</td>
                <td className="px-4 py-3 text-stone-600">{u.email}</td>
                <td className="px-4 py-3 capitalize text-stone-600">{u.authProvider}</td>
                <td className="px-4 py-3 text-stone-600">
                  {u.listingCount > 0 ? (
                    <Link href={`/admin/listings?owner=${u.id}`} className="text-indigo-600 hover:underline">
                      {u.listingCount}
                    </Link>
                  ) : (
                    "0"
                  )}
                </td>
                <td className="px-4 py-3">
                  <form action={adminUpdateUserRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <select
                      name="role"
                      defaultValue={u.role}
                      className="rounded-md border border-stone-200 px-2 py-1 text-xs"
                    >
                      <option value="buyer">Buyer</option>
                      <option value="agent">Agent</option>
                      <option value="seller">Owner</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-md border border-stone-200 px-2 py-1 text-xs font-medium text-stone-600 hover:border-indigo-600 hover:text-indigo-700"
                    >
                      Save
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-stone-500">
                  {new Date(u.createdAt).toLocaleDateString("en-IN")}
                </td>
                <td className="px-4 py-3">
                  {u.listingCount > 0 ? (
                    <span className="text-xs text-stone-400">Has listings</span>
                  ) : (
                    <form action={adminDeleteUserAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {allUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-stone-400">
                  No users match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
