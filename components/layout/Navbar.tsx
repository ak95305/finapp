import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-gray-900">
          FinApp
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/items"
            className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            Items
          </Link>
          <Link
            href="/items/new"
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            + New
          </Link>
        </nav>
      </div>
    </header>
  );
}
