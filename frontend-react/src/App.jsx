import { useEffect, useState } from "react";
import { apiFetch } from "./services/api";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Clientes from "./components/Clientes";
import Productos from "./components/Productos";
import Ventas from "./components/Ventas";
import Facturas from "./components/Facturas";
import FacturaPrint from "./components/FacturaPrint";

export default function App() {
  const [autenticado, setAutenticado] = useState(Boolean(localStorage.getItem("token")));
  const [seccionActiva, setSeccionActiva] = useState("dashboard");
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [facturas, setFacturas] = useState([]);

  const params = new URLSearchParams(window.location.search);
  const facturaPrintId = params.get("factura");

  const cargarClientes = async () => {
    const res = await apiFetch("/clientes/");
    if (res.ok) setClientes(await res.json());
  };

  const cargarProductos = async () => {
    const res = await apiFetch("/productos/");
    if (res.ok) setProductos(await res.json());
  };

  const cargarFacturas = async () => {
    const res = await apiFetch("/ventas/facturas");
    if (res.ok) setFacturas(await res.json());
  };

  const cargarTodo = () => {
    cargarClientes();
    cargarProductos();
    cargarFacturas();
  };

  useEffect(() => {
    if (autenticado && !facturaPrintId) {
      cargarTodo();
    }
  }, [autenticado]);

  if (facturaPrintId) {
    return <FacturaPrint facturaId={facturaPrintId} />;
  }

  if (!autenticado) {
    return <Login onLoginSuccess={() => setAutenticado(true)} />;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAutenticado(false);
    setSeccionActiva("dashboard");
  };

  return (
    <div id="app-container" style={{ display: "block" }}>
      <header className="top-header">
        <h1 className="header-title">Tienda Gamer Lr</h1>
        <button className="btn-logout" onClick={handleLogout}>
          CERRAR SESION
        </button>
      </header>

      {seccionActiva === "dashboard" && (
        <Dashboard onSeleccionarSeccion={setSeccionActiva} />
      )}

      {seccionActiva === "clientes" && (
        <Clientes
          clientes={clientes}
          onRecargar={cargarClientes}
          onVolver={() => setSeccionActiva("dashboard")}
        />
      )}

      {seccionActiva === "productos" && (
        <Productos
          productos={productos}
          onRecargar={cargarProductos}
          onVolver={() => setSeccionActiva("dashboard")}
        />
      )}

      {seccionActiva === "ventas" && (
        <Ventas
          clientes={clientes}
          productos={productos}
          onVentaExitosa={() => {
            cargarProductos();
            cargarFacturas();
          }}
          onVolver={() => setSeccionActiva("dashboard")}
        />
      )}

      {seccionActiva === "facturas" && (
        <Facturas
          facturas={facturas}
          onVolver={() => setSeccionActiva("dashboard")}
        />
      )}
    </div>
  );
}