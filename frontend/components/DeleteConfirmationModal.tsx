"use client";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  name: string;
  email?: string;
  message?: string;
  loading?: boolean;
  buttonText?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmationModal({
  isOpen,
  title,
  name,
  email,
  message,
  buttonText = "Delete",
  loading = false,
  onClose,
  onConfirm,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}

        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-bold text-red-700">{title}</h2>
        </div>

        {/* Body */}

        <div className="px-6 py-5 space-y-5">
          <p className="text-gray-700">
            Are you sure you want to permanently delete this record?
          </p>

          <div className="rounded-lg border bg-gray-50 p-4 space-y-2">
            <div>
              <p className="text-xs uppercase text-gray-500">Name</p>

              <p className="font-semibold text-gray-800">{name}</p>
            </div>

            {email && (
              <div>
                <p className="text-xs uppercase text-gray-500">Email</p>

                <p className="font-semibold text-gray-800 break-all">{email}</p>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm font-medium text-red-700">
              ⚠ This action cannot be undone.
            </p>

            <p className="mt-2 text-sm text-red-600">
              {message ||
                "The selected record and all associated information will be permanently deleted."}
            </p>
          </div>
        </div>

        {/* Footer */}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-5 py-2 hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-700 px-5 py-2 text-white hover:bg-red-800 transition disabled:opacity-60"
          >
            {loading ? "Deleting..." : buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
