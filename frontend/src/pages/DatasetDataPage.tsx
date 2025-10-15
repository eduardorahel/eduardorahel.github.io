import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/api";

type Row = Record<string, any>;

export default function DatasetDataPage() {
  const { id } = useParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  async function load() {
    const { data } = await api.get(`/datasets/${id}/data`, { params: { page, pageSize: 25 } });
    setRows(data.data);
    setTotal(data.total);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page]);

  const columns = rows[0] ? Object.keys(rows[0]) : [];
  const pages = Math.ceil(total / 25);

  return (
    <div className="card">
      <h3>Dados</h3>
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              {columns.map((c) => (
                <td key={c}>{String(r[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Anterior
        </button>
        <span>
          Página {page} de {pages || 1}
        </span>
        <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
          Próxima
        </button>
      </div>
    </div>
  );
}
