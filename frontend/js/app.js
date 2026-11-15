// estado global del carrito y clientes
let carrito = [];
let clientesGlobal = [];

// arranca todo cuando carga la pagina
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (token) iniciarApp();

    // login
    document.getElementById("form-login").addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;

        try {
            const response = await fetch("http://127.0.0.1:8000/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre: username, password: password })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem("token", data.access_token);
                iniciarApp();
            } else {
                const err = document.getElementById("error-login");
                err.innerText = "Credenciales incorrectas.";
                err.className = "text-danger fw-bold";
            }
        } catch (err) { console.error("Error login", err); }
    });

    // cerrar sesion
    document.getElementById("btn-logout").addEventListener("click", () => {
        localStorage.removeItem("token");
        document.getElementById("app-container").style.display = "none";
        document.getElementById("auth-container").style.display = "block";
        volverAlDashboard();
    });

    // alta de cliente
    document.getElementById("form-nuevo-cliente").addEventListener("submit", async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        const cliente = {
            nombre: document.getElementById("cli-nombre").value,
            apellido: document.getElementById("cli-apellido").value,
            dni: document.getElementById("cli-dni").value,
            email: document.getElementById("cli-email").value,
            telefono: document.getElementById("cli-telefono").value
        };

        try {
            const res = await fetch("http://127.0.0.1:8000/clientes/", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(cliente)
            });
            if (res.ok) {
                alert("¡Cliente guardado exitosamente!");
                document.getElementById("form-nuevo-cliente").reset();
                cargarClientes();
            }
        } catch (err) { console.error(err); }
    });

    // alta de producto
    document.getElementById("form-nuevo-producto").addEventListener("submit", async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        const prod = {
            nombre: document.getElementById("prod-nombre").value,
            descripcion: document.getElementById("prod-desc").value,
            precio: parseFloat(document.getElementById("prod-precio").value),
            stock: parseInt(document.getElementById("prod-stock").value)
        };

        try {
            const res = await fetch("http://127.0.0.1:8000/productos/", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(prod)
            });
            if (res.ok) {
                const resDiv = document.getElementById("res-prod");
                resDiv.innerText = "Producto registrado.";
                document.getElementById("form-nuevo-producto").reset();
                cargarProductos();
                setTimeout(() => resDiv.innerText = "", 3000);
            }
        } catch (err) { console.error(err); }
    });

    // muestra datos del cliente cuando lo elegis en ventas
    document.getElementById("venta-cliente").addEventListener("change", (e) => {
        const idSelec = parseInt(e.target.value);
        const cliente = clientesGlobal.find(c => c.id_cliente === idSelec);
        const contenedor = document.getElementById("detalle-cliente-venta");
        if(cliente) {
            contenedor.innerHTML = `
                <strong>Nombre:</strong> ${cliente.nombre} ${cliente.apellido}<br>
                <strong>DNI:</strong> ${cliente.dni}<br>
                <strong>Email:</strong> ${cliente.email || 'N/A'}<br>
                <strong>Telefono:</strong> ${cliente.telefono || 'N/A'}
            `;
        }
    });

    // agrega items al carrito
    document.getElementById("btn-agregar-carrito").addEventListener("click", () => {
        const selProd = document.getElementById("venta-producto");
        if(!selProd.value) return;
        const prodId = parseInt(selProd.value);
        const prodText = selProd.options[selProd.selectedIndex].text.split(" (Stock:")[0];
        const cantidad = parseInt(document.getElementById("venta-cantidad").value);

        carrito.push({ id_producto: prodId, nombre: prodText, cantidad: cantidad });
        actualizarCarrito();
        document.getElementById("venta-cantidad").value = "1";
    });

    // procesa la venta y genera factura
    document.getElementById("btn-facturar").addEventListener("click", async () => {
        const token = localStorage.getItem("token");
        const id_cliente = parseInt(document.getElementById("venta-cliente").value);
        const resVenta = document.getElementById("res-venta");

        if(!id_cliente || carrito.length === 0) return;

        try {
            for (let item of carrito) {
                const res = await fetch("http://127.0.0.1:8000/ventas/comprar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ id_cliente, id_producto: item.id_producto, cantidad: item.cantidad })
                });
                if (!res.ok) throw new Error();
            }
            resVenta.innerText = "Factura emitida y stock actualizado exitosamente.";
            resVenta.className = "text-success fw-bold mt-3";
            carrito = [];
            actualizarCarrito();
            cargarProductos(); 
            cargarFacturas(); 
            
            setTimeout(() => resVenta.innerText = "", 4000);
        } catch (err) {
            resVenta.innerText = "Error procesando la venta.";
            resVenta.className = "text-danger fw-bold mt-3";
        }
    });

    // submit para editar cliente
    const formEditarCliente = document.getElementById("form-editar-cliente");
    if (formEditarCliente) {
        formEditarCliente.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("edit-cli-id").value;
            const token = localStorage.getItem("token");
            
            const clienteEditado = {
                nombre: document.getElementById("edit-cli-nombre").value,
                apellido: document.getElementById("edit-cli-apellido").value,
                dni: document.getElementById("edit-cli-dni").value,
                email: document.getElementById("edit-cli-email").value,
                telefono: document.getElementById("edit-cli-telefono").value
            };

            try {
                const res = await fetch(`http://127.0.0.1:8000/clientes/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify(clienteEditado)
                });
                if (res.ok) {
                    bootstrap.Modal.getInstance(document.getElementById('modalEditarCliente')).hide();
                    cargarClientes();
                }
            } catch (err) { console.error(err); }
        });
    }

    // submit para editar producto
    const formEditarProducto = document.getElementById("form-editar-producto");
    if (formEditarProducto) {
        formEditarProducto.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("edit-prod-id").value;
            const token = localStorage.getItem("token");
            
            const prodEditado = {
                nombre: document.getElementById("edit-prod-nombre").value,
                descripcion: document.getElementById("edit-prod-desc").value,
                precio: parseFloat(document.getElementById("edit-prod-precio").value),
                stock: parseInt(document.getElementById("edit-prod-stock").value)
            };

            try {
                const res = await fetch(`http://127.0.0.1:8000/productos/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify(prodEditado)
                });
                if (res.ok) {
                    bootstrap.Modal.getInstance(document.getElementById('modalEditarProducto')).hide();
                    cargarProductos();
                }
            } catch (err) { console.error(err); }
        });
    }
});

