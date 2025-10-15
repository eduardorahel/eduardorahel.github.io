import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { setAuth } from "../lib/auth";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ANALYST");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { data } = await api.post("/auth/register", { name, email, password, role });
      setAuth(data.token, data.role);
      navigate("/upload");
    } catch (err: any) {
      setError(err.response?.data?.error || "Cadastro falhou");
    }
  }

  return (
    <div className="card" style={{ maxWidth: 480, margin: "40px auto" }}>
      <h2>Cadastrar</h2>
      <form onSubmit={onSubmit} className="grid">
        <input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="ANALYST">Analista</option>
          <option value="MANAGER">Gestor</option>
          <option value="ADMIN">Administrador</option>
        </select>
        <button type="submit">Criar conta</button>
        {error && <div style={{ color: "tomato" }}>{error}</div>}
      </form>
    </div>
  );
}
