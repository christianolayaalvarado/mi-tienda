"use client";

import { useState, useRef, useCallback } from "react";

const BLOCK_TYPES = [
  { type: "text", icon: "📝", label: "Texto" },
  { type: "image", icon: "🖼️", label: "Imagen" },
  { type: "button", icon: "🔘", label: "Boton" },
  { type: "divider", icon: "─", label: "Divisor" },
  { type: "spacer", icon: "⬜", label: "Espaciador" },
];

function createBlock(type) {
  const base = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), type };
  switch (type) {
    case "text":
      return { ...base, content: "Escribe tu texto aqui...", align: "left", color: "#374151", fontSize: 15, bold: false };
    case "image":
      return { ...base, src: "", alt: "Imagen", link: "", width: "100" };
    case "button":
      return { ...base, label: "Click aqui", url: "#", bgColor: "#16a34a", textColor: "#ffffff", borderRadius: 8 };
    case "divider":
      return { ...base, color: "#e5e7eb", thickness: 1, style: "solid" };
    case "spacer":
      return { ...base, height: 30 };
    default:
      return base;
  }
}

function renderBlockHTML(block, width) {
  const innerWidth = width - 40;
  switch (block.type) {
    case "text":
      return `<div style="padding:8px 20px;text-align:${block.align};color:${block.color};font-size:${block.fontSize}px;font-weight:${block.bold ? "bold" : "normal"};line-height:1.6">${block.content}</div>`;
    case "image":
      if (!block.src) return `<div style="padding:8px 20px;text-align:center;color:#9ca3af;font-size:13px">[Sin imagen - haz click para subir]</div>`;
      const imgTag = `<img src="${block.src}" alt="${block.alt}" style="max-width:${block.width}%;height:auto;display:block;margin:0 auto;border-radius:4px" />`;
      return block.link ? `<a href="${block.link}" target="_blank" style="display:block;padding:8px 20px;text-align:center">${imgTag}</a>` : `<div style="padding:8px 20px;text-align:center">${imgTag}</div>`;
    case "button":
      return `<div style="padding:12px 20px;text-align:center"><a href="${block.url}" target="_blank" style="display:inline-block;padding:12px 32px;background:${block.bgColor};color:${block.textColor};text-decoration:none;border-radius:${block.borderRadius}px;font-weight:bold;font-size:15px">${block.label}</a></div>`;
    case "divider":
      return `<div style="padding:8px 20px"><hr style="border:none;border-top:${block.thickness}px ${block.style} ${block.color};margin:0" /></div>`;
    case "spacer":
      return `<div style="height:${block.height}px"></div>`;
    default:
      return "";
  }
}

export function generateEmailHTML(blocks, width, storeName, unsubUrl) {
  const blocksHTML = blocks.map((b) => renderBlockHTML(b, width)).join("\n");
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const link = unsubUrl || `${baseUrl}/api/unsubscribe?email=__EMAIL__`;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6"><tr><td align="center" style="padding:20px 0">
<table width="${width}" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
  <tr><td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:24px 20px;text-align:center">
    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold">${storeName || "Mi Tienda"}</h1>
  </td></tr>
  ${blocksHTML}
  <tr><td style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb">
    <p style="margin:0 0 8px;font-size:12px;color:#6b7280">Enviado desde <strong>${storeName || "Mi Tienda"}</strong></p>
    <p style="margin:0;font-size:11px;color:#9ca3af">Si no deseas recibir estos correos, puedes <a href="${link}" style="color:#16a34a">cancelar tu suscripcion</a></p>
  </td></tr>
</table>
</td></tr></table>
</body>
</html>`;
}

function TextBlockEditor({ block, onChange }) {
  return (
    <div className="space-y-2">
      <textarea
        value={block.content}
        onChange={(e) => onChange({ ...block, content: e.target.value })}
        rows={4}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <div className="flex flex-wrap gap-2 items-center">
        <select value={block.align} onChange={(e) => onChange({ ...block, align: e.target.value })} className="px-2 py-1 border border-gray-200 rounded text-xs">
          <option value="left">Izquierda</option>
          <option value="center">Centro</option>
          <option value="right">Derecha</option>
        </select>
        <input type="color" value={block.color} onChange={(e) => onChange({ ...block, color: e.target.value })} className="w-7 h-7 rounded cursor-pointer" />
        <select value={block.fontSize} onChange={(e) => onChange({ ...block, fontSize: Number(e.target.value) })} className="px-2 py-1 border border-gray-200 rounded text-xs">
          {[12, 13, 14, 15, 16, 18, 20, 24].map((s) => (
            <option key={s} value={s}>{s}px</option>
          ))}
        </select>
        <button
          onClick={() => onChange({ ...block, bold: !block.bold })}
          className={`px-2 py-1 rounded text-xs font-bold ${block.bold ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600"}`}
        >
          B
        </button>
      </div>
    </div>
  );
}

