export function validarCliente({ nombre, apellido, dni, email, telefono }) {
  if (!nombre || nombre.trim().length < 2) {
    return "El nombre debe tener al menos 2 caracteres.";
  }
  if (!apellido || apellido.trim().length < 2) {
    return "El apellido debe tener al menos 2 caracteres.";
  }
  if (!/^\d{7,8}$/.test(String(dni).trim())) {
    return "El DNI debe contener entre 7 y 8 dígitos numéricos.";
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "El formato del correo electrónico no es válido.";
  }
  if (telefono && !/^[\d\s\-+()]{6,20}$/.test(telefono.trim())) {
    return "El teléfono solo puede contener números y guiones (mínimo 6 dígitos).";
  }
  return null;
}

export function validarProducto({ nombre, precio, stock }) {
  if (!nombre || nombre.trim().length < 2) {
    return "El nombre del producto debe tener al menos 2 caracteres.";
  }
  if (isNaN(precio) || Number(precio) <= 0) {
    return "El precio debe ser un número mayor a 0.";
  }
  if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
    return "El stock debe ser un número entero mayor o igual a 0.";
  }
  return null;
}