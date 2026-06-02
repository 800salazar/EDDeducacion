"use client";

import { useState } from "react";

const inputCls =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-ink shadow-sm outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/20";

export function IdeasClaveInputs({ initialIdeas }: { initialIdeas: string[] }) {
  const [ideas, setIdeas] = useState<string[]>(
    initialIdeas.length > 0 ? initialIdeas : ["", "", ""]
  );

  function actualizarIdea(index: number, value: string) {
    setIdeas((prev) => prev.map((idea, i) => (i === index ? value : idea)));
  }

  function agregarIdea() {
    setIdeas((prev) => [...prev, ""]);
  }

  function quitarIdea(index: number) {
    setIdeas((prev) => {
      if (prev.length <= 1) return [""];
      return prev.filter((_, i) => i !== index);
    });
  }

  return (
    <div className="space-y-2">
      {ideas.map((idea, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            name="ideas_clave_item"
            value={idea}
            onChange={(e) => actualizarIdea(idx, e.target.value)}
            placeholder={`Idea ${idx + 1}`}
            maxLength={160}
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => quitarIdea(idx)}
            className="rounded-lg border border-black/10 px-3 py-2 text-xs font-medium text-ink/65 transition hover:bg-black/5"
            title="Quitar idea"
          >
            -
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={agregarIdea}
        className="rounded-lg border border-bni/30 px-3 py-2 text-sm font-semibold text-bni transition hover:bg-bni/10"
      >
        + Agregar idea
      </button>

      <p className="text-xs text-ink/45">
        Una idea corta por campo (máximo 160 caracteres).
      </p>
    </div>
  );
}
