import { useState } from "react";
import { apiFetch } from "../services/api";

export default function Login({ onLoginSuccess }) {
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!nombre.trim() || !password.trim()) {
      setError("Complete usuario y contraseña.");
      return;
    }

    setCargando(true);
    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ nombre, password }),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.access_token);
        onLoginSuccess();
      } else {
        setError("Credenciales incorrectas.");
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="tg-auth-wrapper">
      <div className="seccion-vista login-card" style={{ display: "block" }}>
        <h4 className="login-title" style={{ textAlign: "center", fontWeight: 800, color: "#000", marginBottom: "24px" }}>
          INICIAR SESION
        </h4>
        <form onSubmit={handleSubmit}>
          <div className="tg-form-group">
            <label className="tg-label">Usuario</label>
            <input
              type="text"
              className="tg-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="tg-form-group" style={{ marginBottom: "22px" }}>
            <label className="tg-label">Contrasena</label>
            <input
              type="password"
              className="tg-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-custom tg-w-100 tg-py-lg" disabled={cargando}>
            {cargando ? "INGRESANDO..." : "INGRESAR AL SISTEMA"}
          </button>
        </form>
        {error && <div className="tg-msg-error" style={{ textAlign: "center" }}>{error}</div>}
      </div>
    </div>
  );
}