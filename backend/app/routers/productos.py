from fastapi import APIRouter, HTTPException, status
from typing import List
from app.database import get_db_connection
from app.schemas import ProductoCrear, ProductoRespuesta

router = APIRouter(prefix="/productos", tags=["Productos"])

# 1. Obtener todos los productos
@router.get("/", response_model=List[ProductoRespuesta])
async def listar_productos():
    conn = await get_db_connection()
    async with conn.cursor() as cursor:
        # Buscamos id_producto
        await cursor.execute("SELECT id_producto, nombre, descripcion, precio, stock FROM productos")
        productos = await cursor.fetchall()
    conn.close()

    resultado = []
    for p in productos:
        resultado.append({
            "id": p[0],
            "nombre": p[1],
            "descripcion": p[2],
            "precio": float(p[3]),
            "stock": p[4]
        })
    return resultado

# 2. Crear un nuevo producto
@router.post("/", response_model=ProductoRespuesta, status_code=status.HTTP_201_CREATED)
async def crear_producto(producto: ProductoCrear):
    conn = await get_db_connection()
    async with conn.cursor() as cursor:
        query = "INSERT INTO productos (nombre, descripcion, precio, stock) VALUES (%s, %s, %s, %s)"
        await cursor.execute(query, (producto.nombre, producto.descripcion, producto.precio, producto.stock))
        await conn.commit()
        producto_id = cursor.lastrowid
    conn.close()

    return {**producto.model_dump(), "id": producto_id}

# 3. Obtener un producto por ID
@router.get("/{producto_id}", response_model=ProductoRespuesta)
async def obtener_producto(producto_id: int):
    conn = await get_db_connection()
    async with conn.cursor() as cursor:
        # CORREGIDO: Buscamos id_producto y filtramos por id_producto
        await cursor.execute("SELECT id_producto, nombre, descripcion, precio, stock FROM productos WHERE id_producto = %s", (producto_id,))
        p = await cursor.fetchone()
    conn.close()

    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return {
        "id": p[0],
        "nombre": p[1],
        "descripcion": p[2],
        "precio": float(p[3]),
        "stock": p[4]
    }

# 4. Eliminar un producto
@router.delete("/{producto_id}")
async def eliminar_producto(producto_id: int):
    conn = await get_db_connection()
    async with conn.cursor() as cursor:
        #filtramos por id_producto
        await cursor.execute("DELETE FROM productos WHERE id_producto = %s", (producto_id,))
        await conn.commit()
        filas = cursor.rowcount
    conn.close()

    if filas == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return {"status": "success", "message": "Producto eliminado correctamente"}

@router.put("/{producto_id}")
async def modificar_producto(producto_id: int, prod: dict):
    conn = await get_db_connection()
    async with conn.cursor() as cursor:
        await cursor.execute(
            "UPDATE productos SET nombre=%s, descripcion=%s, precio=%s, stock=%s WHERE id_producto=%s",
            (prod.get("nombre"), prod.get("descripcion"), prod.get("precio"), prod.get("stock"), producto_id)
        )
        await conn.commit()
    conn.close()
    return {"status": "success", "mensaje": "Producto actualizado"}