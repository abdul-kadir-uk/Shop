interface Props {
  onMenuClick: () => void;
}

export default function MedicineHeader({ onMenuClick }: Props) {
  return (
    <header className="bg-white shadow px-4 sm:px-6 py-4 flex items-center justify-between">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded hover:bg-gray-100"
        aria-label="Open sidebar"
      >
        ☰
      </button>

      <h1 className="text-lg sm:text-xl font-bold">
        Medicine Seller Dashboard
      </h1>

      <div />
    </header>
  );
}
