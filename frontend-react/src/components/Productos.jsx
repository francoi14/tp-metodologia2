import { useState } from "react";
import { apiFetch } from "../services/api";
import { validarProducto } from "../utils/validaciones";

export default function Productos({ productos, onRecargar, onVolver }) {
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    stock: "",
  });
  const [errorForm, setErrorForm] = useState("");
  const [mensajeOk, setMensajeOk] = useState("");
  const [prodEditando, setProdEditando] = useState(null);
  const [errorModal, setErrorModal] = useState("");

  const handleCrear = async (e) => {
    e.preventDefault();
    setErrorForm("");
    setMensajeOk("");

    const err = validarProducto(form);
    if (err) {
      setErrorForm(err);
      return;
    }

    try {
      const res = await apiFetch("/productos/", {
        method: "POST",
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          precio: parseFloat(form.precio),
          stock: parseInt(form.stock, 10),
        }),
      });
      if (res.ok) {
        setForm({ nombre: "", descripcion: "", precio: "", stock: "" });
        setMensajeOk("Producto registrado.");
        onRecargar();
        setTimeout(() => setMensajeOk(""), 3000);
      } else {
        setErrorForm("No se pudo crear el producto.");
      }
    } catch {
      setErrorForm("Error de conexión.");
    }
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    setErrorModal("");

    const err = validarProducto(prodEditando);
    if (err) {
      setErrorModal(err);
      return;
    }

    try {
      const res = await apiFetch(`/productos/${prodEditando.id}`, {
        method: "PUT",
        body: JSON.stringify({
          nombre: prodEditando.nombre.trim(),
          descripcion: prodEditando.descripcion || "",
          precio: parseFloat(prodEditando.precio),
          stock: parseInt(prodEditando.stock, 10),
        }),
      });
      if (res.ok) {
        setProdEditando(null);
        onRecargar();
      } else {
        setErrorModal("Error al modificar el producto.");
      }
    } catch {
      setErrorModal("Error de conexión.");
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este producto permanentemente?")) return;
    try {
      const res = await apiFetch(`/productos/${id}`, { method: "DELETE" });
      if (res.ok) onRecargar();
    } catch {
      alert("Error al eliminar el producto.");
    }
  };

  return (
    <div className="seccion-vista" style={{ display: "block" }}>
      <div className="tg-section-header">
        <h3 className="section-heading" style={{ margin: 0, fontWeight: 800 }}>INVENTARIO</h3>
        <button className="btn btn-back" onClick={onVolver}>VOLVER</button>
      </div>

      <div className="tg-two-cols">
        <div>
          <h5 style={{ fontWeight: 800, marginBottom: "16px" }}>Alta de Producto</h5>
          <form onSubmit={handleCrear}>
            <div className="tg-form-group">
              <input
                type="text"
                className="tg-input"
                placeholder="Nombre del Producto"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>
            <div className="tg-form-group">
              <input
                type="text"
                className="tg-input"
                placeholder="Descripción detallada"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>
            <div className="tg-form-group">
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="tg-input"
                placeholder="Precio Final"
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
                required
              />
            </div>
            <div className="tg-form-group" style={{ marginBottom: "20px" }}>
              <input
                type="number"
                min="0"
                className="tg-input"
                placeholder="Stock Inicial"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-custom tg-w-100">CREAR PRODUCTO</button>
          </form>
          {errorForm && <div className="tg-msg-error">{errorForm}</div>}
          {mensajeOk && <div className="tg-msg-ok">{mensajeOk}</div>}
        </div>

        <div>
          <h5 style={{ fontWeight: 800, marginBottom: "16px" }}>Control de Stock</h5>
          <div className="tg-table-wrap">
            <table className="tg-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700 }}>#{p.id}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{p.nombre}</div>
                      <div className="prod-desc-texto" style={{ fontSize: "0.85rem", color: "#6c757d" }}>
                        {p.descripcion || "-"}
                      </div>
                    </td>
                    <td>${Number(p.precio).toLocaleString()}</td>
                    <td>{p.stock} un.</td>
                    <td>
                      <button
                        className="tg-btn-sm tg-btn-edit"
                        onClick={() => setProdEditando({ ...p })}
                      >
                        Modificar
                      </button>
                      <button
                        className="tg-btn-sm tg-btn-del"
                        onClick={() => handleEliminar(p.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {prodEditando && (
        <div className="tg-modal-backdrop">
          <div className="tg-modal-box">
            <div className="tg-modal-header">
              <h5 style={{ margin: 0, fontWeight: 700 }}>Modificar Producto</h5>
              <button className="tg-modal-close" onClick={() => setProdEditando(null)}>×</button>
            </div>
            <div className="tg-modal-body">
              <form onSubmit={handleGuardarEdicion}>
                <div className="tg-form-group">
                  <input
                    type="text"
                    className="tg-input"
                    value={prodEditando.nombre}
                    onChange={(e) => setProdEditando({ ...prodEditando, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="tg-form-group">
                  <input
                    type="text"
                    className="tg-input"
                    value={prodEditando.descripcion || ""}
                    onChange={(e) => setProdEditando({ ...prodEditando, descripcion: e.target.value })}
                  />
                </div>
                <div className="tg-form-group">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="tg-input"
                    value={prodEditando.precio}
                    onChange={(e) => setProdEditando({ ...prodEditando, precio: e.target.value })}
                    required
                  />
                </div>
                <div className="tg-form-group" style={{ marginBottom: "20px" }}>
                  <input
                    type="number"
                    min="0"
                    className="tg-input"
                    value={prodEditando.stock}
                    onChange={(e) => setProdEditando({ ...prodEditando, stock: e.target.value })}
                    required
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