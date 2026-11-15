import os
import aiomysql
from dotenv import load_dotenv

# Cargar variables de entorno desde el .env
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "ecommerce_tp")

async def get_db_connection():
    """
    Retorna una conexión asíncrona a MySQL con autocommit deshabilitado
    para permitir transacciones puras (COMMIT / ROLLBACK).
    """
    return await aiomysql.connect(
        host=DB_HOST,
        port=3306,
        user=DB_USER,
        password=DB_PASSWORD,
        db=DB_NAME,
        autocommit=False
    )