import { useEffect, useState } from "react";
import api from "../lib/api";

type Dataset = { id: string; name: string; tableName: string };

type Relation = { id: string; fromDatasetId: string; toDatasetId: string; fromColumn: string; toColumn: string };

export default function ERPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/datasets/er");
      setDatasets(data.datasets);
      setRelations(data.relations);
    })();
  }, []);

  return (
    <div className="card">
      <h3>Mapa de Relacionamentos (ER)</h3>
      <div className="grid grid-3">
        {datasets.map((d) => (
          <div key={d.id} className="card">
            <strong>{d.name}</strong>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{d.tableName}</div>
          </div>
        ))}
      </div>
      <h4>Relações</h4>
      <ul>
        {relations.map((r) => (
          <li key={r.id}>
            {r.fromDatasetId}.{r.fromColumn} → {r.toDatasetId}.{r.toColumn}
          </li>
        ))}
      </ul>
    </div>
  );
}
