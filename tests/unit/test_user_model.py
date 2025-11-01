"""
Tests para el modelo User de KATITA-POS

Tests completos para verificar:
- Creación de usuarios
- Hash y verificación de contraseñas
- Roles y permisos
- Sistema de bloqueo por intentos fallidos
- Validaciones automáticas
- Métodos de búsqueda
- Serialización con y sin datos sensibles
"""

import pytest
from datetime import datetime, timezone, timedelta
from app import create_app, db
from app.models.user import User


@pytest.fixture(scope='function')
def app():
    """Crea una instancia de la aplicación para testing"""
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


class TestUserModel:
    """Tests para el modelo User"""

    def test_crear_usuario_basico(self, app):
        """Test: Crear un usuario básico con datos válidos"""
        with app.app_context():
            user = User(
                username='jperez',
                email='jperez@example.com',
                nombre_completo='Juan Pérez',
                telefono='0987654321'
            )
            user.set_password('password123')

            db.session.add(user)
            db.session.commit()

            assert user.id is not None
            assert user.username == 'jperez'
            assert user.email == 'jperez@example.com'
            assert user.nombre_completo == 'Juan Pérez'
            assert user.telefono == '0987654321'
            assert user.password_hash is not None

    def test_usuario_valores_por_defecto(self, app):
        """Test: Verificar valores por defecto del usuario"""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                nombre_completo='Test User'
            )
            user.set_password('password123')

            assert user.rol == 'vendedor'
            assert user.activo is True
            assert user.intentos_login_fallidos == 0
            assert user.bloqueado_hasta is None
            assert user.ultimo_acceso is None

    def test_username_unico(self, app):
        """Test: El username debe ser único"""
        with app.app_context():
            user1 = User(
                username='duplicate',
                email='user1@example.com',
                nombre_completo='User One'
            )
            user1.set_password('password123')
            db.session.add(user1)
            db.session.commit()

            user2 = User(
                username='duplicate',
                email='user2@example.com',
                nombre_completo='User Two'
            )
            user2.set_password('password123')
            db.session.add(user2)

            with pytest.raises(Exception):  # IntegrityError
                db.session.commit()

    def test_email_unico(self, app):
        """Test: El email debe ser único"""
        with app.app_context():
            user1 = User(
                username='user1',
                email='duplicate@example.com',
                nombre_completo='User One'
            )
            user1.set_password('password123')
            db.session.add(user1)
            db.session.commit()

            user2 = User(
                username='user2',
                email='duplicate@example.com',
                nombre_completo='User Two'
            )
            user2.set_password('password123')
            db.session.add(user2)

            with pytest.raises(Exception):  # IntegrityError
                db.session.commit()

    # === TESTS DE VALIDACIONES ===

    def test_validar_username_vacio(self, app):
        """Test: Username vacío debe fallar"""
        with app.app_context():
            with pytest.raises(ValueError, match='nombre de usuario es requerido'):
                user = User(
                    username='',
                    email='test@example.com',
                    nombre_completo='Test User'
                )

    def test_validar_username_muy_corto(self, app):
        """Test: Username muy corto debe fallar"""
        with app.app_context():
            with pytest.raises(ValueError, match='al menos 3 caracteres'):
                user = User(
                    username='ab',
                    email='test@example.com',
                    nombre_completo='Test User'
                )

    def test_validar_username_muy_largo(self, app):
        """Test: Username muy largo debe fallar"""
        with app.app_context():
            with pytest.raises(ValueError, match='no puede tener más de 80 caracteres'):
                user = User(
                    username='a' * 81,
                    email='test@example.com',
                    nombre_completo='Test User'
                )

    def test_validar_username_caracteres_invalidos(self, app):
        """Test: Username con caracteres inválidos debe fallar"""
        with app.app_context():
            with pytest.raises(ValueError, match='solo puede contener'):
                user = User(
                    username='user@name',
                    email='test@example.com',
                    nombre_completo='Test User'
                )

    def test_validar_email_vacio(self, app):
        """Test: Email vacío debe fallar"""
        with app.app_context():
            with pytest.raises(ValueError, match='email es requerido'):
                user = User(
                    username='testuser',
                    email='',
                    nombre_completo='Test User'
                )

    def test_validar_email_formato_invalido(self, app):
        """Test: Email con formato inválido debe fallar"""
        with app.app_context():
            with pytest.raises(ValueError, match='formato del email no es válido'):
                user = User(
                    username='testuser',
                    email='invalid-email',
                    nombre_completo='Test User'
                )

    def test_validar_nombre_completo_vacio(self, app):
        """Test: Nombre completo vacío debe fallar"""
        with app.app_context():
            with pytest.raises(ValueError, match='nombre completo es requerido'):
                user = User(
                    username='testuser',
                    email='test@example.com',
                    nombre_completo=''
                )

    def test_validar_rol_invalido(self, app):
        """Test: Rol inválido debe fallar"""
        with app.app_context():
            with pytest.raises(ValueError, match='rol debe ser uno de'):
                user = User(
                    username='testuser',
                    email='test@example.com',
                    nombre_completo='Test User',
                    rol='superadmin'
                )

    def test_validar_intentos_negativos(self, app):
        """Test: Intentos negativos deben fallar"""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                nombre_completo='Test User'
            )
            user.set_password('password123')

            with pytest.raises(ValueError, match='intentos de login no pueden ser negativos'):
                user.intentos_login_fallidos = -1

    # === TESTS DE AUTENTICACIÓN ===

    def test_set_password(self, app):
        """Test: Establecer contraseña genera hash válido"""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                nombre_completo='Test User'
            )
            user.set_password('mypassword123')

            assert user.password_hash is not None
            assert len(user.password_hash) > 0
            assert user.password_hash != 'mypassword123'  # No almacena en texto plano

    def test_set_password_muy_corta(self, app):
        """Test: Contraseña muy corta debe fallar"""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                nombre_completo='Test User'
            )

            with pytest.raises(ValueError, match='al menos 6 caracteres'):
                user.set_password('123')

    def test_check_password_correcta(self, app):
        """Test: Verificar contraseña correcta"""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                nombre_completo='Test User'
            )
            user.set_password('correctpassword')

            assert user.check_password('correctpassword') is True

    def test_check_password_incorrecta(self, app):
        """Test: Verificar contraseña incorrecta"""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                nombre_completo='Test User'
            )
            user.set_password('correctpassword')

            assert user.check_password('wrongpassword') is False

    def test_check_password_vacia(self, app):
        """Test: Verificar contraseña vacía"""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                nombre_completo='Test User'
            )
            user.set_password('correctpassword')

            assert user.check_password('') is False
            assert user.check_password(None) is False

    # === TESTS DE ROLES Y PERMISOS ===

    def test_es_admin(self, app):
        """Test: Verificar si usuario es admin"""
        with app.app_context():
            admin = User(
                username='admin',
                email='admin@example.com',
                nombre_completo='Admin User',
                rol='admin'
            )
            assert admin.es_admin() is True
            assert admin.es_vendedor() is False
            assert admin.es_bodeguero() is False

    def test_es_vendedor(self, app):
        """Test: Verificar si usuario es vendedor"""
        with app.app_context():
            vendedor = User(
                username='vendedor',
                email='vendedor@example.com',
                nombre_completo='Vendedor User',
                rol='vendedor'
            )
            assert vendedor.es_admin() is False
            assert vendedor.es_vendedor() is True
            assert vendedor.es_bodeguero() is False

    def test_es_bodeguero(self, app):
        """Test: Verificar si usuario es bodeguero"""
        with app.app_context():
            bodeguero = User(
                username='bodeguero',
                email='bodeguero@example.com',
                nombre_completo='Bodeguero User',
                rol='bodeguero'
            )
            assert bodeguero.es_admin() is False
            assert bodeguero.es_vendedor() is False
            assert bodeguero.es_bodeguero() is True

    def test_puede_acceder_admin(self, app):
        """Test: Admin puede acceder a todo"""
        with app.app_context():
            admin = User(
                username='admin',
                email='admin@example.com',
                nombre_completo='Admin User',
                rol='admin'
            )

            assert admin.puede_acceder('ventas') is True
            assert admin.puede_acceder('inventario') is True
            assert admin.puede_acceder('usuarios') is True
            assert admin.puede_acceder('reportes') is True
            assert admin.puede_acceder('cualquier_modulo') is True

    def test_puede_acceder_vendedor(self, app):
        """Test: Vendedor solo puede acceder a ventas"""
        with app.app_context():
            vendedor = User(
                username='vendedor',
                email='vendedor@example.com',
                nombre_completo='Vendedor User',
                rol='vendedor'
            )

            assert vendedor.puede_acceder('ventas') is True
            assert vendedor.puede_acceder('productos_consulta') is True
            assert vendedor.puede_acceder('inventario') is False
            assert vendedor.puede_acceder('usuarios') is False

    def test_puede_acceder_bodeguero(self, app):
        """Test: Bodeguero solo puede acceder a inventario"""
        with app.app_context():
            bodeguero = User(
                username='bodeguero',
                email='bodeguero@example.com',
                nombre_completo='Bodeguero User',
                rol='bodeguero'
            )

            assert bodeguero.puede_acceder('inventario') is True
            assert bodeguero.puede_acceder('productos') is True
            assert bodeguero.puede_acceder('lotes') is True
            assert bodeguero.puede_acceder('alertas') is True
            assert bodeguero.puede_acceder('ventas') is False
            assert bodeguero.puede_acceder('usuarios') is False

    def test_puede_acceder_usuario_inactivo(self, app):
        """Test: Usuario inactivo no puede acceder"""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                nombre_completo='Test User',
                activo=False
            )

            assert user.puede_acceder('ventas') is False
            assert user.puede_acceder('inventario') is False

    # === TESTS DE BLOQUEO Y SEGURIDAD ===

    def test_esta_bloqueado_no_bloqueado(self, app):
        """Test: Usuario no bloqueado"""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                nombre_completo='Test User'
            )

            assert user.esta_bloqueado() is False

    def test_bloquear_usuario(self, app):
        """Test: Bloquear usuario temporalmente"""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                nombre_completo='Test User'
            )
            user.set_password('password123')

            user.bloquear(minutos=30)

            assert user.bloqueado_hasta is not None
            assert user.activo is False
            assert user.esta_bloqueado() is True

    def test_desbloquear_usuario(self, app):
        """Test: Desbloquear usuario"""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                nombre_completo='Test User'
            )
            user.set_password('password123')

            user.bloquear(minutos=30)
            assert user.esta_bloqueado() is True

            user.desbloquear()
            assert user.esta_bloqueado() is False
            assert user.bloqueado_hasta is None
            assert user.intentos_login_fallidos == 0
            assert user.activo is True

    def test_registrar_acceso(self, app):
        """Test: Registrar acceso actualiza ultimo_acceso"""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                nombre_completo='Test User'
            )
            user.set_password('password123')

            assert user.ultimo_acceso is None

            user.registrar_acceso()

            assert user.ultimo_acceso is not None
            assert user.intentos_login_fallidos == 0

    def test_incrementar_intentos_fallidos(self, app):
        """Test: Incrementar intentos fallidos"""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                nombre_completo='Test User'
            )
            user.set_password('password123')

            assert user.intentos_login_fallidos == 0

            user.incrementar_intentos_fallidos()
            assert user.intentos_login_fallidos == 1

            user.incrementar_intentos_fallidos()
            assert user.intentos_login_fallidos == 2

    def test_bloqueo_automatico_tras_5_intentos(self, app):
        """Test: Usuario se bloquea automáticamente tras 5 intentos fallidos"""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                nombre_completo='Test User'
            )
            user.set_password('password123')

            # 4 intentos - no debe bloquear
            for i in range(4):
                user.incrementar_intentos_fallidos()

            assert user.intentos_login_fallidos == 4
            assert user.esta_bloqueado() is False

            # 5to intento - debe bloquear
            user.incrementar_intentos_fallidos()

            assert user.intentos_login_fallidos == 5
            assert user.esta_bloqueado() is True
            assert user.bloqueado_hasta is not None
            assert user.activo is False

    def test_resetear_intentos(self, app):
        """Test: Resetear intentos fallidos"""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                nombre_completo='Test User'
            )
            user.set_password('password123')

            user.incrementar_intentos_fallidos()
            user.incrementar_intentos_fallidos()
            assert user.intentos_login_fallidos == 2

            user.resetear_intentos()
            assert user.intentos_login_fallidos == 0

    def test_puede_acceder_usuario_bloqueado(self, app):
        """Test: Usuario bloqueado no puede acceder"""
        with app.app_context():
            admin = User(
                username='admin',
                email='admin@example.com',
                nombre_completo='Admin User',
                rol='admin'
            )
            admin.bloquear(minutos=30)

            # Aunque sea admin, si está bloqueado no puede acceder
            assert admin.puede_acceder('usuarios') is False
            assert admin.puede_acceder('ventas') is False

    # === TESTS DE SERIALIZACIÓN ===

    def test_to_dict_basico(self, app):
        """Test: Convertir usuario a diccionario sin datos sensibles"""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                nombre_completo='Test User',
                telefono='0987654321',
                rol='vendedor'
            )
            user.set_password('password123')

            data = user.to_dict()

            assert 'id' in data
            assert data['username'] == 'testuser'
            assert data['email'] == 'test@example.com'
            assert data['nombre_completo'] == 'Test User'
            assert data['telefono'] == '0987654321'
            assert data['rol'] == 'vendedor'
            assert data['activo'] is True

            # No debe incluir datos sensibles
            assert 'password_hash' not in data
            assert 'intentos_login_fallidos' not in data
            assert 'bloqueado_hasta' not in data

    def test_to_dict_con_datos_sensibles(self, app):
        """Test: Convertir usuario a diccionario con datos sensibles"""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                nombre_completo='Test User'
            )
            user.set_password('password123')
            user.incrementar_intentos_fallidos()

            data = user.to_dict(include_sensitive=True)

            # Debe incluir datos sensibles
            assert 'intentos_login_fallidos' in data
            assert data['intentos_login_fallidos'] == 1
            assert 'bloqueado_hasta' in data
            assert 'esta_bloqueado' in data

            # Nunca debe incluir password_hash
            assert 'password_hash' not in data

    # === TESTS DE BÚSQUEDA ===

    def test_buscar_por_username(self, app):
        """Test: Buscar usuario por username"""
        with app.app_context():
            user = User(
                username='findme',
                email='findme@example.com',
                nombre_completo='Find Me'
            )
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()

            found = User.buscar_por_username('findme')

            assert found is not None
            assert found.username == 'findme'
            assert found.email == 'findme@example.com'

    def test_buscar_por_username_no_existe(self, app):
        """Test: Buscar usuario por username que no existe"""
        with app.app_context():
            found = User.buscar_por_username('noexiste')
            assert found is None

    def test_buscar_por_email(self, app):
        """Test: Buscar usuario por email"""
        with app.app_context():
            user = User(
                username='testuser',
                email='findbyme@example.com',
                nombre_completo='Test User'
            )
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()

            found = User.buscar_por_email('findbyme@example.com')

            assert found is not None
            assert found.email == 'findbyme@example.com'

    def test_buscar_por_email_case_insensitive(self, app):
        """Test: Buscar email es case-insensitive"""
        with app.app_context():
            user = User(
                username='testuser',
                email='Test@Example.com',
                nombre_completo='Test User'
            )
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()

            found = User.buscar_por_email('TEST@EXAMPLE.COM')

            assert found is not None
            assert found.email == 'test@example.com'

    def test_usuarios_activos(self, app):
        """Test: Buscar usuarios activos"""
        with app.app_context():
            user1 = User(
                username='activo1',
                email='activo1@example.com',
                nombre_completo='Activo 1',
                activo=True
            )
            user1.set_password('password123')

            user2 = User(
                username='inactivo',
                email='inactivo@example.com',
                nombre_completo='Inactivo',
                activo=False
            )
            user2.set_password('password123')

            db.session.add_all([user1, user2])
            db.session.commit()

            activos = User.usuarios_activos()
            usernames = [u.username for u in activos]

            assert 'activo1' in usernames
            assert 'inactivo' not in usernames

    def test_usuarios_por_rol(self, app):
        """Test: Buscar usuarios por rol"""
        with app.app_context():
            admin = User(
                username='admin',
                email='admin@example.com',
                nombre_completo='Admin',
                rol='admin'
            )
            admin.set_password('password123')

            vendedor = User(
                username='vendedor',
                email='vendedor@example.com',
                nombre_completo='Vendedor',
                rol='vendedor'
            )
            vendedor.set_password('password123')

            db.session.add_all([admin, vendedor])
            db.session.commit()

            admins = User.usuarios_por_rol('admin')
            assert len(admins) >= 1
            assert any(u.username == 'admin' for u in admins)

    def test_admins_vendedores_bodegueros(self, app):
        """Test: Shortcuts para buscar por rol"""
        with app.app_context():
            admin = User(
                username='admin',
                email='admin@example.com',
                nombre_completo='Admin',
                rol='admin'
            )
            admin.set_password('password123')

            vendedor = User(
                username='vendedor',
                email='vendedor@example.com',
                nombre_completo='Vendedor',
                rol='vendedor'
            )
            vendedor.set_password('password123')

            bodeguero = User(
                username='bodeguero',
                email='bodeguero@example.com',
                nombre_completo='Bodeguero',
                rol='bodeguero'
            )
            bodeguero.set_password('password123')

            db.session.add_all([admin, vendedor, bodeguero])
            db.session.commit()

            assert len(User.admins()) >= 1
            assert len(User.vendedores()) >= 1
            assert len(User.bodegueros()) >= 1

    def test_buscar_bloqueados(self, app):
        """Test: Buscar usuarios bloqueados"""
        with app.app_context():
            user1 = User(
                username='bloqueado',
                email='bloqueado@example.com',
                nombre_completo='Bloqueado'
            )
            user1.set_password('password123')
            user1.bloquear(minutos=30)

            user2 = User(
                username='libre',
                email='libre@example.com',
                nombre_completo='Libre'
            )
            user2.set_password('password123')

            db.session.add_all([user1, user2])
            db.session.commit()

            bloqueados = User.buscar_bloqueados()
            usernames = [u.username for u in bloqueados]

            assert 'bloqueado' in usernames
            assert 'libre' not in usernames

    # === TESTS DE REPRESENTACIÓN ===

    def test_repr(self, app):
        """Test: Representación __repr__"""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                nombre_completo='Test User',
                rol='vendedor'
            )

            assert repr(user) == '<User testuser (vendedor)>'

    def test_str(self, app):
        """Test: Representación __str__"""
        with app.app_context():
            user = User(
                username='testuser',
                email='test@example.com',
                nombre_completo='Test User',
                rol='vendedor'
            )

            assert str(user) == 'Test User (@testuser) - vendedor'
