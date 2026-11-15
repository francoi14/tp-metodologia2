const API_URL = "http://127.0.0.1:8000";

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && endpoint !== "/auth/login") {
    localStorage.removeItem("token");
    window.location.reload();
    throw new Error("Sesión expirada");
  }

  return response;
}

export function exportarExcelCSV(nombreArchivo, encabezados, filas) {
  const escapar = (valor) => `"${String(valor ?? "").replace(/"/g, '""')}"`;
  const contenido = [
    encabezados.map(escapar).join(";"),
    ...filas.map((fila) => fila.map(escapar).join(";")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + contenido], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `${nombreArchivo}.csv`;
  enlace.click();
  URL.revokeObjectURL(url);
}