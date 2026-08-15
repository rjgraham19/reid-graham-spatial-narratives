import { useMemo, useState } from "react";
import type { DesignOverridesFile, ElementOverride, Scope } from "@/lib/design-overrides.types";
import type { ElementSnapshot } from "./protocol";
import { FONT_CATALOG, ensureFontLoaded, type FontCategory } from "./fonts";

type Props = {
  selection: ElementSnapshot | null;
  working: DesignOverridesFile;
  deviceScope: Scope;
  onPatch: (id: string, scope: Scope, patch: ElementOverride) => void;
  onReset: (id: string) => void;
  onHide: (id: string) => void;
};

export function PropertyPanel({ selection, working, deviceScope, onPatch, onReset, onHide }: Props) {
  if (!selection) {
    return <div style={{ color: "#666" }}>Select an element on the canvas to edit it.</div>;
  }

  const responsive = working[selection.id]?.[deviceScope] ?? {};
  const base = working[selection.id]?.base ?? {};
  const merged: ElementOverride = { ...base, ...responsive };

  const patchBase = (patch: ElementOverride) => onPatch(selection.id, "base", patch);
  const patchResponsive = (patch: ElementOverride) => onPatch(selection.id, deviceScope, patch);

  return (
    <div>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Selected</div>
      <div style={{ marginBottom: 16, fontWeight: 600 }}>{selection.id}</div>

      {selection.kind !== "image" ? (
        <TextControls
          text={merged.text ?? selection.text ?? ""}
          value={merged}
          onTextChange={(text) => patchBase({ text })}
          onChange={patchResponsive}
        />
      ) : (
        <ImageControls value={merged} onChange={patchResponsive} onCaptionChange={(caption) => patchBase({ caption })} />
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <button style={btnStyle} onClick={() => onReset(selection.id)}>Reset</button>
        <button style={btnStyle} onClick={() => onHide(selection.id)}>Hide</button>
      </div>
    </div>
  );
}

function TextControls({
  text,
  value,
  onTextChange,
  onChange,
}: {
  text: string;
  value: ElementOverride;
  onTextChange: (text: string) => void;
  onChange: (patch: ElementOverride) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Field label="Text">
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </Field>

      <Field label="Font family">
        <FontPicker value={value.fontFamily} onChange={(fontFamily) => onChange({ fontFamily })} />
      </Field>

      <Row>
        <Field label="Size (px)">
          <NumberInput value={value.fontSize} onChange={(fontSize) => onChange({ fontSize })} />
        </Field>
        <Field label="Weight">
          <select
            value={value.fontWeight ?? ""}
            onChange={(e) => onChange({ fontWeight: e.target.value ? Number(e.target.value) : undefined })}
            style={inputStyle}
          >
            <option value="">Default</option>
            {[300, 400, 500, 600, 700, 800].map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </Field>
      </Row>

      <Row>
        <Field label="Line height">
          <NumberInput step={0.05} value={value.lineHeight} onChange={(lineHeight) => onChange({ lineHeight })} />
        </Field>
        <Field label="Letter spacing (px)">
          <NumberInput step={0.1} value={value.letterSpacing} onChange={(letterSpacing) => onChange({ letterSpacing })} />
        </Field>
      </Row>

      <Field label="Text width (px)">
        <NumberInput value={value.textWidth} onChange={(textWidth) => onChange({ textWidth })} />
      </Field>

      <Field label="Alignment">
        <AlignButtons value={value.align} onChange={(align) => onChange({ align })} />
      </Field>

      <Field label="Color">
        <input
          type="color"
          value={value.color ?? "#ffffff"}
          onChange={(e) => onChange({ color: e.target.value })}
          style={{ ...inputStyle, padding: 2, height: 32 }}
        />
      </Field>

      <Row>
        <Field label="Offset X (px)">
          <NumberInput value={value.offsetX} onChange={(offsetX) => onChange({ offsetX })} />
        </Field>
        <Field label="Offset Y (px)">
          <NumberInput value={value.offsetY} onChange={(offsetY) => onChange({ offsetY })} />
        </Field>
      </Row>
    </div>
  );
}

function ImageControls({
  value,
  onChange,
  onCaptionChange,
}: {
  value: ElementOverride;
  onChange: (patch: ElementOverride) => void;
  onCaptionChange: (caption: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Field label="Caption">
        <textarea
          value={value.caption ?? ""}
          onChange={(e) => onCaptionChange(e.target.value)}
          rows={2}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </Field>

      <Row>
        <Field label="Width (%)">
          <NumberInput min={10} max={100} value={value.widthPct} onChange={(widthPct) => onChange({ widthPct })} />
        </Field>
        <Field label="Max width (px)">
          <NumberInput value={value.maxWidth} onChange={(maxWidth) => onChange({ maxWidth })} />
        </Field>
      </Row>

      <Field label="Alignment">
        <AlignButtons value={value.align} onChange={(align) => onChange({ align })} />
      </Field>

      <Row>
        <Field label="Offset X (px)">
          <NumberInput value={value.offsetX} onChange={(offsetX) => onChange({ offsetX })} />
        </Field>
        <Field label="Offset Y (px)">
          <NumberInput value={value.offsetY} onChange={(offsetY) => onChange({ offsetY })} />
        </Field>
      </Row>

      <Field label="Crop / fit">
        <select
          value={value.objectFit ?? "cover"}
          onChange={(e) => onChange({ objectFit: e.target.value as "cover" | "contain" })}
          style={inputStyle}
        >
          <option value="cover">Cover (crop to fill)</option>
          <option value="contain">Contain (show whole image)</option>
        </select>
      </Field>

      <Field label="Focal point">
        <FocalPointPicker
          x={value.objectPositionX ?? 50}
          y={value.objectPositionY ?? 50}
          onChange={(objectPositionX, objectPositionY) => onChange({ objectPositionX, objectPositionY })}
        />
      </Field>
      {/* Width/max-width/offsets are the only adjustable dimensions — height
          is never set directly, so proportions can't be squashed or stretched. */}
    </div>
  );
}

function FontPicker({ value, onChange }: { value?: string; onChange: (v: string | undefined) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FontCategory | "all">("all");
  const [open, setOpen] = useState(false);

  const results = useMemo(
    () =>
      FONT_CATALOG.filter(
        (f) =>
          (category === "all" || f.category === category) &&
          f.label.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, category],
  );

  return (
    <div style={{ position: "relative" }}>
      <button
        style={{ ...inputStyle, textAlign: "left", cursor: "pointer" }}
        onClick={() => setOpen((o) => !o)}
      >
        {value ?? "Default (site font)"}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "#1a1a1c", border: "1px solid #333", borderRadius: 6, marginTop: 4, maxHeight: 280, overflowY: "auto" }}>
          <div style={{ padding: 8, display: "flex", gap: 6 }}>
            <input
              autoFocus
              placeholder="Search fonts…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
          <div style={{ display: "flex", gap: 4, padding: "0 8px 8px", flexWrap: "wrap" }}>
            {(["all", "serif", "sans-serif", "display", "monospace", "handwriting"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{ ...chipStyle, ...(category === c ? chipActiveStyle : {}) }}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              onChange(undefined);
              setOpen(false);
            }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", color: "#9fb8ff", cursor: "pointer" }}
          >
            Reset to site default
          </button>
          {results.map((f) => {
            ensureFontLoaded(f.id);
            return (
              <button
                key={f.id}
                onClick={() => {
                  onChange(f.label);
                  setOpen(false);
                }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", color: "#eee", cursor: "pointer", fontFamily: `${f.label}, inherit`, fontSize: 15 }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FocalPointPicker({ x, y, onChange }: { x: number; y: number; onChange: (x: number, y: number) => void }) {
  return (
    <div
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const px = Math.round(((e.clientX - rect.left) / rect.width) * 100);
        const py = Math.round(((e.clientY - rect.top) / rect.height) * 100);
        onChange(Math.max(0, Math.min(100, px)), Math.max(0, Math.min(100, py)));
      }}
      style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: "#1a1a1c", border: "1px solid #333", borderRadius: 6, cursor: "crosshair" }}
    >
      <div
        style={{
          position: "absolute",
          left: `${x}%`,
          top: `${y}%`,
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#4f8cff",
          transform: "translate(-50%, -50%)",
          boxShadow: "0 0 0 2px #fff",
        }}
      />
    </div>
  );
}

function AlignButtons({ value, onChange }: { value?: string; onChange: (v: "left" | "center" | "right") => void }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {(["left", "center", "right"] as const).map((a) => (
        <button
          key={a}
          onClick={() => onChange(a)}
          style={{ ...chipStyle, flex: 1, ...(value === a ? chipActiveStyle : {}) }}
        >
          {a}
        </button>
      ))}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value?: number;
  onChange: (v: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={value ?? ""}
      min={min}
      max={max}
      step={step}
      placeholder="—"
      onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      style={inputStyle}
    />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
      <span style={{ fontSize: 11, color: "#888" }}>{label}</span>
      {children}
    </label>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 8 }}>{children}</div>;
}

const inputStyle: React.CSSProperties = {
  background: "#1a1a1c",
  color: "#eee",
  border: "1px solid #333",
  borderRadius: 6,
  padding: "6px 8px",
  fontSize: 13,
  width: "100%",
};

const btnStyle: React.CSSProperties = {
  background: "#1a1a1c",
  color: "#eee",
  border: "1px solid #333",
  borderRadius: 6,
  padding: "6px 12px",
  cursor: "pointer",
};

const chipStyle: React.CSSProperties = {
  background: "#1a1a1c",
  color: "#aaa",
  border: "1px solid #333",
  borderRadius: 999,
  padding: "3px 8px",
  fontSize: 11,
  cursor: "pointer",
};

const chipActiveStyle: React.CSSProperties = {
  background: "#4f8cff",
  color: "#fff",
  borderColor: "#4f8cff",
};
