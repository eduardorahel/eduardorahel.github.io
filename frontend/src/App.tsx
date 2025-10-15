import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UploadPage from "./pages/UploadPage";
import DatasetsPage from "./pages/DatasetsPage";
import DatasetDataPage from "./pages/DatasetDataPage";
import RelationsPage from "./pages/RelationsPage";
import ERPage from "./pages/ERPage";
import PeoplePage from "./pages/PeoplePage";
import AIChatPage from "./pages/AIChatPage";
import { getToken, getUserRole, logout } from "./lib/auth";

function App() {
  const navigate = useNavigate();
  const token = getToken();
  const role = getUserRole();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div>
      <header>
        <div>
          <strong>HUB de Integração</strong>
        </div>
        <nav>
          {token ? (
            <>
              <NavLink to="/upload">Importar</NavLink>
              <NavLink to="/datasets">Tabelas</NavLink>
              <NavLink to="/relations">Relacionamentos</NavLink>
              <NavLink to="/er">ER</NavLink>
              <NavLink to="/people">Pessoas</NavLink>
              <NavLink to="/ai">IA</NavLink>
              <span className="badge">{role}</span>
              <button onClick={handleLogout}>Sair</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Entrar</NavLink>
              <NavLink to="/register">Cadastrar</NavLink>
            </>
          )}
        </nav>
      </header>
      <div className="container">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/datasets" element={<DatasetsPage />} />
          <Route path="/datasets/:id" element={<DatasetDataPage />} />
          <Route path="/relations" element={<RelationsPage />} />
          <Route path="/er" element={<ERPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/ai" element={<AIChatPage />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
