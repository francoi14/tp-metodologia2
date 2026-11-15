from fastapi import APIRouter, HTTPException, status
from app.database import get_db_connection
from app.schemas import CompraRequest

router = APIRouter(prefix="/ventas", tags=["Ventas"])

# registra la venta llamando al stored procedure con commit y rollback en mysql
@router.post("/comprar", status_code=status.HTTP_201_CREATED)
async def procesar_venta(compra: CompraRequest):
    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            await cursor.execute(
                "CALL sp_procesar_compra(%s, %s, %s)",
                (compra.id_cliente, compra.id_producto, compra.cantidad)
            )

            await cursor.execute(
                "SELECT id_factura, total FROM facturas WHERE id_cliente = %s ORDER BY id_factura DESC LIMIT 1",
                (compra.id_cliente,)
            )
            factura = await cursor.fetchone()

        return {
            "status": "success",
            "message": "Factura generada exitosamente",
            "factura_id": factura[0] if factura else None,
            "total": float(factura[1]) if factura else 0.0
        }
    except Exception as e:
        error_msg = str(e)
        if "Stock insuficiente" in error_msg or "45000" in error_msg:
            raise HTTPException(status_code=400, detail="Stock insuficiente o producto inexistente.")
        raise HTTPException(status_code=500, detail=f"Error en base de datos: {error_msg}")
    finally:
        conn.close()


# lista todas las facturas cruzando con clientes
@router.get("/facturas")
async def listar_facturas():
    conn = await get_db_connection()
    async with conn.cursor() as cursor:
        await cursor.execute("""
            SELECT f.id_factura, CONCAT(c.nombre, ' ', c.apellido), f.total, f.fecha_factura 
            FROM facturas f
            INNER JOIN clientes c ON f.id_cliente = c.id_cliente
            ORDER BY f.fecha_factura DESC
        """)
        facturas = await cursor.fetchall()
    conn.close()

    return [{"id": f[0], "cliente": f[1], "total": float(f[2]), "fecha": str(f[3])} for f in facturas]


# inner join de las 4 tablas trayendo nombre y descripcion del producto
@router.get("/facturas/{id_factura}/detalle")
async def obtener_detalle_factura(id_factura: int):
    conn = await get_db_connection()
    async with conn.cursor() as cursor:
        await cursor.execute("""
            SELECT f.id_factura, f.fecha_factura, f.total, 
                   c.nombre, c.apellido, c.dni, c.email, c.telefono
            FROM facturas f
            INNER JOIN clientes c ON f.id_cliente = c.id_cliente
            WHERE f.id_factura = %s
        """, (id_factura,))
        factura = await cursor.fetchone()

        if not factura:
            conn.close()
            raise HTTPException(status_code=404, detail="Factura no encontrada")

        await cursor.execute("""
            SELECT p.id_producto, p.nombre, p.descripcion, d.cantidad, d.precio_unitario, d.subtotal
            FROM detalle_factura d
            INNER JOIN productos p ON d.id_producto = p.id_producto
            WHERE d.id_factura = %s
        """, (id_factura,))
        items = await cursor.fetchall()

    conn.close()

    return {
        "id_factura": factura[0],
        "fecha": str(factura[1]),
        "total": float(factura[2]),
        "cliente": {
            "nombre": f"{factura[3]} {factura[4]}",
            "dni": factura[5],
            "email": factura[6] or "No registrado",
            "telefono": factura[7] or "No registrado"
        },
        "items": [
            {
                "id_producto": item[0],
                "producto": item[1],
                "descripcion": item[2] or "",
                "cantidad": item[3],
                "precio_unitario": float(item[4]),
                "subtotal": float(item[5])
            }
            for item in items
        ]
    }


# group by: calcula unidades vendidas y total recaudado por producto
@router.get("/reportes/recaudacion")
async def reporte_recaudacion_productos():
    conn = await get_db_connection()
    async with conn.cursor() as cursor:
        await cursor.execute("""
            SELECT p.id_producto, p.nombre, SUM(d.cantidad) AS unidades_vendidas, SUM(d.subtotal) AS total_recaudado
            FROM detalle_factura d
            INNER JOIN productos p ON d.id_producto = p.id_producto
            GROUP BY p.id_producto, p.nombre
            ORDER BY total_recaudado DESC
        """)
        filas = await cursor.fetchall()
    conn.close()

    return [
        {
            "id_producto": f[0],
            "producto": f[1],
            "unidades_vendidas": int(f[2]),
            "total_recaudado": float(f[3])
        }
        for f in filas
    ]


# subconsulta: devuelve las facturas cuyo monto total supera el promedio general
@router.get("/reportes/destacadas")
async def reporte_ventas_sobre_promedio():
    conn = await get_db_connection()
    async with conn.cursor() as cursor:
        await cursor.execute("""
            SELECT CONCAT(c.nombre, ' ', c.apellido) AS cliente, f.id_factura, f.fecha_factura, f.total
            FROM facturas f
            INNER JOIN clientes c ON f.id_cliente = c.id_cliente
            WHERE f.total > (SELECT AVG(total) FROM facturas)
            ORDER BY f.total DESC
        """)
        filas = await cursor.fetchall()
    conn.close()

    return [
        {
            "cliente": f[0],
            "id_factura": f[1],
            "fecha": str(f[2]),
            "total": float(f[3])
        }
        for f in filas
    ]