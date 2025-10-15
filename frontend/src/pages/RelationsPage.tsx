import { useEffect, useState } from "react";
import api from "../lib/api";

type Dataset = { id: string; name: string; tableName: string };

export default function RelationsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [fromDatasetId, setFromDatasetId] = useState("");
  const [toDatasetId, setToDatasetId] = useState("");
  const [fromColumn, setFromColumn] = useState("");
  const [toColumn, setToColumn] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/datasets");
      setDatasets(data);
    })();
  }, []);

  async function createRelation() {
    await api.post("/datasets/relations", { fromDatasetId, toDatasetId, fromColumn, toColumn });
    setMessage("Relação criada");
  }

  return (
    <div className="card grid">
      <h3>Criar Relacionamento</h3>
      <select value={fromDatasetId} onChange={(e) => setFromDatasetId(e.target.value)}>
        <option value="">De (dataset)</option>
        {datasets.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      <input placeholder="Coluna de origem (ex: ID_Pessoa)" value={fromColumn} onChange={(e) => setFromColumn(e.target.value)} />
      <select value={toDatasetId} onChange={(e) => setToDatasetId(e.target.value)}>
        <option value="">Para (dataset)</option>
        {datasets.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      <input placeholder="Coluna de destino (ex: ID_Pessoa)" value={toColumn} onChange={(e) => setToColumn(e.target.value)} />
      <button onClick={createRelation} disabled={!fromDatasetId || !toDatasetId || !fromColumn || !toColumn}>Criar</button>
      {message && <div>{message}</div>}
    </div>
  );
}
