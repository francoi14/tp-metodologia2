from fastapi import APIRouter, HTTPException, status
from app.database import get_db_connection
from app.schemas import CompraRequest

router = APIRouter(prefix="/ventas", tags=["Ventas"])

@router.post("/comprar", status_code=status.HTTP_201_CREATED)
async def procesar_venta(compra: CompraRequest):
    conn = await get_db_connection()
    try:
        async with conn.cursor() as cursor:
            # 1. Verificar existencia y stock del producto
            await cursor.execute("SELECT stock, precio FROM productos WHERE id_producto = %s", (compra.id_producto,))
            prod = await cursor.fetchone()
            
            if not prod:
                raise HTTPException(status_code=404, detail="Producto no encontrado")
            
            stock_actual, precio = prod[0], float(prod[1])
            
            if stock_actual < compra.cantidad:
                raise HTTPException(status_code=400, detail="Stock insuficiente")
            
            # 2. Descontar stock directamente por SQL de forma segura
            nuevo_stock = stock_actual - compra.cantidad
            await cursor.execute("UPDATE productos SET stock = %s WHERE id_producto = %s", (nuevo_stock, compra.id_producto))
            
            # 3. Registrar la factura para el cliente seleccionado
            total = precio * compra.cantidad
            query_factura = "INSERT INTO facturas (id_cliente, total, fecha_factura) VALUES (%s, %s, NOW())"
            await cursor.execute(query_factura, (compra.id_cliente, total))
            
            await conn.commit()
            factura_id = cursor.lastrowid

        return {
            "status": "success",
            "message": "Factura generada exitosamente",
            "factura_id": factura_id,
            "total": total
        }
    except Exception as e:
        await conn.rollback()
        print("ERROR CRÍTICO EN VENTAS:", str(e))
        raise HTTPException(status_code=500, detail=f"Error en base de datos: {str(e)}")
    finally:
        conn.close()

@router.get("/facturas")
async def listar_facturas():
    conn = await get_db_connection()
    async with conn.cursor() as cursor:
        await cursor.execute("""
            SELECT f.id_factura, CONCAT(c.nombre, ' ', c.apellido), f.total, f.fecha_factura 
            FROM facturas f
            JOIN clientes c ON f.id_cliente = c.id_cliente
            ORDER BY f.fecha_factura DESC
        """)
        facturas = await cursor.fetchall()
    conn.close()
    
    return [{"id": f[0], "cliente": f[1], "total": float(f[2]), "fecha": str(f[3])} for f in facturas]

@router.get("/facturas/{id_factura}/detalle")
async def obtener_detalle_factura(id_factura: int):
    conn = await get_db_connection()
    async with conn.cursor() as cursor:
        # Cabecera de la factura y cliente
        await cursor.execute("""
            SELECT f.id_factura, f.fecha_factura, f.total, 
                   c.nombre, c.apellido, c.dni, c.email, c.telefono
            FROM facturas f
            JOIN clientes c ON f.id_cliente = c.id_cliente
            WHERE f.id_factura = %s
        """, (id_factura,))
        factura = await cursor.fetchone()
        
        if not factura:
            raise HTTPException(status_code=404, detail="Factura no encontrada")
        
        # Detalle de los productos comprados
        
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
        }
    }