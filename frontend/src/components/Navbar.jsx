import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

const linkClass = ({ isActive }) =>
  `text-sm font-medium px-3 py-2 rounded-md transition ${
    isActive
      ? "bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-100"
      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
  }`;

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-slate-700 dark:bg-slate-900/90 dark:supports-[backdrop-filter]:bg-slate-900/70">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
        <Link to="/" className="text-lg font-semibold text-brand-700 dark:text-brand-400">
          FacturaAI
        </Link>

        <nav className="flex items-center gap-1">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <NavLink to="/" end className={linkClass}>
                Tableau de bord
              </NavLink>
              <NavLink to="/import" className={linkClass}>
                Importer
              </NavLink>
              {user?.email && (
                <span className="hidden text-xs text-slate-500 dark:text-slate-400 sm:inline px-2 max-w-[140px] truncate">
                  {user.email}
                </span>
              )}
              <button
                type="button"
                onClick={logout}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <NavLink to="/connexion" className={linkClass}>
                Connexion
              </NavLink>
              <NavLink to="/inscription" className={linkClass}>
                Inscription
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
