from fastapi import APIRouter
from app.database import get_db_connection

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.get("/")
async def listar_usuarios():
    conn = await get_db_connection()
    async with conn.cursor() as cursor:
        # Traemos los datos que sabemos que existen en tu tabla actual
        await cursor.execute("SELECT id_usuario, nombre, email FROM usuarios")
        usuarios = await cursor.fetchall()
    conn.close()

    resultado = []
    for u in usuarios:
        resultado.append({
            "id_usuario": u[0],
            "nombre": u[1],
            "email": u[2] if u[2] else "No registrado",
            "dni": "No registrado",      
            "telefono": "No registrado"  
        })
    return resultado