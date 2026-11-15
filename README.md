# Tienda Gamer LR — Sistema de Gestión Comercial

Aplicación web full-stack para administración de clientes, control de inventario, facturación transaccional y generación de reportes en PDF y Excel (CSV).

## Arquitectura y Tecnologías
* **Frontend:** React (Vite), JavaScript (ES6+), Fetch API y CSS puro.
* **Backend:** Python 3, FastAPI, Uvicorn, PyJWT y `aiomysql`.
* **Base de Datos:** MySQL (modelo relacional normalizado en 3FN, Stored Procedure con `START TRANSACTION`, `COMMIT` y `ROLLBACK`).

## Estructura del Proyecto
* `backend/`: API REST en FastAPI con autenticación JWT, CRUD completo y endpoints de reportes (`INNER JOIN`, `GROUP BY`, subconsultas).
* `frontend-react/`: Interfaz modular en React con validaciones en cliente, carrito de compras, exportación CSV e impresión de comprobantes.
* `database/`: Script DDL/DML (`database.sql`) y Diagrama Entidad-Relación (`ecommerce_tp.png`).

## Instalación y Ejecución

### 1. Base de Datos (MySQL)
1. Importar y ejecutar `database/database.sql` en MySQL / DBeaver.
2. Credenciales iniciales del sistema:
   * **Usuario:** `Admin`
   * **Contraseña:** `admin123`

### 2. Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload