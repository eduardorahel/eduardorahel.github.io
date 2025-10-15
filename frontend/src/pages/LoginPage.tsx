import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { setAuth } from "../lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setAuth(data.token, data.role);
      navigate("/upload");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login falhou");
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: "40px auto" }}>
      <h2>Entrar</h2>
      <form onSubmit={onSubmit} className="grid">
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Entrar</button>
        {error && <div style={{ color: "tomato" }}>{error}</div>}
      </form>
    </div>
  );
}
