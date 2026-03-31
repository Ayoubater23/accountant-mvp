import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import UploadZone from "../components/UploadZone.jsx";
import ResultTable from "../components/ResultTable.jsx";
import ExportButton from "../components/ExportButton.jsx";

function statusLabel(status) {
  switch (status) {
    case "processing":
      return "Extraction en cours…";
    case "done":
      return "Extraction terminée";
    case "failed":
      return "Échec de l’extraction";
    default:
      return status;
  }
}

export default function Upload() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const factureFromUrl = searchParams.get("facture");

  const [activeId, setActiveId] = useState(factureFromUrl || null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (factureFromUrl) setActiveId(factureFromUrl);
  }, [factureFromUrl]);

  const invoiceQuery = useQuery({
    queryKey: ["invoice", activeId],
    queryFn: async () => {
      const { data } = await api.get(`/invoices/${activeId}`);
      return data;
    },
    enabled: Boolean(activeId),
    refetchInterval: (query) =>
      query.state.data?.status === "processing" ? 2000 : false,
  });

  const invoice = invoiceQuery.data;

  const onFile = useCallback(
    async (file) => {
      setUploadError("");
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", file);
        const { data } = await api.post("/invoices/upload", form);
        setActiveId(data.id);
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
      } catch (err) {
        const msg =
          err.response?.data?.detail ||
          "Échec de l’envoi du fichier. Réessayez.";
        setUploadError(typeof msg === "string" ? msg : "Erreur d’upload.");
      } finally {
        setUploading(false);
      }
    },
    [queryClient]
  );

  const showResults = Boolean(activeId);
  const processing = invoice?.status === "processing";
  const failed = invoice?.status === "failed";
  const done = invoice?.status === "done";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Importer une facture
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Déposez un PDF ou une image pour extraire les champs automatiquement.
          </p>
        </div>
        <Link
          to="/"
          className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
        >
          ← Retour au tableau de bord
        </Link>
      </div>

      <div className="mt-8 space-y-8">
        <UploadZone
          onFile={onFile}
          disabled={uploading}
          error={uploadError}
        />

        {uploading && (
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Envoi du fichier…
          </p>
        )}

        {showResults && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Résultat
                </h2>
                {invoice && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {invoice.filename}
                    </span>
                  </p>
                )}
              </div>
              {done && <ExportButton invoiceId={activeId} />}
            </div>

            {invoiceQuery.isLoading && (
              <p className="text-sm text-slate-500 dark:text-slate-400">Chargement…</p>
            )}
            {invoiceQuery.isError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Impossible de charger cette facture.
              </p>
            )}

            {invoice && (
              <>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      processing
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                        : failed
                          ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                    }`}
                  >
                    {statusLabel(invoice.status)}
                  </span>
                  {processing && (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent dark:border-brand-400" />
                  )}
                </div>

                {processing && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Veuillez patienter pendant l’analyse OCR et l’extraction des
                    données. Cette page se met à jour automatiquement.
                  </p>
                )}

                {failed && (
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Une erreur s’est produite lors de l’extraction. Vous pouvez
                    réessayer avec un autre fichier ou une meilleure qualité
                    d’image.
                  </p>
                )}

                {(done || (invoice.data && !processing)) && (
                  <ResultTable data={invoice.data} />
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
