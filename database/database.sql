-- crear y usar la base de datos
CREATE DATABASE IF NOT EXISTS ecommerce_tp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE ecommerce_tp;

-- tabla de usuarios del sistema
CREATE TABLE `usuarios` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `rol` ENUM('admin', 'cliente') DEFAULT 'cliente',
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- tabla de clientes
CREATE TABLE `clientes` (
  `id_cliente` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `dni` VARCHAR(20) NOT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `telefono` VARCHAR(20) DEFAULT NULL,
  PRIMARY KEY (`id_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- tabla de productos con validacion de precio y stock positivos
CREATE TABLE `productos` (
  `id_producto` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` TEXT,
  `precio` DECIMAL(10, 2) NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_producto`),
  CONSTRAINT `productos_chk_1` CHECK (`precio` >= 0),
  CONSTRAINT `productos_chk_2` CHECK (`stock` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- cabecera de facturas vinculada al cliente
CREATE TABLE `facturas` (
  `id_factura` INT NOT NULL AUTO_INCREMENT,
  `id_cliente` INT NOT NULL,
  `fecha_factura` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `total` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id_factura`),
  KEY `facturas_ibfk_1` (`id_cliente`),
  CONSTRAINT `facturas_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- detalle de items por factura con subtotal calculado
CREATE TABLE `detalle_factura` (
  `id_detalle` INT NOT NULL AUTO_INCREMENT,
  `id_factura` INT NOT NULL,
  `id_producto` INT NOT NULL,
  `cantidad` INT NOT NULL,
  `precio_unitario` DECIMAL(10, 2) NOT NULL,
  `subtotal` DECIMAL(10, 2) GENERATED ALWAYS AS (`cantidad` * `precio_unitario`) STORED,
  PRIMARY KEY (`id_detalle`),
  KEY `id_factura` (`id_factura`),
  KEY `id_producto` (`id_producto`),
  CONSTRAINT `detalle_factura_ibfk_1` FOREIGN KEY (`id_factura`) REFERENCES `facturas` (`id_factura`) ON DELETE CASCADE,
  CONSTRAINT `detalle_factura_ibfk_2` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- usuario administrador y datos iniciales de prueba
INSERT INTO `usuarios` (`nombre`, `email`, `password_hash`, `rol`)
VALUES ('Admin', 'admin@tp.com', 'admin123', 'admin');

INSERT INTO `clientes` (`nombre`, `apellido`, `dni`, `email`, `telefono`) VALUES
('Juan', 'Perez', '35123456', 'juan.perez@email.com', '3804112233'),
('Maria', 'Gomez', '38987654', 'maria.gomez@email.com', '3804445566');

INSERT INTO `productos` (`nombre`, `descripcion`, `precio`, `stock`) VALUES
('Mouse', 'Logitech G203 Lightsync', 25000.00, 15),
('Teclado', 'Redragon Kumara K552 RGB', 45000.00, 10),
('Monitor', 'MSI 27 pulgadas 180Hz', 320000.00, 5);

-- procedimiento almacenado para registrar ventas y descontar stock con rollback si falla
DROP PROCEDURE IF EXISTS `sp_procesar_compra`;

DELIMITER //

CREATE PROCEDURE `sp_procesar_compra`(
    IN p_id_cliente INT,
    IN p_id_producto INT,
    IN p_cantidad INT
)
BEGIN
    DECLARE v_stock_actual INT DEFAULT NULL;
    DECLARE v_precio DECIMAL(10, 2);
    DECLARE v_id_factura INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error en la transaccion. Se aplico ROLLBACK.';
    END;

    START TRANSACTION;

    SELECT stock, precio INTO v_stock_actual, v_precio
    FROM productos
    WHERE id_producto = p_id_producto
    FOR UPDATE;

    IF v_stock_actual IS NULL OR v_stock_actual < p_cantidad OR p_cantidad <= 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente o producto inexistente. Operacion cancelada.';
    ELSE
        INSERT INTO facturas (id_cliente, total)
        VALUES (p_id_cliente, (v_precio * p_cantidad));

        SET v_id_factura = LAST_INSERT_ID();

        INSERT INTO detalle_factura (id_factura, id_producto, cantidad, precio_unitario)
        VALUES (v_id_factura, p_id_producto, p_cantidad, v_precio);

        UPDATE productos
        SET stock = stock - p_cantidad
        WHERE id_producto = p_id_producto;

        COMMIT;
    END IF;
END //

DELIMITER ;

-- inner join: trae el detalle completo de cada factura uniendo las 4 tablas
SELECT 
    f.id_factura,
    CONCAT(c.nombre, ' ', c.apellido) AS cliente,
    c.dni,
    p.nombre AS producto,
    d.cantidad,
    d.precio_unitario,
    d.subtotal,
    f.fecha_factura
FROM facturas f
INNER JOIN clientes c ON f.id_cliente = c.id_cliente
INNER JOIN detalle_factura d ON f.id_factura = d.id_factura
INNER JOIN productos p ON d.id_producto = p.id_producto;

-- group by: calcula unidades vendidas y total recaudado por producto
SELECT 
    p.id_producto,
    p.nombre AS producto,
    SUM(d.cantidad) AS unidades_vendidas,
    SUM(d.subtotal) AS total_recaudado
FROM detalle_factura d
INNER JOIN productos p ON d.id_producto = p.id_producto
GROUP BY p.id_producto, p.nombre
ORDER BY total_recaudado DESC;

-- subconsulta: lista las facturas que superan el promedio general de ventas
SELECT 
    CONCAT(c.nombre, ' ', c.apellido) AS cliente,
    f.id_factura,
    f.fecha_factura,
    f.total
FROM facturas f
INNER JOIN clientes c ON f.id_cliente = c.id_cliente
WHERE f.total > (
    SELECT AVG(total) FROM facturas
);