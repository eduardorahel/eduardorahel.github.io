import { FormEvent, useState } from "react";
import api from "../lib/api";

export default function AIChatPage() {
  const [question, setQuestion] = useState("");
  const [sql, setSql] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { data } = await api.post("/ai/query", { question });
      setSql(data.sql);
      setRows(data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Falha na consulta de IA");
    }
  }

  const columns = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <div className="grid">
      <div className="card">
        <h3>Consulta com IA</h3>
        <form onSubmit={onSubmit} className="grid">
          <input placeholder="Pergunte algo sobre seus dados" value={question} onChange={(e) => setQuestion(e.target.value)} />
          <button type="submit">Consultar</button>
          {error && <div style={{ color: "tomato" }}>{error}</div>}
        </form>
      </div>
      {sql && (
        <div className="card">
          <h4>SQL gerado</h4>
          <pre style={{ whiteSpace: "pre-wrap" }}>{sql}</pre>
        </div>
      )}
      {rows.length > 0 && (
        <div className="card">
          <h4>Resultados</h4>
          <table className="table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c}>{String(r[c])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
