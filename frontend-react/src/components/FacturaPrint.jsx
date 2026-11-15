import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

export default function FacturaPrint({ facturaId }) {
  const [factura, setFactura] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.classList.add("factura-body");
    apiFetch(`/ventas/facturas/${facturaId}/detalle`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setFactura(data))
      .catch(() => setError("No se pudo cargar el comprobante."));

    return () => document.body.classList.remove("factura-body");
  }, [facturaId]);

  if (error) return <p style={{ padding: "24px", fontWeight: 700 }}>{error}</p>;
  if (!factura) return <p style={{ padding: "24px" }}>Cargando comprobante...</p>;

  const nroFormateado = String(factura.id_factura).padStart(6, "0");

  return (
    <>
      <div className="header">
        <div>
          <h2 className="store-title">TIENDA GAMER LR</h2>
          <p className="store-subtitle">Hardware, Periféricos y Equipamiento Gaming</p>
          <p className="store-subtitle">La Rioja, Argentina | CUIT: 30-71849210-9</p>
          <p className="store-subtitle">IVA Responsable Inscripto</p>
        </div>
        <div className="invoice-details">
          <h3 className="invoice-title">FACTURA OFICIAL</h3>
          <p className="invoice-number">Nro: 0001-{nroFormateado}</p>
          <p className="invoice-date">Fecha: {new Date(factura.fecha).toLocaleString()}</p>
          <p className="invoice-date">Condición de venta: Contado</p>
        </div>
      </div>

      <div className="box">
        <div className="section-title">Datos del Comprador</div>
        <p><strong>Cliente:</strong> {factura.cliente.nombre}</p>
        <p><strong>DNI / CUIL:</strong> {factura.cliente.dni} | <strong>Condición IVA:</strong> Consumidor Final</p>
        <p>
          <strong>Email:</strong> {factura.cliente.email} |{" "}
          <strong>Teléfono:</strong> {factura.cliente.telefono}
        </p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Cód.</th>
            <th>Producto y Descripción</th>
            <th className="text-right">Cant.</th>
            <th className="text-right">Precio Unit.</th>
            <th className="text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {factura.items && factura.items.length > 0 ? (
            factura.items.map((item, idx) => (
              <tr key={idx}>
                <td>#{item.id_producto}</td>
                <td>
                  <div style={{ fontWeight: 700 }}>{item.producto}</div>
                  {item.descripcion && (
                    <div style={{ fontSize: "0.85rem", color: "#555555", marginTop: "2px" }}>
                      {item.descripcion}
                    </div>
                  )}
                </td>
                <td className="text-right">{item.cantidad}</td>
                <td className="text-right">${Number(item.precio_unitario).toLocaleString()}</td>
                <td className="text-right-bold">${Number(item.subtotal).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">Venta de Artículos / Periféricos Gaming</td>
              <td className="text-right-bold">${Number(factura.total).toLocaleString()}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ marginTop: "20px", textAlign: "right", lineHeight: "1.8" }}>
        <div style={{ fontSize: "0.95rem", color: "#444444" }}>
          Subtotal: <strong>${Number(factura.total).toLocaleString()}</strong>
        </div>
        <div style={{ fontSize: "0.95rem", color: "#444444" }}>
          Descuentos: <strong>$0</strong>
        </div>
        <div className="total-row" style={{ marginTop: "8px", paddingTop: "10px", borderTop: "2px solid #038554" }}>
          TOTAL GENERAL: ${Number(factura.total).toLocaleString()}
        </div>
      </div>

      <div style={{ marginTop: "32px", paddingTop: "14px", borderTop: "1px solid #e0e0e0", fontSize: "0.8rem", color: "#666666", textAlign: "center" }}>
        Gracias por su compra en Tienda Gamer LR. Conserve este comprobante para gestión de garantía.
      </div>

      <button className="print-btn" onClick={() => window.print()}>
        Imprimir / Guardar como PDF
      </button>
    </>
  );
}