function ImageBlockEditor({ block, onChange, onUpload }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/image", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) onChange({ ...block, src: data.url, alt: file.name.replace(/\.[^.]+$/, "") });
    } catch {}
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      {block.src ? (
        <div className="relative">
          <img src={block.src} alt={block.alt} className="w-full max-h-48 object-contain rounded-lg bg-gray-50" />
          <button onClick={() => onChange({ ...block, src: "" })} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">x</button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm hover:border-green-400 hover:text-green-500 transition"
        >
          {uploading ? "Subiendo..." : "+ Subir imagen"}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <div className="flex gap-2 items-center">
        <label className="text-xs text-gray-500">Ancho:</label>
        <input
          type="range" min="20" max="100" value={block.width}
          onChange={(e) => onChange({ ...block, width: e.target.value })}
          className="flex-1"
        />
        <span className="text-xs text-gray-500 w-8">{block.width}%</span>
      </div>
      <input
        type="text" value={block.link} placeholder="Link (opcional)"
        onChange={(e) => onChange({ ...block, link: e.target.value })}
        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
      />
    </div>
  );
}

function ButtonBlockEditor({ block, onChange }) {
  return (
    <div className="space-y-2">
      <input type="text" value={block.label} onChange={(e) => onChange({ ...block, label: e.target.value })} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="Texto del boton" />
      <input type="url" value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value })} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="https://..." />
      <div className="flex gap-2 items-center">
        <label className="text-xs text-gray-500">Fondo:</label>
        <input type="color" value={block.bgColor} onChange={(e) => onChange({ ...block, bgColor: e.target.value })} className="w-7 h-7 rounded cursor-pointer" />
        <label className="text-xs text-gray-500 ml-2">Texto:</label>
        <input type="color" value={block.textColor} onChange={(e) => onChange({ ...block, textColor: e.target.value })} className="w-7 h-7 rounded cursor-pointer" />
        <label className="text-xs text-gray-500 ml-2">Radio:</label>
        <input type="number" min="0" max="50" value={block.borderRadius} onChange={(e) => onChange({ ...block, borderRadius: Number(e.target.value) })} className="w-14 px-2 py-1 border border-gray-200 rounded text-xs" />
      </div>
    </div>
  );
}

function DividerBlockEditor({ block, onChange }) {
  return (
    <div className="flex gap-2 items-center">
      <input type="color" value={block.color} onChange={(e) => onChange({ ...block, color: e.target.value })} className="w-7 h-7 rounded cursor-pointer" />
      <input type="number" min="1" max="5" value={block.thickness} onChange={(e) => onChange({ ...block, thickness: Number(e.target.value) })} className="w-14 px-2 py-1 border border-gray-200 rounded text-xs" />
      <select value={block.style} onChange={(e) => onChange({ ...block, style: e.target.value })} className="px-2 py-1 border border-gray-200 rounded text-xs">
        <option value="solid">Solido</option>
        <option value="dashed">Guiones</option>
        <option value="dotted">Puntos</option>
      </select>
    </div>
  );
}

function SpacerBlockEditor({ block, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input type="range" min="10" max="100" value={block.height} onChange={(e) => onChange({ ...block, height: Number(e.target.value) })} className="flex-1" />
      <span className="text-xs text-gray-500 w-10">{block.height}px</span>
    </div>
  );
}

const BLOCK_EDITORS = {
  text: TextBlockEditor,
  image: ImageBlockEditor,
  button: ButtonBlockEditor,
  divider: DividerBlockEditor,
  spacer: SpacerBlockEditor,
};

