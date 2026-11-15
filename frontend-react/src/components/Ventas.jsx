import { useState } from "react";
import { apiFetch } from "../services/api";

export default function Ventas({ clientes, productos, onVentaExitosa, onVolver }) {
  const [clienteId, setClienteId] = useState("");
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [carrito, setCarrito] = useState([]);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [procesando, setProcesando] = useState(false);

  const clienteSeleccionado = clientes.find(
    (c) => c.id_cliente === parseInt(clienteId, 10)
  );
  const productosDisponibles = productos.filter((p) => p.stock > 0);

  const handleAgregarCarrito = () => {
    setMensaje({ texto: "", tipo: "" });
    const prod = productos.find((p) => p.id === parseInt(productoId, 10));
    const cantNum = parseInt(cantidad, 10);

    if (!prod) {
      setMensaje({ texto: "Seleccione un producto válido.", tipo: "error" });
      return;
    }
    if (!Number.isInteger(cantNum) || cantNum < 1) {
      setMensaje({ texto: "La cantidad mínima es 1.", tipo: "error" });
      return;
    }

    const yaEnCarrito = carrito
      .filter((item) => item.id_producto === prod.id)
      .reduce((acc, item) => acc + item.cantidad, 0);

    if (yaEnCarrito + cantNum > prod.stock) {
      setMensaje({
        texto: `Stock insuficiente para ${prod.nombre} (disponible: ${prod.stock}).`,
        tipo: "error",
      });
      return;
    }

    setCarrito([
      ...carrito,
      {
        id_producto: prod.id,
        nombre: `${prod.nombre} ${prod.descripcion || ""}`.trim(),
        cantidad: cantNum,
      },
    ]);
    setCantidad(1);
  };

  const handleQuitarItem = (index) => {
    setCarrito(carrito.filter((_, idx) => idx !== index));
  };

  const handleEmitirFactura = async () => {
    const id_cliente = parseInt(clienteId, 10);
    if (!id_cliente) {
      setMensaje({ texto: "Debe seleccionar un cliente comprador.", tipo: "error" });
      return;
    }
    if (carrito.length === 0) return;

    setProcesando(true);
    setMensaje({ texto: "", tipo: "" });

    try {
      for (const item of carrito) {
        const res = await apiFetch("/ventas/comprar", {
          method: "POST",
          body: JSON.stringify({
            id_cliente,
            id_producto: item.id_producto,
            cantidad: item.cantidad,
          }),
        });
        if (!res.ok) throw new Error();
      }

      setCarrito([]);
      setMensaje({
        texto: "Factura emitida y stock actualizado exitosamente.",
        tipo: "ok",
      });
      onVentaExitosa();
      setTimeout(() => setMensaje({ texto: "", tipo: "" }), 4000);
    } catch {
      setMensaje({ texto: "Error procesando la venta.", tipo: "error" });
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="seccion-vista" style={{ display: "block" }}>
      <div className="tg-section-header">
        <h3 className="section-heading" style={{ margin: 0, fontWeight: 800 }}>PROCESAR VENTA</h3>
        <button className="btn btn-back" onClick={onVolver}>VOLVER</button>
      </div>

      <div className="tg-sales-grid">
        <div>
          <div style={{ marginBottom: "32px" }}>
            <h5 style={{ fontWeight: 800, marginBottom: "12px" }}>1. Datos del Comprador</h5>
            <select
              className="tg-select"
              style={{ marginBottom: "12px" }}
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
            >
              <option value="">Seleccione cliente</option>
              {clientes.map((c) => (
                <option key={c.id_cliente} value={c.id_cliente}>
                  {c.nombre} {c.apellido} (DNI: {c.dni})
                </option>
              ))}
            </select>

            <div className="tg-client-box">
              {clienteSeleccionado ? (
                <>
                  <strong>Nombre:</strong> {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}<br />
                  <strong>DNI:</strong> {clienteSeleccionado.dni}<br />
                  <strong>Email:</strong> {clienteSeleccionado.email || "N/A"}<br />
                  <strong>Teléfono:</strong> {clienteSeleccionado.telefono || "N/A"}
                </>
              ) : (
                "Seleccione un cliente para verificar los datos de facturación."
              )}
            </div>
          </div>

          <div>
            <h5 style={{ fontWeight: 800, marginBottom: "12px" }}>2. Agregar Artículos</h5>
            <select
              className="tg-select"
              style={{ marginBottom: "12px" }}
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
            >
              <option value="">Seleccionar producto</option>
              {productosDisponibles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.descripcion || "Sin desc."}) - Stock: {p.stock}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              className="tg-input"
              style={{ marginBottom: "18px" }}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Cantidad"
            />

            <button
              type="button"
              className="btn btn-custom tg-w-100"
              onClick={handleAgregarCarrito}
            >
              AÑADIR AL CARRITO
            </button>
          </div>
        </div>

        <div className="tg-cart-box">
          <h5 style={{ fontWeight: 800, marginBottom: "12px" }}>Detalle del Carrito</h5>
          <ul className="tg-cart-list">
            {carrito.length === 0 ? (
              <li style={{ textAlign: "center", padding: "24px", color: "#6c757d" }}>
                Carrito vacío
              </li>
            ) : (
              carrito.map((item, idx) => (
                <li key={idx} className="tg-cart-item">
                  <span className="carrito-item-nombre" style={{ fontWeight: 700 }}>
                    {item.nombre} (x{item.cantidad})
                  </span>
                  <button
                    className="tg-btn-sm tg-btn-del"
                    onClick={() => handleQuitarItem(idx)}
                  >
                    X
                  </button>
                </li>
              ))
            )}
          </ul>

          <button
            type="button"
            className="btn btn-custom tg-w-100 tg-py-lg"
            disabled={carrito.length === 0 || procesando}
            onClick={handleEmitirFactura}
          >
            {procesando ? "EMITIENDO..." : "EMITIR FACTURA OFICIAL"}
          </button>

          {mensaje.texto && (
            <div
              className={mensaje.tipo === "ok" ? "tg-msg-ok" : "tg-msg-error"}
              style={{ textAlign: "center" }}
            >
              {mensaje.texto}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}