// carga inicial de datos al loguearse
function iniciarApp() {
    document.getElementById("auth-container").style.display = "none";
    document.getElementById("app-container").style.display = "block";
    volverAlDashboard();
    cargarProductos();
    cargarClientes();
    cargarFacturas();
}

// trae productos de la api y arma la tabla y el select
async function cargarProductos() {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch("http://127.0.0.1:8000/productos/", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const productos = await res.json();
        
        const tabla = document.getElementById("tabla-productos");
        const selectVenta = document.getElementById("venta-producto");
        
        tabla.innerHTML = "";
        selectVenta.innerHTML = '<option value="" disabled selected>Seleccionar producto</option>';

        productos.forEach(p => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="fw-bold">#${p.id}</td>
                <td>
                    <div class="fw-bold">${p.nombre}</div>
                    <div class="small text-muted prod-desc-texto">${p.descripcion || '-'}</div>
                </td>
                <td>$${p.precio.toLocaleString()}</td>
                <td>${p.stock} un.</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick='abrirModalProducto(${JSON.stringify(p)})'>Modificar</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto(${p.id})">Eliminar</button>
                </td>
            `;
            tabla.appendChild(tr);

            if (p.stock > 0) {
                const opt = document.createElement("option");
                opt.value = p.id;
                opt.textContent = `${p.nombre} - ${p.descripcion || 'Sin desc.'} (Stock: ${p.stock})`;
                selectVenta.appendChild(opt);
            }
        });
    } catch (err) { console.error(err); }
}

// actualiza stock rapido
window.modificarStock = async function(id, stockActual) {
    const nuevoStock = prompt("Ingresá la nueva cantidad de stock total:", stockActual);
    if (nuevoStock === null || nuevoStock === "") return;
    
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`http://127.0.0.1:8000/productos/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ stock: parseInt(nuevoStock) })
        });
        if (res.ok) cargarProductos();
    } catch (err) { console.error(err); }
};

