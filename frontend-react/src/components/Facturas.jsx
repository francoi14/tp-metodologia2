import { exportarExcelCSV } from "../services/api";

export default function Facturas({ facturas, onVolver }) {
  const handleExportarFacturas = () => {
    const encabezados = ["Nro Factura", "Cliente", "Total", "Fecha"];
    const filas = facturas.map((f) => [
      f.id,
      f.cliente,
      f.total,
      new Date(f.fecha).toLocaleString(),
    ]);
    exportarExcelCSV("reporte_facturas_tienda_gamer", encabezados, filas);
  };

  const handleVerPDF = (idFactura) => {
    window.open(`/?factura=${idFactura}`, "_blank");
  };

  return (
    <div className="seccion-vista" style={{ display: "block" }}>
      <div className="tg-section-header">
        <h3 className="section-heading" style={{ margin: 0, fontWeight: 800 }}>
          HISTORIAL DE FACTURAS
        </h3>
        <div className="tg-actions-bar">
          {facturas.length > 0 && (
            <button className="tg-btn-csv" onClick={handleExportarFacturas}>
              EXPORTAR EXCEL (CSV)
            </button>
          )}
          <button className="btn btn-back" onClick={onVolver}>VOLVER</button>
        </div>
      </div>

      <div className="tg-table-wrap">
        <table className="tg-table">
          <thead>
            <tr>
              <th>Nro Factura</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Fecha</th>
              <th>Descarga</th>
            </tr>
          </thead>
          <tbody>
            {facturas.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "24px" }}>
                  Aún no hay facturas emitidas.
                </td>
              </tr>
            ) : (
              facturas.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 700 }}>#{f.id}</td>
                  <td style={{ fontWeight: 700 }}>{f.cliente}</td>
                  <td>${Number(f.total).toLocaleString()}</td>
                  <td>{new Date(f.fecha).toLocaleString()}</td>
                  <td>
                    <button
                      className="tg-btn-sm tg-btn-pdf"
                      style={{ fontWeight: 700 }}
                      onClick={() => handleVerPDF(f.id)}
                    >
                      Factura PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}