export default function EmailBlockEditor({ blocks, onChange, width = 600, onWidthChange, storeName = "Mi Tienda" }) {
  const [selectedId, setSelectedId] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);

  const addBlock = (type) => {
    onChange([...blocks, createBlock(type)]);
  };

  const updateBlock = (index, newBlock) => {
    const updated = [...blocks];
    updated[index] = newBlock;
    onChange(updated);
  };

  const removeBlock = (index) => {
    onChange(blocks.filter((_, i) => i !== index));
    if (selectedId === blocks[index]?.id) setSelectedId(null);
  };

  const moveBlock = (from, to) => {
    if (to < 0 || to >= blocks.length) return;
    const updated = [...blocks];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onChange(updated);
  };

  const handleDragStart = (index) => setDragIndex(index);
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    moveBlock(dragIndex, index);
    setDragIndex(index);
  };
  const handleDragEnd = () => setDragIndex(null);

  const html = generateEmailHTML(blocks, width, storeName);
  const selectedBlock = blocks.find((b) => b.id === selectedId);
  const selectedIndex = blocks.findIndex((b) => b.id === selectedId);
  const Editor = selectedBlock ? BLOCK_EDITORS[selectedBlock.type] : null;

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Left: Block palette + editor */}
      <div className="w-full lg:w-80 shrink-0 space-y-4">
        {/* Width selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <label className="text-xs font-semibold text-gray-600 mb-2 block">Ancho del correo</label>
          <div className="flex gap-2">
            {[600, 700, 800].map((w) => (
              <button
                key={w}
                onClick={() => onWidthChange?.(w)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${width === w ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {w}px
              </button>
            ))}
          </div>
        </div>

        {/* Block palette */}
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <label className="text-xs font-semibold text-gray-600 mb-2 block">Agregar bloque</label>
          <div className="grid grid-cols-3 gap-2">
            {BLOCK_TYPES.map((bt) => (
              <button
                key={bt.type}
                onClick={() => addBlock(bt.type)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-gray-50 hover:bg-green-50 hover:text-green-600 text-gray-600 transition text-xs"
              >
                <span className="text-lg">{bt.icon}</span>
                <span>{bt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected block editor */}
        {selectedBlock && Editor && (
          <div className="bg-white rounded-xl border border-green-200 p-3">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-green-700">Editando: {BLOCK_TYPES.find((bt) => bt.type === selectedBlock.type)?.label}</label>
              <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600 text-xs">x</button>
            </div>
            <Editor block={selectedBlock} onChange={(b) => updateBlock(selectedIndex, b)} />
          </div>
        )}

        {/* Block list */}
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <label className="text-xs font-semibold text-gray-600 mb-2 block">Bloques ({blocks.length})</label>
          <div className="space-y-1">
            {blocks.map((b, i) => (
              <div
                key={b.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                onClick={() => setSelectedId(b.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs transition ${
                  selectedId === b.id ? "bg-green-50 border border-green-200" : "bg-gray-50 hover:bg-gray-100 border border-transparent"
                }`}
              >
                <span className="text-gray-400 cursor-grab">⠿</span>
                <span>{BLOCK_TYPES.find((bt) => bt.type === b.type)?.icon}</span>
                <span className="flex-1 truncate text-gray-700">
                  {b.type === "text" ? b.content.slice(0, 30) : b.type === "image" ? (b.src ? b.alt : "Sin imagen") : b.type === "button" ? b.label : BLOCK_TYPES.find((bt) => bt.type === b.type)?.label}
                </span>
                <button onClick={(e) => { e.stopPropagation(); moveBlock(i, i - 1); }} className="text-gray-400 hover:text-gray-600" disabled={i === 0}>↑</button>
                <button onClick={(e) => { e.stopPropagation(); moveBlock(i, i + 1); }} className="text-gray-400 hover:text-gray-600" disabled={i === blocks.length - 1}>↓</button>
                <button onClick={(e) => { e.stopPropagation(); removeBlock(i); }} className="text-red-400 hover:text-red-600">x</button>
              </div>
            ))}
          </div>
          {blocks.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-3">Agrega bloques para disenar tu correo</p>
          )}
        </div>
      </div>

      {/* Right: Preview */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600">Preview ({width}px)</span>
            <span className="text-xs text-gray-400">{blocks.length} bloques</span>
          </div>
          <div className="p-4 bg-gray-100 overflow-auto" style={{ maxHeight: "80vh" }}>
            <div
              style={{ width: width, margin: "0 auto" }}
              dangerouslySetInnerHTML={{ __html: html }}
              className="shadow-lg rounded-lg overflow-hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
