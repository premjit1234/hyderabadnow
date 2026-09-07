"use client";

import Image from "next/image";
import { useActionState } from "react";
import { adminCreateBlogPostAction, adminUpdateBlogPostAction, type ActionState } from "@/app/admin/actions";
import { BLOG_CATEGORIES } from "@/lib/blog";
import RichTextEditor from "@/components/admin/RichTextEditor";

type EditablePost = {
  id: number;
  title: string;
  category: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  videoUrl: string | null;
  contentHtml: string;
  status: string;
  images: { id: number; url: string }[];
};

const inputClass = "w-full rounded-md border border-stone-200 px-3 py-2.5 text-sm";
const labelClass = "mb-1 block text-sm font-medium text-stone-700";

export default function AdminBlogPostForm({ post }: { post?: EditablePost }) {
  const action = post ? adminUpdateBlogPostAction : adminCreateBlogPostAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {post && <input type="hidden" name="postId" value={post.id} />}

      <div>
        <label className={labelClass}>Title</label>
        <input name="title" required defaultValue={post?.title} placeholder="e.g. 5 things to know before buying in Kompally" className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Category</label>
          <select name="category" defaultValue={post?.category ?? "General"} className={inputClass}>
            {BLOG_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select name="status" defaultValue={post?.status ?? "draft"} className={inputClass}>
            <option value="draft">Draft (not visible on the site)</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Excerpt (shown on the blog listing card)</label>
        <textarea
          name="excerpt"
          rows={2}
          maxLength={300}
          defaultValue={post?.excerpt ?? ""}
          placeholder="A short one or two sentence summary…"
          className={inputClass}
        />
      </div>

      {post?.coverImageUrl && (
        <div>
          <label className={labelClass}>Current cover image</label>
          <div className="relative aspect-[16/9] w-full max-w-xs overflow-hidden rounded-md border border-stone-200">
            <Image src={post.coverImageUrl} alt="" fill sizes="320px" className="object-cover" />
          </div>
          <label className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
            <input type="checkbox" name="removeCoverImage" className="h-3.5 w-3.5" />
            Remove cover image
          </label>
        </div>
      )}
      <div>
        <label className={labelClass}>{post?.coverImageUrl ? "Replace cover image" : "Cover image"}</label>
        <input type="file" name="coverImage" accept="image/png,image/jpeg,image/webp,image/gif" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Video link (optional — YouTube or Vimeo)</label>
        <input name="videoUrl" defaultValue={post?.videoUrl ?? ""} placeholder="https://www.youtube.com/watch?v=…" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Body</label>
        <RichTextEditor name="contentHtml" defaultValue={post?.contentHtml} />
      </div>

      {post && post.images.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">Gallery images</label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {post.images.map((img) => (
              <div key={img.id} className="flex flex-col items-center gap-1.5">
                <div className="relative aspect-square w-full overflow-hidden rounded-md border border-stone-200">
                  <Image src={img.url} alt="" fill sizes="120px" className="object-cover" />
                </div>
                <label className="flex items-center gap-1 text-xs text-red-600">
                  <input type="checkbox" name="removeImageId" value={img.id} className="h-3.5 w-3.5" />
                  Remove
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className={labelClass}>{post ? "Add gallery images (up to 15)" : "Gallery images (up to 15, optional)"}</label>
        <input type="file" name="images" accept="image/png,image/jpeg,image/webp,image/gif" multiple className={inputClass} />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? "Saving..." : post ? "Save changes" : "Create post"}
      </button>
    </form>
  );
}
