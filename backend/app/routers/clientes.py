from fastapi import APIRouter
from app.database import get_db_connection

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.get("/")
async def listar_clientes():
    conn = await get_db_connection()
    async with conn.cursor() as cursor:
        await cursor.execute("SELECT id_cliente, nombre, apellido, dni, email, telefono FROM clientes")
        clientes = await cursor.fetchall()
    conn.close()
    return [{"id_cliente": c[0], "nombre": c[1], "apellido": c[2], "dni": c[3], "email": c[4], "telefono": c[5]} for c in clientes]

@router.post("/")
async def crear_cliente(cliente: dict):
    conn = await get_db_connection()
    async with conn.cursor() as cursor:
        await cursor.execute(
            "INSERT INTO clientes (nombre, apellido, dni, email, telefono) VALUES (%s, %s, %s, %s, %s)",
            (cliente.get("nombre"), cliente.get("apellido"), cliente.get("dni"), cliente.get("email"), cliente.get("telefono"))
        )
        await conn.commit()
    conn.close()
    return {"status": "success", "mensaje": "Cliente guardado"}

@router.put("/{cliente_id}")
async def modificar_cliente(cliente_id: int, cliente: dict):
    conn = await get_db_connection()
    async with conn.cursor() as cursor:
        await cursor.execute(
            "UPDATE clientes SET nombre=%s, apellido=%s, dni=%s, email=%s, telefono=%s WHERE id_cliente=%s",
            (cliente.get("nombre"), cliente.get("apellido"), cliente.get("dni"), cliente.get("email"), cliente.get("telefono"), cliente_id)
        )
        await conn.commit()
    conn.close()
    return {"status": "success", "mensaje": "Cliente actualizado"}