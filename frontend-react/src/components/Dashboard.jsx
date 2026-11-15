export default function Dashboard({ onSeleccionarSeccion }) {
  const secciones = [
    { id: "clientes", titulo: "Clientes" },
    { id: "productos", titulo: "Productos" },
    { id: "ventas", titulo: "Ventas" },
    { id: "facturas", titulo: "Facturas" },
  ];

  return (
    <div id="dashboard-wrapper" style={{ display: "flex" }}>
      <div className="tg-container">
        <div className="tg-dashboard-grid">
          {secciones.map((sec) => (
            <div
              key={sec.id}
              className="card-panel"
              onClick={() => onSeleccionarSeccion(sec.id)}
            >
              <h3>{sec.titulo}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}