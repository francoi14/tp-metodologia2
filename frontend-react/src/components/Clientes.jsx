import { useState } from "react";
import { apiFetch } from "../services/api";
import { validarCliente } from "../utils/validaciones";

export default function Clientes({ clientes, onRecargar, onVolver }) {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    telefono: "",
  });
  const [errorForm, setErrorForm] = useState("");
  const [mensajeOk, setMensajeOk] = useState("");
  const [clienteEditando, setClienteEditando] = useState(null);
  const [errorModal, setErrorModal] = useState("");

  const handleCrear = async (e) => {
    e.preventDefault();
    setErrorForm("");
    setMensajeOk("");

    const err = validarCliente(form);
    if (err) {
      setErrorForm(err);
      return;
    }

    try {
      const res = await apiFetch("/clientes/", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ nombre: "", apellido: "", dni: "", email: "", telefono: "" });
        setMensajeOk("Cliente guardado exitosamente.");
        onRecargar();
        setTimeout(() => setMensajeOk(""), 3500);
      } else {
        const data = await res.json();
        setErrorForm(data.detail || "Error al guardar el cliente.");
      }
    } catch {
      setErrorForm("Error de conexión con el servidor.");
    }
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    setErrorModal("");

    const err = validarCliente(clienteEditando);
    if (err) {
      setErrorModal(err);
      return;
    }

    try {
      const res = await apiFetch(`/clientes/${clienteEditando.id_cliente}`, {
        method: "PUT",
        body: JSON.stringify({
          nombre: clienteEditando.nombre,
          apellido: clienteEditando.apellido,
          dni: clienteEditando.dni,
          email: clienteEditando.email || "",
          telefono: clienteEditando.telefono || "",
        }),
      });
      if (res.ok) {
        setClienteEditando(null);
        onRecargar();
      } else {
        setErrorModal("No se pudo actualizar el cliente.");
      }
    } catch {
      setErrorModal("Error de conexión.");
    }
  };

  return (
    <div className="seccion-vista" style={{ display: "block" }}>
      <div className="tg-section-header">
        <h3 className="section-heading" style={{ margin: 0, fontWeight: 800 }}>CLIENTES</h3>
        <button className="btn btn-back" onClick={onVolver}>VOLVER</button>
      </div>

      <div className="tg-two-cols">
        <div>
          <h5 style={{ fontWeight: 800, marginBottom: "16px" }}>Registrar Nuevo Cliente</h5>
          <form onSubmit={handleCrear}>
            <div className="tg-form-group">
              <input
                type="text"
                className="tg-input"
                placeholder="Nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>
            <div className="tg-form-group">
              <input
                type="text"
                className="tg-input"
                placeholder="Apellido"
                value={form.apellido}
                onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                required
              />
            </div>
            <div className="tg-form-group">
              <input
                type="text"
                className="tg-input"
                placeholder="DNI (7 u 8 dígitos)"
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
                required
              />
            </div>
            <div className="tg-form-group">
              <input
                type="email"
                className="tg-input"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="tg-form-group" style={{ marginBottom: "20px" }}>
              <input
                type="text"
                className="tg-input"
                placeholder="Teléfono"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-custom tg-w-100">GUARDAR CLIENTE</button>
          </form>
          {errorForm && <div className="tg-msg-error">{errorForm}</div>}
          {mensajeOk && <div className="tg-msg-ok">{mensajeOk}</div>}
        </div>

        <div>
          <h5 style={{ fontWeight: 800, marginBottom: "16px" }}>Directorio Activo</h5>
          <div className="tg-table-wrap">
            <table className="tg-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre Completo</th>
                  <th>DNI</th>
                  <th>Contacto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id_cliente}>
                    <td style={{ fontWeight: 700 }}>#{c.id_cliente}</td>
                    <td style={{ fontWeight: 700 }}>{c.nombre} {c.apellido}</td>
                    <td>{c.dni}</td>
                    <td>
                      <div style={{ fontSize: "0.85rem" }}>{c.email || "-"}</div>
                      <div style={{ fontSize: "0.85rem" }}>{c.telefono || "-"}</div>
                    </td>
                    <td>
                      <button
                        className="tg-btn-sm tg-btn-edit"
                        onClick={() => setClienteEditando({ ...c })}
                      >
                        Modificar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {clienteEditando && (
        <div className="tg-modal-backdrop">
          <div className="tg-modal-box">
            <div className="tg-modal-header">
              <h5 style={{ margin: 0, fontWeight: 700 }}>Modificar Cliente</h5>
              <button className="tg-modal-close" onClick={() => setClienteEditando(null)}>×</button>
            </div>
            <div className="tg-modal-body">
              <form onSubmit={handleGuardarEdicion}>
                <div className="tg-form-group">
                  <input
                    type="text"
                    className="tg-input"
                    value={clienteEditando.nombre}
                    onChange={(e) => setClienteEditando({ ...clienteEditando, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="tg-form-group">
                  <input
                    type="text"
                    className="tg-input"
                    value={clienteEditando.apellido}
                    onChange={(e) => setClienteEditando({ ...clienteEditando, apellido: e.target.value })}
                    required
                  />
                </div>
                <div className="tg-form-group">
                  <input
                    type="text"
                    className="tg-input"
                    value={clienteEditando.dni}
                    onChange={(e) => setClienteEditando({ ...clienteEditando, dni: e.target.value })}
                    required
                  />
                </div>
                <div className="tg-form-group">
                  <input
                    type="email"
                    className="tg-input"
                    value={clienteEditando.email || ""}
                    onChange={(e) => setClienteEditando({ ...clienteEditando, email: e.target.value })}
                  />
                </div>
                <div className="tg-form-group" style={{ marginBottom: "20px" }}>
                  <input
                    type="text"
                    className="tg-input"
                    value={clienteEditando.telefono || ""}
                    onChange={(e) => setClienteEditando({ ...clienteEditando, telefono: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-custom tg-w-100">GUARDAR CAMBIOS</button>
              </form>
              {errorModal && <div className="tg-msg-error">{errorModal}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}