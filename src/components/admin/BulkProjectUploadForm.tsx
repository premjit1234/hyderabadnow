"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  previewBulkProjects,
  commitBulkProjects,
  type BulkPreviewResult,
  type BulkCommitResult,
} from "@/app/admin/bulkProjectActions";

export default function BulkProjectUploadForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<BulkPreviewResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [commitResult, setCommitResult] = useState<BulkCommitResult | null>(null);
  const [isPreviewing, startPreview] = useTransition();
  const [isImporting, startImport] = useTransition();

  const readyRows = useMemo(
    () => (preview?.ok ? preview.rows.filter((r) => r.errors.length === 0 && r.data) : []),
    [preview]
  );
  const issueRows = useMemo(() => (preview?.ok ? preview.rows.filter((r) => r.errors.length > 0) : []), [preview]);

  function handleChooseFile() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setCommitResult(null);
    setPreview(null);
    setPreviewError(null);
  }

  function handlePreview() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setPreviewError("Choose a .xlsx file first.");
      return;
    }
    setPreviewError(null);
    const fd = new FormData();
    fd.append("file", file);
    startPreview(async () => {
      const result = await previewBulkProjects(fd);
      setPreview(result);
    });
  }

  function handleImport() {
    if (readyRows.length === 0) return;
    startImport(async () => {
      const result = await commitBulkProjects(readyRows.map((r) => ({ rowNumber: r.rowNumber, fields: r.fields })));
      setCommitResult(result);
    });
  }

  function reset() {
    setFileName("");
    setPreview(null);
    setPreviewError(null);
    setCommitResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-stone-900">1. Get the template</h2>
            <p className="mt-1 text-sm text-stone-500">
              One row per project. Required columns are marked with * — everything else can be filled in later from
              the admin panel. Photos and brochure files still need to be added by hand after import.
            </p>
          </div>
          <a
            href="/templates/HyderabadNow_Bulk_Project_Upload_Template.xlsx"
            download
            className="shrink-0 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Download template
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-bold text-stone-900">2. Upload your filled-in file</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleChooseFile}
            className="block text-sm text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-stone-700 hover:file:bg-stone-200"
          />
          <button
            type="button"
            onClick={handlePreview}
            disabled={isPreviewing || !fileName}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPreviewing ? "Reading file…" : "Preview"}
          </button>
          {(preview || commitResult) && (
            <button type="button" onClick={reset} className="text-sm text-stone-500 underline hover:text-stone-700">
              Start over
            </button>
          )}
        </div>
        {previewError && <p className="mt-2 text-sm text-red-600">{previewError}</p>}
      </div>

      {preview && !preview.ok && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{preview.error}</div>
      )}

      {preview?.ok && !commitResult && (
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-stone-900">3. Review before importing</h2>
              <p className="mt-1 text-sm text-stone-500">
                <span className="font-semibold text-emerald-700">{readyRows.length} ready to import</span>
                {issueRows.length > 0 && (
                  <>
                    {" "}
                    · <span className="font-semibold text-red-600">{issueRows.length} need fixing</span> (won&apos;t be
                    imported)
                  </>
                )}
                {preview.skippedExampleRow && <> · the sample row was recognized and skipped</>}
              </p>
            </div>
            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting || readyRows.length === 0}
              className="shrink-0 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isImporting ? "Importing…" : `Import ${readyRows.length} project${readyRows.length === 1 ? "" : "s"}`}
            </button>
          </div>

          {readyRows.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Ready to import</h3>
              <div className="max-h-80 overflow-auto rounded-lg border border-stone-200">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Locality</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {readyRows.map((row) => (
                      <tr key={row.rowNumber}>
                        <td className="px-3 py-2 text-stone-400">{row.rowNumber}</td>
                        <td className="px-3 py-2 font-medium text-stone-900">
                          {row.name}
                          {row.warnings.length > 0 && (
                            <p className="mt-0.5 text-xs font-normal text-amber-600">
                              {row.warnings.join(" ")}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-stone-600">{row.data?.locality}</td>
                        <td className="px-3 py-2 text-stone-600">{row.data?.propertyType}</td>
                        <td className="px-3 py-2 text-stone-600">{row.data?.constructionStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {issueRows.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Needs fixing</h3>
              <div className="max-h-80 overflow-auto rounded-lg border border-red-200">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-red-50 text-xs uppercase tracking-wide text-red-700">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Problems</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {issueRows.map((row) => (
                      <tr key={row.rowNumber}>
                        <td className="px-3 py-2 text-stone-400">{row.rowNumber}</td>
                        <td className="px-3 py-2 font-medium text-stone-900">{row.name}</td>
                        <td className="px-3 py-2 text-red-700">
                          <ul className="list-disc space-y-0.5 pl-4">
                            {row.errors.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-stone-500">
                Fix these rows in your spreadsheet and upload the file again — the rows above that are ready won&apos;t
                be affected.
              </p>
            </div>
          )}
        </div>
      )}

      {commitResult && (
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="text-sm font-bold text-stone-900">Import complete</h2>
          <p className="mt-1 text-sm text-stone-600">
            <span className="font-semibold text-emerald-700">{commitResult.created.length} project(s) created</span>
            {commitResult.failed.length > 0 && (
              <>
                {" "}
                · <span className="font-semibold text-red-600">{commitResult.failed.length} failed</span>
              </>
            )}
          </p>

          {commitResult.created.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {commitResult.created.map((p) => (
                <li key={p.projectId}>
                  <Link href={`/admin/projects/${p.projectId}/edit`} className="text-indigo-600 hover:underline">
                    {p.name}
                  </Link>
                  <span className="text-stone-400"> — add photos, brochure, and anything else from here.</span>
                </li>
              ))}
            </ul>
          )}

          {commitResult.failed.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-600">Failed rows</h3>
              <ul className="space-y-1 text-sm text-red-700">
                {commitResult.failed.map((f) => (
                  <li key={f.rowNumber}>
                    Row {f.rowNumber} ({f.name}): {f.errors.join(" ")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <Link href="/admin/projects" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Go to Projects
            </Link>
            <button type="button" onClick={reset} className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
              Upload another file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
