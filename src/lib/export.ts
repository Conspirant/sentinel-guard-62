// One-click exporters for CSV, Excel (.xls) and PDF (via print dialog).
// Consistent SENTINEL-G report formatting across every page.

export interface ExportColumn<T> {
  key: string;
  header: string;
  format?: (row: T) => string | number | null | undefined;
}

function escapeCSV(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function escapeHTML(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}
function value<T>(row: T, col: ExportColumn<T>): string {
  const v = col.format ? col.format(row) : (row as Record<string, unknown>)[col.key];
  return v == null ? "" : String(v);
}
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

export interface ExportMeta {
  title: string;
  filename: string;
  subtitle?: string;
}

export function exportCSV<T>(rows: T[], cols: ExportColumn<T>[], meta: ExportMeta) {
  const head = cols.map((c) => escapeCSV(c.header)).join(",");
  const body = rows.map((r) => cols.map((c) => escapeCSV(value(r, c))).join(",")).join("\r\n");
  const csv = "\ufeff" + head + "\r\n" + body + "\r\n";
  download(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${meta.filename}-${stamp()}.csv`);
}

export function exportExcel<T>(rows: T[], cols: ExportColumn<T>[], meta: ExportMeta) {
  const th = cols.map((c) => `<th>${escapeHTML(c.header)}</th>`).join("");
  const tr = rows
    .map(
      (r) =>
        `<tr>${cols.map((c) => `<td>${escapeHTML(value(r, c))}</td>`).join("")}</tr>`,
    )
    .join("");
  const html =
    `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">` +
    `<head><meta charset="utf-8"><title>${escapeHTML(meta.title)}</title>` +
    `<style>table{border-collapse:collapse;font-family:Arial,sans-serif;font-size:11px}th{background:#0F172A;color:#fff;text-align:left;padding:6px 8px}td{border:1px solid #cbd5e1;padding:5px 8px}</style>` +
    `</head><body>` +
    `<h3 style="font-family:Arial;color:#1E3A8A;margin:0 0 4px">SENTINEL-G · ${escapeHTML(meta.title)}</h3>` +
    (meta.subtitle ? `<div style="font-family:Arial;font-size:11px;color:#475569;margin-bottom:8px">${escapeHTML(meta.subtitle)}</div>` : "") +
    `<div style="font-family:Arial;font-size:10px;color:#64748b;margin-bottom:6px">Generated ${new Date().toLocaleString()} · ${rows.length} record${rows.length === 1 ? "" : "s"}</div>` +
    `<table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>` +
    `</body></html>`;
  download(
    new Blob([html], { type: "application/vnd.ms-excel" }),
    `${meta.filename}-${stamp()}.xls`,
  );
}

export function exportPDF<T>(rows: T[], cols: ExportColumn<T>[], meta: ExportMeta) {
  const th = cols.map((c) => `<th>${escapeHTML(c.header)}</th>`).join("");
  const tr = rows
    .map(
      (r) =>
        `<tr>${cols.map((c) => `<td>${escapeHTML(value(r, c))}</td>`).join("")}</tr>`,
    )
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHTML(meta.filename)}</title>
<style>
  @page { size: A4 landscape; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #0b1220; margin: 0; }
  .header { display:flex; justify-content:space-between; align-items:flex-end; border-bottom:2px solid #1E3A8A; padding-bottom:8px; margin-bottom:14px; }
  .brand { font-size: 10px; letter-spacing: .22em; text-transform: uppercase; color: #1E3A8A; font-weight: 700; }
  h1 { font-size: 18px; margin: 4px 0 0; letter-spacing:-0.01em; }
  .subtitle { font-size: 11px; color: #64748b; margin-top: 2px; }
  .meta { font-size: 10px; color: #64748b; text-align: right; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead th { background: #0F172A; color: #fff; padding: 6px 8px; text-align: left; text-transform: uppercase; font-size: 9px; letter-spacing: .12em; font-weight:600; }
  tbody td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  .footer { margin-top: 14px; padding-top:6px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between; }
  @media print { .noprint { display: none; } }
  .noprint { position: fixed; top: 12px; right: 12px; }
  .btn { background:#1E3A8A;color:#fff;border:0;padding:6px 12px;border-radius:4px;font-size:12px;cursor:pointer;font-family:inherit; }
</style></head><body>
<div class="noprint"><button class="btn" onclick="window.print()">Print / Save as PDF</button></div>
<div class="header">
  <div>
    <div class="brand">SENTINEL-G · Lab Safety Platform</div>
    <h1>${escapeHTML(meta.title)}</h1>
    ${meta.subtitle ? `<div class="subtitle">${escapeHTML(meta.subtitle)}</div>` : ""}
  </div>
  <div class="meta">
    Generated ${new Date().toLocaleString()}<br/>
    ${rows.length} record${rows.length === 1 ? "" : "s"}<br/>
    Report ID · RPT-${stamp()}
  </div>
</div>
<table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>
<div class="footer"><span>SENTINEL-G · Confidential — signed &amp; timestamped for audit</span><span>${new Date().toISOString()}</span></div>
<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),350));</script>
</body></html>`;
  const w = window.open("", "_blank", "noopener");
  if (!w) {
    // popup blocked → fall back to blob download
    download(new Blob([html], { type: "text/html" }), `${meta.filename}-${stamp()}.html`);
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
