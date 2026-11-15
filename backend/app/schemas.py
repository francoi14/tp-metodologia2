from pydantic import BaseModel
from typing import Optional

# Esquema para el Login
class UsuarioLogin(BaseModel):
    nombre: str
    password: str

# Esquema para devolver el Token JWT
class Token(BaseModel):
    access_token: str
    token_type: str

# Esquema para crear o actualizar un Producto
class ProductoCrear(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    stock: int

# Esquema para devolver un producto con su ID
class ProductoRespuesta(ProductoCrear):
    id: int

# Esquema para procesar una compra
class CompraRequest(BaseModel):
    id_cliente: int
    id_producto: int
    cantidad: int