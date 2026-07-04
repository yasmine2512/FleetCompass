import { useState } from "react";

interface AddDriverModalProps {
  onAdd: (name: string, phone: string) => void;
  onCancel: () => void;
}

function AddDriverModal({
  onAdd,
  onCancel,
}: AddDriverModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const valid =
    name.trim().length > 1 &&
    phone.trim().length >= 10;

  const handleSubmit = () => {
    if (valid) {
      onAdd(name.trim(), phone.trim());
    }
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
      <div className="w-80 rounded-xl border border-indigo-500/40 bg-slate-900/95 p-6 shadow-[0_0_32px_rgba(99,102,241,0.2)]">

        {/* Header */}
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-indigo-300">
          Add New Driver
        </p>

        {/* Driver Name */}
        <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Driver Name
        </label>

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && handleSubmit()
          }
          placeholder="e.g. D-KILO"
          className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-indigo-500"
        />

        {/* Phone */}
        <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Phone Number
        </label>

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && handleSubmit()
          }
          placeholder="e.g. +15550199"
          className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-indigo-500"
        />

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!valid}
            className={`flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wide transition-all ${
              valid
                ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-[0.98]"
                : "cursor-not-allowed bg-slate-700/40 text-slate-500"
            }`}
          >
            Add Driver
          </button>

          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddDriverModal;