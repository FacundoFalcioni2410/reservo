export default function DeleteConfirm({
  onConfirm,
  onCancel,
  disabled,
}: {
  onConfirm: () => void
  onCancel: () => void
  disabled?: boolean
}) {
  return (
    <>
      <span className="text-xs text-zinc-500">¿Eliminar?</span>
      <button
        onClick={onConfirm}
        disabled={disabled}
        className="text-xs px-2.5 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer transition"
      >
        Sí
      </button>
      <button
        onClick={onCancel}
        className="text-xs px-2.5 py-1 rounded-lg border border-zinc-300 text-zinc-600 hover:bg-zinc-50 cursor-pointer transition"
      >
        No
      </button>
    </>
  )
}
