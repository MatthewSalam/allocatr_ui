export default function Spinner({ message = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#2D6A4F] animate-spin" />
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}