// borra producto
window.eliminarProducto = async function(id) {
    if (!confirm("¿Eliminar este producto permanentemente?")) return;
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`http://127.0.0.1:8000/productos/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) cargarProductos();
    } catch (err) { console.error(err); }
}

// trae clientes de la api
async function cargarClientes() {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch("http://127.0.0.1:8000/clientes/", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const selectVenta = document.getElementById("venta-cliente");
        const tablaClientes = document.getElementById("tabla-clientes");
        selectVenta.innerHTML = '<option value="" disabled selected>Seleccione cliente</option>';
        tablaClientes.innerHTML = '';
        
        if (res.ok) {
            clientesGlobal = await res.json();
            clientesGlobal.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.id_cliente;
                opt.textContent = `${c.nombre} ${c.apellido} (DNI: ${c.dni})`;
                selectVenta.appendChild(opt);
                
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td class="fw-bold">#${c.id_cliente}</td>
                    <td class="fw-bold">${c.nombre} ${c.apellido}</td>
                    <td>${c.dni}</td>
                    <td>
                        <div class="small">${c.email || '-'}</div>
                        <div class="small">${c.telefono || '-'}</div>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick='abrirModalCliente(${JSON.stringify(c)})'>Modificar</button>
                    </td>
                `;
                tablaClientes.appendChild(tr);
            });
        }
    } catch (err) { console.error(err); }
}

// trae historial de facturas
async function cargarFacturas() {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch("http://127.0.0.1:8000/ventas/facturas", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const tabla = document.getElementById("tabla-facturas");
        
        if (res.ok) {
            const facturas = await res.json();
            tabla.innerHTML = "";
            if(facturas.length === 0){
                tabla.innerHTML = `<tr><td colspan="5" class="text-center p-4">Aún no hay facturas emitidas.</td></tr>`;
                return;
            }
            
            facturas.forEach(f => {
                const fecha = new Date(f.fecha).toLocaleString();
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td class="fw-bold">#${f.id}</td>
                    <td class="fw-bold">${f.cliente}</td>
                    <td>$${f.total.toLocaleString()}</td>
                    <td>${fecha}</td>
                    <td><button class="btn btn-sm btn-outline-success fw-bold" onclick="verFacturaPDF(${f.id})">Factura</button></td>
                `;
                tabla.appendChild(tr);
            });
        }
    } catch (err) { console.error("Error al cargar facturas", err); }
}

// saca un item del carrito
window.quitarDelCarrito = function(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
};

// redibuja la lista del carrito
function actualizarCarrito() {
    const lista = document.getElementById("lista-carrito");
    const btnFacturar = document.getElementById("btn-facturar");
    
    if (carrito.length === 0) {
        lista.innerHTML = `<li class="list-group-item text-muted text-center border-0 p-4">Carrito vacío</li>`;
        btnFacturar.disabled = true;
        return;
    }

    lista.innerHTML = "";
    carrito.forEach((item, idx) => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `
            <span class="fw-bold carrito-item-nombre">${item.nombre} (x${item.cantidad})</span>
            <button class="btn btn-sm btn-outline-danger" onclick="quitarDelCarrito(${idx})">X</button>
        `;
        lista.appendChild(li);
    });
    btnFacturar.disabled = false;
}

// abre modal para editar cliente
window.abrirModalCliente = function(cliente) {
    document.getElementById("edit-cli-id").value = cliente.id_cliente;
    document.getElementById("edit-cli-nombre").value = cliente.nombre;
    document.getElementById("edit-cli-apellido").value = cliente.apellido;
    document.getElementById("edit-cli-dni").value = cliente.dni;
    document.getElementById("edit-cli-email").value = cliente.email || "";
    document.getElementById("edit-cli-telefono").value = cliente.telefono || "";
    
    new bootstrap.Modal(document.getElementById('modalEditarCliente')).show();
};

// abre modal para editar producto
window.abrirModalProducto = function(producto) {
    document.getElementById("edit-prod-id").value = producto.id;
    document.getElementById("edit-prod-nombre").value = producto.nombre;
    document.getElementById("edit-prod-desc").value = producto.descripcion || "";
    document.getElementById("edit-prod-precio").value = producto.precio;
    document.getElementById("edit-prod-stock").value = producto.stock;
    
    new bootstrap.Modal(document.getElementById('modalEditarProducto')).show();
};

// abre la factura en otra pestana
window.verFacturaPDF = function(idFactura) {
    window.open(`/static/factura.html?id=${idFactura}`, '_blank');
};