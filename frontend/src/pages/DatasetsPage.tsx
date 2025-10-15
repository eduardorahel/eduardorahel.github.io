import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";

type Dataset = { id: string; name: string; tableName: string; createdAt: string };

export default function DatasetsPage() {
  const [items, setItems] = useState<Dataset[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/datasets");
      setItems(data);
    })();
  }, []);

  return (
    <div className="card">
      <h3>Tabelas</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Tabela</th>
            <th>Criado</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d.id}>
              <td>{d.name}</td>
              <td>{d.tableName}</td>
              <td>{new Date(d.createdAt).toLocaleString()}</td>
              <td>
                <Link to={`/datasets/${d.id}`}>Ver dados</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
