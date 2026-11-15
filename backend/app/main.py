from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.database import get_db_connection
from app.routers import auth, productos, ventas, usuarios, clientes

app = FastAPI(title="Tienda Gamer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(productos.router)
app.include_router(ventas.router)
app.include_router(usuarios.router)
app.include_router(clientes.router)

@app.get("/")
def read_root():
    return {"status": "online", "message": "API Tienda Gamer LR funcionando"}

@app.get("/test-db")
async def test_db():
    try:
        conn = await get_db_connection()
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT DATABASE();")
            db_name = await cursor.fetchone()
        conn.close()
        return {"status": "success", "database": db_name[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error conectando a la BD: {str(e)}")