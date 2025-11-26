"""
Modelo User para KATITA-POS

Define la estructura de usuarios del sistema con autenticación y roles.
Incluye seguridad con bcrypt, bloqueo por intentos fallidos, y sistema de permisos.
"""

from datetime import datetime, timezone, timedelta
from decimal import Decimal
import re
import bcrypt
from sqlalchemy import (
    Index, CheckConstraint, String, Integer,
    Boolean, DateTime, Text
)
from sqlalchemy.orm import validates
from app import db

# Zona horaria de Perú (UTC-5)
PERU_TZ = timezone(timedelta(hours=-5))


class User(db.Model):
    """
    Modelo para usuarios del sistema KATITA-POS

    Gestiona autenticación, autorización, roles y seguridad de usuarios.
    Incluye sistema de bloqueo automático por intentos fallidos.

    Roles disponibles:
    - admin: Acceso completo al sistema
    - vendedor: Solo módulo de ventas (POS)
    - bodeguero: Solo módulo de inventario
    """

    __tablename__ = 'users'

    # === CAMPOS ===

    id = db.Column(Integer, primary_key=True, autoincrement=True)

    # Credenciales
    username = db.Column(String(80), unique=True, nullable=False, index=True)
    email = db.Column(String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(String(255), nullable=False)

    # Información personal
    nombre_completo = db.Column(String(200), nullable=False)
    telefono = db.Column(String(20), nullable=True)

    # Horarios de trabajo (solo para vendedores)
    hora_entrada = db.Column(String(5), nullable=True)  # Formato: "07:00"
    hora_salida = db.Column(String(5), nullable=True)    # Formato: "14:00"
    dias_trabajo = db.Column(String(50), nullable=True)  # Formato: "Lun-Vie" o "Lun,Mie,Vie"

    # Rol y estado
    rol = db.Column(String(20), nullable=False, default='vendedor', index=True)
    activo = db.Column(Boolean, default=True, nullable=False, index=True)

    # Seguridad y acceso
    ultimo_acceso = db.Column(DateTime, nullable=True)
    intentos_login_fallidos = db.Column(Integer, default=0, nullable=False)
    bloqueado_hasta = db.Column(DateTime, nullable=True)

    # Timestamps
    created_at = db.Column(
        DateTime,
        default=lambda: datetime.now(PERU_TZ),
        nullable=False
    )
    updated_at = db.Column(
        DateTime,
        default=lambda: datetime.now(PERU_TZ),
        onupdate=lambda: datetime.now(PERU_TZ),
        nullable=False
    )

    # === RELACIONES ===
    # ventas: relationship con Venta (se definirá en modelo Venta)
    # movimientos: relationship con MovimientoStock (se definirá en modelo MovimientoStock)

    # === CONSTRAINTS ===

    __table_args__ = (
        CheckConstraint(
            "rol IN ('admin', 'vendedor', 'bodeguero')",
            name='check_rol_valido'
        ),
        CheckConstraint(
            'intentos_login_fallidos >= 0',
            name='check_intentos_no_negativos'
        ),
        Index('idx_rol_activo', 'rol', 'activo'),  # Índice compuesto
    )

    # === CONSTRUCTOR ===

    def __init__(self, **kwargs):
        """
        Constructor del modelo User

        Inicializa valores por defecto y valida datos críticos.

        Args:
            **kwargs: Argumentos del usuario
        """
        super(User, self).__init__(**kwargs)

        # Establecer valores por defecto explícitamente
        if self.activo is None:
            self.activo = True

        if self.rol is None:
            self.rol = 'vendedor'

        if self.intentos_login_fallidos is None:
            self.intentos_login_fallidos = 0

    # === VALIDACIONES AUTOMÁTICAS ===

    @validates('username')
    def validate_username(self, key, username):
        """Valida que el username sea alfanumérico y tenga longitud válida"""
        if not username or len(username.strip()) == 0:
            raise ValueError('El nombre de usuario es requerido')

        username = username.strip()

        if len(username) < 3:
            raise ValueError('El nombre de usuario debe tener al menos 3 caracteres')

        if len(username) > 80:
            raise ValueError('El nombre de usuario no puede tener más de 80 caracteres')

        # Validar que sea alfanumérico (letras, números, guiones y guiones bajos)
        if not re.match(r'^[a-zA-Z0-9_-]+$', username):
            raise ValueError('El nombre de usuario solo puede contener letras, números, guiones y guiones bajos')

        return username

    @validates('email')
    def validate_email(self, key, email):
        """Valida que el email tenga formato válido"""
        if not email or len(email.strip()) == 0:
            raise ValueError('El email es requerido')

        email = email.strip().lower()

        # Regex para validar formato de email
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            raise ValueError('El formato del email no es válido')

        return email

    @validates('nombre_completo')
    def validate_nombre_completo(self, key, nombre_completo):
        """Valida que el nombre completo no esté vacío"""
        if not nombre_completo or len(nombre_completo.strip()) == 0:
            raise ValueError('El nombre completo es requerido')

        if len(nombre_completo.strip()) > 200:
            raise ValueError('El nombre completo no puede tener más de 200 caracteres')

        return nombre_completo.strip()

    @validates('rol')
    def validate_rol(self, key, rol):
        """Valida que el rol sea uno de los valores permitidos"""
        roles_validos = ['admin', 'vendedor', 'bodeguero']

        if not rol or rol not in roles_validos:
            raise ValueError(f'El rol debe ser uno de: {", ".join(roles_validos)}')

        return rol

    @validates('intentos_login_fallidos')
    def validate_intentos(self, key, intentos):
        """Valida que los intentos no sean negativos"""
        if intentos is not None and intentos < 0:
            raise ValueError('Los intentos de login no pueden ser negativos')

        return intentos

    # === MÉTODOS DE AUTENTICACIÓN ===

    def set_password(self, password):
        """
        Hashea y establece la contraseña del usuario

        Args:
            password (str): Contraseña en texto plano

        Raises:
            ValueError: Si la contraseña no cumple requisitos mínimos
        """
        if not password or len(password) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')

        # Generar salt y hashear password con bcrypt
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password):
        """
        Verifica si una contraseña coincide con el hash almacenado

        Args:
            password (str): Contraseña en texto plano

        Returns:
            bool: True si la contraseña es correcta, False en caso contrario
        """
        if not password or not self.password_hash:
            return False

        try:
            return bcrypt.checkpw(
                password.encode('utf-8'),
                self.password_hash.encode('utf-8')
            )
        except Exception:
            return False

    # === MÉTODOS DE ROLES Y PERMISOS ===

    def es_admin(self):
        """Verifica si el usuario es administrador"""
        return self.rol == 'admin'

    def es_vendedor(self):
        """Verifica si el usuario es vendedor"""
        return self.rol == 'vendedor'

    def es_bodeguero(self):
        """Verifica si el usuario es bodeguero"""
        return self.rol == 'bodeguero'

    def puede_acceder(self, modulo):
        """
        Verifica si el usuario tiene permiso para acceder a un módulo

        Args:
            modulo (str): Nombre del módulo ('ventas', 'inventario', 'usuarios', 'reportes', 'config')

        Returns:
            bool: True si tiene permiso, False en caso contrario
        """
        if not self.activo:
            return False

        if self.esta_bloqueado():
            return False

        # Admin tiene acceso a todo
        if self.es_admin():
            return True

        # Permisos por rol
        permisos = {
            'vendedor': ['ventas', 'productos_consulta'],
            'bodeguero': ['inventario', 'productos', 'lotes', 'alertas']
        }

        return modulo in permisos.get(self.rol, [])

    # === MÉTODOS DE BLOQUEO Y SEGURIDAD ===

    def esta_bloqueado(self):
        """
        Verifica si el usuario está bloqueado actualmente

        Returns:
            bool: True si está bloqueado, False en caso contrario
        """
        if not self.bloqueado_hasta:
            return False

        # Comparar con datetime aware
        ahora = datetime.now(PERU_TZ)
        bloqueado_hasta = self.bloqueado_hasta

        # Si bloqueado_hasta es naive, convertirlo a aware
        if bloqueado_hasta.tzinfo is None:
            bloqueado_hasta = bloqueado_hasta.replace(tzinfo=timezone.utc)

        return ahora < bloqueado_hasta

    def bloquear(self, minutos=30):
        """
        Bloquea el usuario temporalmente

        Args:
            minutos (int): Duración del bloqueo en minutos (default: 30)
        """
        self.bloqueado_hasta = datetime.now(PERU_TZ) + timedelta(minutes=minutos)
        self.activo = False

    def desbloquear(self):
        """Desbloquea el usuario y resetea intentos fallidos"""
        self.bloqueado_hasta = None
        self.intentos_login_fallidos = 0
        self.activo = True

    def registrar_acceso(self):
        """Actualiza la fecha y hora del último acceso"""
        self.ultimo_acceso = datetime.now(PERU_TZ)
        self.intentos_login_fallidos = 0  # Resetear intentos al login exitoso

    def incrementar_intentos_fallidos(self):
        """
        Incrementa el contador de intentos fallidos

        Si alcanza 5 intentos, bloquea el usuario por 30 minutos
        """
        self.intentos_login_fallidos += 1

        if self.intentos_login_fallidos >= 5:
            self.bloquear(minutos=30)

    def resetear_intentos(self):
        """Resetea el contador de intentos fallidos a 0"""
        self.intentos_login_fallidos = 0

    # === MÉTODOS DE SERIALIZACIÓN ===

    def to_dict(self, include_sensitive=False):
        """
        Convierte el usuario a diccionario

        Args:
            include_sensitive (bool): Si True, incluye datos sensibles (para admin)

        Returns:
            dict: Diccionario con los datos del usuario
        """
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'nombre_completo': self.nombre_completo,
            'telefono': self.telefono,
            'hora_entrada': self.hora_entrada,
            'hora_salida': self.hora_salida,
            'dias_trabajo': self.dias_trabajo,
            'rol': self.rol,
            'activo': self.activo,
            'ultimo_acceso': self.ultimo_acceso.isoformat() if self.ultimo_acceso else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

        # Solo incluir datos sensibles si se solicita explícitamente
        if include_sensitive:
            data.update({
                'intentos_login_fallidos': self.intentos_login_fallidos,
                'bloqueado_hasta': self.bloqueado_hasta.isoformat() if self.bloqueado_hasta else None,
                'esta_bloqueado': self.esta_bloqueado()
            })

        return data

    # === MÉTODOS DE BÚSQUEDA (CLASS METHODS) ===

    @classmethod
    def buscar_por_username(cls, username):
        """Busca un usuario por nombre de usuario"""
        return cls.query.filter_by(username=username).first()

    @classmethod
    def buscar_por_email(cls, email):
        """Busca un usuario por email"""
        return cls.query.filter_by(email=email.lower()).first()

    @classmethod
    def usuarios_activos(cls):
        """Retorna todos los usuarios activos"""
        return cls.query.filter_by(activo=True).all()

    @classmethod
    def usuarios_por_rol(cls, rol):
        """
        Busca usuarios por rol

        Args:
            rol (str): Rol a buscar ('admin', 'vendedor', 'bodeguero')

        Returns:
            list: Lista de usuarios con ese rol
        """
        return cls.query.filter_by(rol=rol).all()

    @classmethod
    def buscar_bloqueados(cls):
        """Retorna usuarios actualmente bloqueados"""
        ahora = datetime.now(PERU_TZ)
        return cls.query.filter(
            cls.bloqueado_hasta != None,
            cls.bloqueado_hasta > ahora
        ).all()

    @classmethod
    def admins(cls):
        """Retorna todos los administradores"""
        return cls.usuarios_por_rol('admin')

    @classmethod
    def vendedores(cls):
        """Retorna todos los vendedores"""
        return cls.usuarios_por_rol('vendedor')

    @classmethod
    def bodegueros(cls):
        """Retorna todos los bodegueros"""
        return cls.usuarios_por_rol('bodeguero')

    # === REPRESENTACIONES ===

    def __repr__(self):
        return f'<User {self.username} ({self.rol})>'

    def __str__(self):
        return f'{self.nombre_completo} (@{self.username}) - {self.rol}'
