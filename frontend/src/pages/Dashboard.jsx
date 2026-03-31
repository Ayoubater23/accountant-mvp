import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import ExportButton from "../components/ExportButton.jsx";

function statusLabel(status) {
  switch (status) {
    case "processing":
      return "En cours";
    case "done":
      return "Terminé";
    case "failed":
      return "Échec";
    default:
      return status;
  }
}

function statusClass(status) {
  switch (status) {
    case "processing":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
    case "done":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading, isError, error } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data } = await api.get("/invoices");
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Historique de vos extractions de factures.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButton exportAll>Tout exporter (Excel)</ExportButton>
          <Link
            to="/import"
            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            Nouvel import
          </Link>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {isLoading && (
          <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Chargement des factures…
          </p>
        )}
        {isError && (
          <p className="p-8 text-center text-sm text-red-600 dark:text-red-400">
            {error?.response?.data?.detail ||
              "Impossible de charger la liste des factures."}
          </p>
        )}
        {!isLoading && !isError && invoices.length === 0 && (
          <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Aucune facture pour le moment.{" "}
            <Link to="/import" className="font-medium text-brand-700 hover:underline dark:text-brand-400">
              Importer un fichier
            </Link>
            .
          </p>
        )}
        {!isLoading && !isError && invoices.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/80">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Fichier
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Date
                  </th>
                  <th className="relative px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="max-w-[200px] truncate px-4 py-3 font-medium text-slate-900 dark:text-slate-100 sm:max-w-xs">
                      {inv.filename}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(
                          inv.status
                        )}`}
                      >
                        {statusLabel(inv.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-400">
                      {formatDate(inv.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                          to={`/import?facture=${inv.id}`}
                          className="text-brand-600 hover:text-brand-800 text-xs font-medium sm:text-sm dark:text-brand-400 dark:hover:text-brand-300"
                        >
                          Détails
                        </Link>
                        {inv.status === "done" && (
                          <ExportButton invoiceId={inv.id} className="!py-1 !px-2 !text-xs">
                            Excel
                          </ExportButton>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Supprimer cette extraction ? Cette action est irréversible."
                              )
                            ) {
                              deleteMutation.mutate(inv.id);
                            }
                          }}
                          className="text-xs font-medium text-red-600 hover:text-red-800 sm:text-sm disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                          disabled={deleteMutation.isPending}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
