import { FormEvent, useEffect, useState } from "react";
import api from "../lib/api";

export default function PeoplePage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({ type: "NATURAL", name: "", document: "", email: "", phone: "", address: "" });

  async function load() {
    const { data } = await api.get("/people", { params: { page, pageSize: 25 } });
    setItems(data.data);
    setTotal(data.total);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await api.post("/people", form);
    setForm({ type: "NATURAL", name: "", document: "", email: "", phone: "", address: "" });
    load();
  }

  async function onDelete(id: string) {
    await api.delete(`/people/${id}`);
    load();
  }

  const pages = Math.ceil(total / 25);

  return (
    <div className="grid">
      <div className="card">
        <h3>Pessoas</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Documento</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Endereço</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.document}</td>
                <td>{p.email}</td>
                <td>{p.phone}</td>
                <td>{p.address}</td>
                <td>
                  <button onClick={() => onDelete(p.id)}>Excluir (anonimizar)</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</button>
          <span>Página {page} de {pages || 1}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Próxima</button>
        </div>
      </div>
      <div className="card">
        <h3>Novo cadastro</h3>
        <form className="grid" onSubmit={onSubmit}>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="NATURAL">Pessoa Física</option>
            <option value="LEGAL">Pessoa Jurídica</option>
          </select>
          <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="CPF/CNPJ" value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Endereço" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <button type="submit">Salvar</button>
        </form>
      </div>
    </div>
  );
}
