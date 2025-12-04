-- ========================================
-- MIGRACIÓN FASE 8: Devoluciones y Ajustes de Inventario
-- ========================================
-- Creado: 2025-12-03
-- Descripción: Agregar tablas para devoluciones y ajustes de inventario

-- ========================================
-- 1. Agregar campo 'devuelta' a tabla ventas
-- ========================================

-- Verificar si la columna ya existe antes de agregar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ventas' AND column_name = 'devuelta'
    ) THEN
        ALTER TABLE ventas ADD COLUMN devuelta BOOLEAN DEFAULT FALSE NOT NULL;
        CREATE INDEX idx_ventas_devuelta ON ventas(devuelta);
        RAISE NOTICE 'Columna devuelta agregada a tabla ventas';
    ELSE
        RAISE NOTICE 'Columna devuelta ya existe en tabla ventas';
    END IF;
END
$$;


-- ========================================
-- 2. Crear tabla devoluciones
-- ========================================

CREATE TABLE IF NOT EXISTS devoluciones (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER NOT NULL REFERENCES ventas(id) ON DELETE RESTRICT,
    admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    vendedor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- Datos de la devolución
    motivo VARCHAR(200) NOT NULL,
    observaciones TEXT,
    monto_devuelto NUMERIC(10, 2) NOT NULL CHECK (monto_devuelto >= 0),

    -- Timestamps
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT unique_venta_devuelta UNIQUE (venta_id)
);

-- Índices para devoluciones
CREATE INDEX IF NOT EXISTS idx_devoluciones_venta ON devoluciones(venta_id);
CREATE INDEX IF NOT EXISTS idx_devoluciones_admin ON devoluciones(admin_id);
CREATE INDEX IF NOT EXISTS idx_devoluciones_vendedor ON devoluciones(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_devoluciones_fecha ON devoluciones(fecha);

COMMENT ON TABLE devoluciones IS 'FASE 8: Registra devoluciones de ventas con reversión de inventario';
COMMENT ON COLUMN devoluciones.motivo IS 'Motivo de la devolución: Cliente insatisfecho, Producto defectuoso, etc.';
COMMENT ON COLUMN devoluciones.monto_devuelto IS 'Monto total devuelto al cliente';


-- ========================================
-- 3. Crear tipo ENUM para ajustes de inventario
-- ========================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_ajuste_enum') THEN
        CREATE TYPE tipo_ajuste_enum AS ENUM (
            'merma',
            'rotura',
            'robo',
            'error_conteo',
            'inventario_fisico'
        );
        RAISE NOTICE 'Tipo enum tipo_ajuste_enum creado';
    ELSE
        RAISE NOTICE 'Tipo enum tipo_ajuste_enum ya existe';
    END IF;
END
$$;


-- ========================================
-- 4. Crear tabla ajustes_inventario
-- ========================================

CREATE TABLE IF NOT EXISTS ajustes_inventario (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    lote_id INTEGER REFERENCES lotes(id) ON DELETE SET NULL,
    admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- Datos del ajuste
    cantidad_anterior INTEGER NOT NULL CHECK (cantidad_anterior >= 0),
    cantidad_nueva INTEGER NOT NULL CHECK (cantidad_nueva >= 0),
    diferencia INTEGER NOT NULL,

    -- Tipo de ajuste
    tipo_ajuste tipo_ajuste_enum NOT NULL,

    -- Detalles
    motivo TEXT NOT NULL,
    observaciones TEXT,

    -- Timestamps
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para ajustes_inventario
CREATE INDEX IF NOT EXISTS idx_ajustes_producto ON ajustes_inventario(producto_id);
CREATE INDEX IF NOT EXISTS idx_ajustes_lote ON ajustes_inventario(lote_id);
CREATE INDEX IF NOT EXISTS idx_ajustes_admin ON ajustes_inventario(admin_id);
CREATE INDEX IF NOT EXISTS idx_ajustes_fecha ON ajustes_inventario(fecha);
CREATE INDEX IF NOT EXISTS idx_ajustes_tipo ON ajustes_inventario(tipo_ajuste);

COMMENT ON TABLE ajustes_inventario IS 'FASE 8: Registra ajustes manuales de inventario por mermas, roturas, etc.';
COMMENT ON COLUMN ajustes_inventario.tipo_ajuste IS 'Tipo: merma, rotura, robo, error_conteo, inventario_fisico';
COMMENT ON COLUMN ajustes_inventario.diferencia IS 'Diferencia de stock (puede ser positiva o negativa)';


-- ========================================
-- 5. Verificar la creación de tablas
-- ========================================

DO $$
DECLARE
    tabla_devoluciones_existe BOOLEAN;
    tabla_ajustes_existe BOOLEAN;
    columna_devuelta_existe BOOLEAN;
BEGIN
    -- Verificar tabla devoluciones
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'devoluciones'
    ) INTO tabla_devoluciones_existe;

    -- Verificar tabla ajustes_inventario
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'ajustes_inventario'
    ) INTO tabla_ajustes_existe;

    -- Verificar columna devuelta
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ventas' AND column_name = 'devuelta'
    ) INTO columna_devuelta_existe;

    -- Mostrar resultados
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESULTADO DE MIGRACIÓN FASE 8';
    RAISE NOTICE '========================================';

    IF tabla_devoluciones_existe THEN
        RAISE NOTICE '✓ Tabla devoluciones: CREADA';
    ELSE
        RAISE WARNING '✗ Tabla devoluciones: NO EXISTE';
    END IF;

    IF tabla_ajustes_existe THEN
        RAISE NOTICE '✓ Tabla ajustes_inventario: CREADA';
    ELSE
        RAISE WARNING '✗ Tabla ajustes_inventario: NO EXISTE';
    END IF;

    IF columna_devuelta_existe THEN
        RAISE NOTICE '✓ Columna ventas.devuelta: AGREGADA';
    ELSE
        RAISE WARNING '✗ Columna ventas.devuelta: NO EXISTE';
    END IF;

    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END
$$;
