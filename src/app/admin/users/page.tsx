import { getAllUsersForAdmin } from "@/db/queries";
import { adminUpdateUserRoleAction, adminDeleteUserAction } from "@/app/admin/actions";

const ERROR_MESSAGES: Record<string, string> = {
  has_listings: "Can't delete that account — it still owns listings. Delete or reassign those first.",
  self_delete: "You can't delete the account you're currently logged in as.",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const allUsers = await getAllUsersForAdmin();

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-stone-900">All users ({allUsers.length})</h2>
      {error && ERROR_MESSAGES[error] && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{ERROR_MESSAGES[error]}</p>
      )}
      <div className="overflow-x-auto rounded-lg border border-stone-200">
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
                <td className="px-4 py-3 text-stone-600">{u.listingCount}</td>
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
                      className="rounded-md border border-stone-200 px-2 py-1 text-xs font-medium text-stone-600 hover:border-emerald-600 hover:text-emerald-700"
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
