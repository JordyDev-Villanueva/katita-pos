-- ============================================
-- KATITA-POS - Enable RLS Security
-- ============================================
-- Este script habilita Row Level Security (RLS) en todas las tablas
-- para cumplir con las recomendaciones de Supabase Security Advisor.
--
-- IMPORTANTE: Como KATITA-POS usa Flask + SQLAlchemy con conexión
-- directa a PostgreSQL (rol postgres), RLS NO afecta el funcionamiento
-- de la aplicación. Este script solo silencia las alertas de seguridad.
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalles_venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devoluciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ajustes_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuadros_caja ENABLE ROW LEVEL SECURITY;

-- Crear política que permite TODO al rol postgres (backend de Flask)
-- Esto asegura que la aplicación funcione normalmente mientras RLS está habilitado

CREATE POLICY "Allow all for postgres role" ON public.products
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for postgres role" ON public.lotes
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for postgres role" ON public.users
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for postgres role" ON public.movimientos_stock
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for postgres role" ON public.detalles_venta
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for postgres role" ON public.ventas
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for postgres role" ON public.sync_queue
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for postgres role" ON public.devoluciones
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for postgres role" ON public.ajustes_inventario
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for postgres role" ON public.cuadros_caja
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta esta query para verificar que RLS está habilitado:
--
-- SELECT
--     schemaname,
--     tablename,
--     rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- Debería mostrar rowsecurity = true para todas las tablas
-- ============================================
