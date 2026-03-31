const SECTIONS = [
  {
    title: "Fournisseur",
    rows: [
      { key: "vendor_name", label: "Nom" },
      { key: "vendor_address", label: "Adresse" },
      { key: "vendor_phone", label: "Téléphone" },
      { key: "vendor_email", label: "Email" },
      { key: "vendor_siret", label: "SIRET" },
    ],
  },
  {
    title: "Client",
    rows: [
      { key: "client_name", label: "Nom" },
      { key: "client_address", label: "Adresse" },
    ],
  },
  {
    title: "Facture",
    rows: [
      { key: "invoice_number", label: "N° facture" },
      { key: "date", label: "Date" },
      { key: "due_date", label: "Date d'échéance" },
      { key: "payment_terms", label: "Conditions de paiement" },
    ],
  },
  {
    title: "Montants",
    rows: [
      { key: "total_ht", label: "Total HT" },
      { key: "tva_rate", label: "Taux TVA" },
      { key: "tva", label: "TVA" },
      { key: "discount", label: "Remise" },
      { key: "total_ttc", label: "Total TTC" },
      { key: "currency", label: "Devise" },
    ],
  },
];

function display(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

export default function ResultTable({ data }) {
  const d = data ?? {};

  return (
    <div className="space-y-4">
      {SECTIONS.map(({ title, rows }) => (
        <div
          key={title}
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950"
        >
          <div className="bg-slate-50 px-4 py-2 dark:bg-slate-800/80">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {title}
            </h3>
          </div>
          <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-700">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {rows.map(({ key, label }) => (
                <tr key={key} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-500 dark:text-slate-400 w-40">
                    {label}
                  </td>
                  <td className="px-4 py-2.5 text-slate-900 dark:text-slate-100">
                    {display(d[key])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
