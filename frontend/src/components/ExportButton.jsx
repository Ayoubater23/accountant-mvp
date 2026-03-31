import { useState } from "react";
import { api } from "../api/client.js";

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function filenameFromDisposition(header) {
  if (!header) return null;
  const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(header);
  return m?.[1]?.trim() || null;
}

export default function ExportButton({
  invoiceId,
  exportAll = false,
  className = "",
  children,
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const path = exportAll
        ? "/invoices/export/all"
        : `/invoices/${invoiceId}/export/excel`;
      const res = await api.get(path, { responseType: "blob" });
      const cd = res.headers["content-disposition"];
      const name =
        filenameFromDisposition(cd) ||
        (exportAll ? "factures.xlsx" : "facture.xlsx");
      triggerDownload(res.data, name);
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || (!exportAll && !invoiceId);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition
        ${
          disabled
            ? "cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-500"
            : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm dark:bg-emerald-500 dark:hover:bg-emerald-600"
        }
        ${className}
      `}
    >
      {loading ? "Téléchargement…" : children || "Exporter Excel"}
    </button>
  );
}
