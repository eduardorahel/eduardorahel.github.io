import { useEffect, useState } from "react";
import api from "../lib/api";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [primaryKey, setPrimaryKey] = useState("");
  const [columns, setColumns] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setMessage(null);
  }, [file]);

  async function handlePreview() {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post("/datasets/preview", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setPreview(data);
    setName(file.name.replace(/\.(csv|xlsx|xls)$/i, ""));
    setColumns((data.columns || []).map((c: string) => ({ name: c, dataType: "STRING", isNullable: true, isUnique: false, isSensitive: false, maskPattern: null })));
  }

  async function handleImport() {
    if (!preview) return;
    const payload = {
      name,
      primaryKey,
      columns,
      filePath: preview.filePath,
      originalFileName: preview.originalFileName,
    };
    await api.post("/datasets/import", payload);
    setMessage("Importado com sucesso");
  }

  return (
    <div className="grid">
      <div className="card">
        <h3>Upload de Arquivo</h3>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button onClick={handlePreview} disabled={!file}>Pré-visualizar</button>
      </div>
      {preview && (
        <div className="card">
          <h3>Pré-visualização</h3>
          <div className="grid">
            <input placeholder="Nome da Tabela" value={name} onChange={(e) => setName(e.target.value)} />
            <select value={primaryKey} onChange={(e) => setPrimaryKey(e.target.value)}>
              <option value="">Selecione a Primary Key</option>
              {preview.columns.map((c: string) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Coluna</th>
                <th>Tipo</th>
                <th>Nullable</th>
                <th>Única</th>
                <th>Sensível</th>
                <th>Máscara</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col, idx) => (
                <tr key={col.name}>
                  <td>{col.name}</td>
                  <td>
                    <select value={col.dataType} onChange={(e) => {
                      const v = e.target.value; const nc = [...columns]; nc[idx] = { ...col, dataType: v }; setColumns(nc);
                    }}>
                      {"STRING NUMBER BOOLEAN DATE DATETIME JSON".split(" ").map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  <td><input type="checkbox" checked={col.isNullable} onChange={(e) => { const nc = [...columns]; nc[idx] = { ...col, isNullable: e.target.checked }; setColumns(nc); }} /></td>
                  <td><input type="checkbox" checked={col.isUnique} onChange={(e) => { const nc = [...columns]; nc[idx] = { ...col, isUnique: e.target.checked }; setColumns(nc); }} /></td>
                  <td><input type="checkbox" checked={col.isSensitive} onChange={(e) => { const nc = [...columns]; nc[idx] = { ...col, isSensitive: e.target.checked }; setColumns(nc); }} /></td>
                  <td><input placeholder="Padrão (ex: XXX.XXX.XXX-XX)" value={col.maskPattern || ""} onChange={(e) => { const nc = [...columns]; nc[idx] = { ...col, maskPattern: e.target.value || null }; setColumns(nc); }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleImport} disabled={!primaryKey}>Importar</button>
          {message && <div>{message}</div>}
        </div>
      )}
    </div>
  );
}
