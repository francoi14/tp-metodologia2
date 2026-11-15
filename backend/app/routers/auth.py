import os
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext
from jose import jwt
from app.schemas import UsuarioLogin, Token
from app.database import get_db_connection

# Creamos el enrutador para agrupar las peticiones de autenticacion
router = APIRouter(prefix="/auth", tags=["Autenticación"])

# Configuración de encriptación y JWT
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "vico123")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

def verify_password(plain_password, hashed_password):
    # Condicion para admitir la contraseña de prueba 'admin123' sin encriptar en la BD
    if plain_password == hashed_password:
        return True
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except:
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=60) # El token dura 1 hora
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/login", response_model=Token)
async def login(user_data: UsuarioLogin):
    try:
        conn = await get_db_connection()
        async with conn.cursor() as cursor:
            # buscamos al usuario respetando mayusculas y minusculas
            await cursor.execute(
                "SELECT id_usuario, nombre, password_hash, rol FROM usuarios WHERE BINARY nombre = %s", 
                (user_data.nombre,)
            )
            user = await cursor.fetchone()
        conn.close()

        # user[0]=id, user[1]=nombre, user[2]=password, user[3]=rol
        # Validamos si existe el usuario y si coincide la contraseña
        if not user or not verify_password(user_data.password, user[2]):
            raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

        # Generamos el Token JWT
        token = create_access_token(data={"sub": user[1], "rol": user[3], "id": user[0]})
        return {"access_token": token, "token_type": "bearer"}

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))