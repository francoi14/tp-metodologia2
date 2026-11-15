-- 1. CREACION DE LA BASE DE DATOS
CREATE DATABASE IF NOT EXISTS ecommerce_tp;
USE ecommerce_tp;

-- 2. CREACION DE TABLAS (Normalizadas)

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'cliente') DEFAULT 'cliente',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    CHECK (precio >= 0), -- Validacion cruzada a nivel base de datos
    CHECK (stock >= 0)
);

CREATE TABLE facturas (
    id_factura INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    fecha_factura DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT
);

CREATE TABLE detalle_factura (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_factura INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    FOREIGN KEY (id_factura) REFERENCES facturas(id_factura) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE RESTRICT
);

-- 3. STORED PROCEDURE CON TRANSACCIONALIDAD (COMMIT / ROLLBACK)
-- Este procedimiento intenta registrar una compra. Si no hay stock suficiente, cancela todo.

DELIMITER //

CREATE PROCEDURE sp_procesar_compra(
    IN p_id_usuario INT,
    IN p_id_producto INT,
    IN p_cantidad INT
)
BEGIN
    DECLARE v_stock_actual INT;
    DECLARE v_precio DECIMAL(10,2);
    DECLARE v_id_factura INT;
    
    -- Manejador de errores para hacer ROLLBACK automatico si algo falla
    DECLARE EXIT HANDLER FOR SQLEXCEPTION 
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error en la transacción. Se aplico ROLLBACK.';
    END;

    -- Iniciar transaccion explicita 
    START TRANSACTION;

    -- Obtener stock y precio del producto bloqueando la fila para evitar lecturas fantasmas
    SELECT stock, precio INTO v_stock_actual, v_precio 
    FROM productos 
    WHERE id_producto = p_id_producto 
    FOR UPDATE;

    -- Validar si hay stock suficiente
    IF v_stock_actual < p_cantidad THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente. Operación cancelada (ROLLBACK).';
    ELSE
        -- 1. Insertar la cabecera de la factura
        INSERT INTO facturas (id_usuario, total) 
        VALUES (p_id_usuario, (v_precio * p_cantidad));
        
        -- Obtener el ID de la factura recien creada
        SET v_id_factura = LAST_INSERT_ID();

        -- 2. Insertar el detalle de la compra
        INSERT INTO detalle_factura (id_factura, id_producto, cantidad, precio_unitario)
        VALUES (v_id_factura, p_id_producto, p_cantidad, v_precio);

        -- 3. Descontar el stock del producto
        UPDATE productos 
        SET stock = stock - p_cantidad 
        WHERE id_producto = p_id_producto;

        -- Confirmar la transacción si todo salio bien (Requisito del TP)
        COMMIT;
    END IF;

END //

DELIMITER ;
-- A) INNER JOIN: armar el detalle completo para la factura o ticket
-- une las 4 tablas para ver quien compro, que compro y la plata
SELECT 
    f.id_factura, 
    u.nombre AS cliente, 
    p.nombre AS producto, 
    d.cantidad, 
    d.subtotal 
FROM facturas f
INNER JOIN usuarios u ON f.id_usuario = u.id_usuario
INNER JOIN detalle_factura d ON f.id_factura = d.id_factura
INNER JOIN productos p ON d.id_producto = p.id_producto;

-- B) GROUP BY: reporte de recaudacion por producto
-- agrupa las ventas por producto para saber cual dejo mas plata
SELECT 
    p.nombre AS producto, 
    SUM(d.cantidad) AS unidades_vendidas, 
    SUM(d.subtotal) AS total_recaudado
FROM detalle_factura d
INNER JOIN productos p ON d.id_producto = p.id_producto
GROUP BY p.id_producto, p.nombre
ORDER BY total_recaudado DESC;

-- C) SUBCONSULTA: buscar ventas por encima del promedio
-- saca el promedio general de ventas y trae las facturas que lo superan
SELECT 
    u.nombre AS cliente, 
    f.id_factura, 
    f.fecha_factura, 
    f.total
FROM facturas f
INNER JOIN usuarios u ON f.id_usuario = u.id_usuario
WHERE f.total > (
    SELECT AVG(total) FROM facturas
);