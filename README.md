# Gestor de Tareas API

API REST para gestión de tareas con autenticación JWT, construida con NestJS 11, Prisma 7 y PostgreSQL.

## Descripción

Backend educativo que demuestra arquitectura completa de una API REST con:

- **Autenticación JWT** con access tokens y refresh tokens
- **Control de acceso** basado en roles (USUARIO / ADMIN)
- **Gestión de tareas** con ownership (cada usuario ve sus tareas)
- **Swagger UI** para documentación interactiva
- **Docker** para containerización
- **Seguridad** con Helmet, validación de inputs y hashing de passwords

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Framework | NestJS 11 |
| Language | TypeScript 5.7 (ES2023) |
| ORM | Prisma 7 (driver adapter: `@prisma/adapter-pg`) |
| Database | PostgreSQL |
| Auth | Passport + JWT (`@nestjs/jwt` + `passport-jwt`) |
| Passwords | bcryptjs (cost=10) |
| Validation | class-validator + class-transformer |
| Docs | Swagger (`@nestjs/swagger` 11) |
| Security | Helmet |
| Config | `@nestjs/config` + Joi validation |
| Package manager | pnpm |
| Container | Docker (node:22-slim) |
| Testing | Jest 30 + Supertest |

## Inicio rápido

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd gestor-tareas
pnpm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de PostgreSQL y generar secrets JWT:

```bash
# Generar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generar JWT_REFRESH_SECRET (otro valor diferente)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Configurar base de datos

```bash
# Crear migración inicial
pnpm prisma migrate dev --name init

# Generar Prisma Client
pnpm prisma generate
```

### 4. Ejecutar

```bash
# Desarrollo con hot-reload
pnpm run start:dev

# Producción
pnpm run build
pnpm run start:prod
```

### 5. Swagger UI

Abrir en el navegador:

```
http://localhost:3000/api/docs
```

## Estructura del proyecto

```
gestor-tareas/
├── prisma/
│   ├── schema.prisma              # 3 modelos, 3 enums
│   └── migrations/
├── src/
│   ├── main.ts                    # Bootstrap + middleware
│   ├── app.module.ts              # Root module
│   ├── app.controller.ts          # Health check
│   ├── config/
│   │   ├── configuration.ts       # Centralized config
│   │   └── validation.ts          # Joi schema
│   ├── prisma/
│   │   ├── prisma.module.ts       # Global
│   │   └── prisma.service.ts      # PrismaPg adapter
│   ├── auth/
│   │   ├── auth.module.ts         # JWT + Passport
│   │   ├── auth.service.ts        # register/login/refresh/logout
│   │   ├── auth.controller.ts     # POST /auth/*
│   │   ├── jwt.strategy.ts        # Validate JWT + DB lookup
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       ├── login.dto.ts
│   │       └── refresh-token.dto.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.service.ts       # CRUD + updateRole
│   │   ├── users.controller.ts    # /usuarios/*
│   │   └── dto/
│   │       └── update-user.dto.ts # UpdateUserDto + UpdateRoleDto
│   ├── tasks/
│   │   ├── tasks.module.ts
│   │   ├── tasks.service.ts       # CRUD + stats + owner checks
│   │   ├── tasks.controller.ts    # /tareas/*
│   │   └── dto/
│   │       └── task.dto.ts        # Create + Update + Filter DTOs
│   ├── common/
│   │   └── filters/
│   │       └── http-exception.filter.ts
│   └── generated/
│       └── prisma/                # Auto-generated (CJS)
├── Dockerfile
├── .dockerignore
├── .env.example
├── prisma7.config.ts
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## Base de datos

### Modelos

#### Usuario
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Int PK | Auto-increment |
| nombre | String | Nombre del usuario |
| email | String (unique) | Email del usuario |
| password | String | Hash bcrypt |
| rol | Rol (default: USUARIO) | USUARIO o ADMIN |
| creadoEn | DateTime | Fecha de creación |

#### Tarea
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Int PK | Auto-increment |
| titulo | String | Título de la tarea |
| descripcion | String? | Descripción opcional |
| estado | EstadoTarea (default: PENDIENTE) | PENDIENTE, EN_PROGRESO, COMPLETADA |
| prioridad | Prioridad (default: MEDIA) | BAJA, MEDIA, ALTA |
| usuarioId | Int FK | Dueño de la tarea |
| creadoEn | DateTime | Fecha de creación |

#### RefreshToken
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Int PK | Auto-increment |
| token | String (unique) | JWT refresh token |
| usuarioId | Int FK | Usuario asociado |
| expiraEn | DateTime | Fecha de expiración |
| creadoEn | DateTime | Fecha de creación |

### Enums

```
Rol:          USUARIO | ADMIN
EstadoTarea:  PENDIENTE | EN_PROGRESO | COMPLETADA
Prioridad:    BAJA | MEDIA | ALTA
```

## API Endpoints

### Autenticación (sin JWT)

| Método | Ruta | Body | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | `{ email, password, nombre? }` | Registrar usuario |
| POST | `/api/auth/login` | `{ email, password }` | Iniciar sesión |
| POST | `/api/auth/refresh` | `{ refreshToken }` | Renovar access token |
| POST | `/api/auth/logout` | `{ refreshToken }` | Cerrar sesión |

### Usuarios (requiere JWT)

| Método | Ruta | Body | Restricción | Descripción |
|--------|------|------|-------------|-------------|
| GET | `/api/usuarios` | — | ADMIN | Listar todos los usuarios |
| GET | `/api/usuarios/:id` | — | Cualquiera | Obtener usuario por ID |
| PUT | `/api/usuarios/:id` | `{ nombre?, email? }` | Propios o ADMIN | Actualizar perfil |
| PATCH | `/api/usuarios/:id/rol` | `{ rol: "ADMIN" \| "USUARIO" }` | ADMIN | Cambiar rol |
| PUT | `/api/usuarios/:id/password` | `{ currentPassword, newPassword }` | Propios | Cambiar contraseña |
| DELETE | `/api/usuarios/:id` | — | ADMIN | Eliminar usuario |

### Tareas (requiere JWT)

| Método | Ruta | Query/Body | Restricción | Descripción |
|--------|------|------------|-------------|-------------|
| POST | `/api/tareas` | `{ titulo, descripcion?, estado?, prioridad? }` | Autenticado | Crear tarea |
| GET | `/api/tareas` | `?estado=&prioridad=` | Propias (o todas si ADMIN) | Listar tareas |
| GET | `/api/tareas/stats` | — | Propias (o todas si ADMIN) | Estadísticas |
| GET | `/api/tareas/:id` | — | Propia o ADMIN | Obtener tarea |
| PUT | `/api/tareas/:id` | `{ titulo?, descripcion?, estado?, prioridad? }` | Propia o ADMIN | Actualizar tarea |
| DELETE | `/api/tareas/:id` | — | Propia o ADMIN | Eliminar tarea |

### Otros

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/api/docs` | Swagger UI |

## Flujo de autenticación

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Registro   │     │    Login     │     │    Logout    │
│ POST /auth/  │     │ POST /auth/  │     │ POST /auth/  │
│   register   │     │    login     │     │    logout    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       ▼                    ▼                    ▼
  ┌─────────┐         ┌─────────┐         ┌─────────┐
  │ bcrypt  │         │ bcrypt  │         │ Delete  │
  │  hash   │         │ compare │         │ refresh │
  └────┬────┘         └────┬────┘         │  token  │
       │                   │              │   DB    │
       ▼                   ▼              └─────────┘
  ┌─────────────────────────────┐
  │   generateTokens()          │
  │   ├── accessToken (1h)      │
  │   └── refreshToken (24h)    │
  │       └── storeRefreshToken │
  │           (DB + expiración) │
  └─────────────────────────────┘
```

### Uso del token

```
1. Login → devuelve { accessToken, refreshToken }

2. Usar accessToken en headers:
   Authorization: Bearer <accessToken>

3. Cuando expira (1h):
   POST /api/auth/refresh
   Body: { refreshToken }
   → devuelve nuevos tokens

4. Logout:
   POST /api/auth/logout
   Body: { refreshToken }
   → invalida el refresh token en DB
```

## Seguridad

| Capa | Mecanismo |
|------|-----------|
| Transporte | Helmet (XSS, clickjacking, MIME sniffing) |
| CORS | Orígenes permitidos desde `.env` |
| Input | ValidationPipe (whitelist + transform) |
| Auth | JWT con access token (1h) + refresh token (24h) |
| Passwords | bcrypt cost=10 |
| Authorization | RolesGuard con `@Roles(Rol.ADMIN)` |
| Owner checks | Servicios validan `usuarioId` vs `currentUser.id` |
| Error handling | HttpExceptionFilter (formato consistente) |
| Secrets | Solo desde `.env` (nunca hardcoded) |
| Refresh tokens | Rotación + almacenamiento en DB + invalidación en logout |

## Docker

### Construir imagen

```bash
docker build -t gestor-tareas .
```

### Ejecutar contenedor

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
  -e JWT_SECRET="tu-clave-secreta-min-16-chars" \
  -e JWT_REFRESH_SECRET="otra-clave-secreta-min-16" \
  gestor-tareas
```

### Docker Compose (opcional)

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/nest_tareas
      - JWT_SECRET=tu-clave-secreta
      - JWT_REFRESH_SECRET=otra-clave-secreta
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=nest_tareas
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

## Scripts disponibles

```bash
pnpm install              # Instalar dependencias
pnpm run start:dev        # Desarrollo con hot-reload
pnpm run build            # Compilar a dist/
pnpm run start:prod       # Ejecutar en producción
pnpm run lint             # Lint + prettier --fix
pnpm run format           # Prettier en src/ y test/
pnpm run test             # Tests unitarios
pnpm run test:e2e         # Tests e2e
pnpm run test:cov         # Reporte de cobertura
pnpm prisma generate      # Regenerar Prisma Client
pnpm prisma migrate dev   # Crear/aplicar migraciones
pnpm prisma studio        # Abrir Prisma Studio (GUI de DB)
```

## Variables de entorno

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | URL de conexión PostgreSQL |
| `JWT_SECRET` | ✅ | — | Secret para access tokens (min 16 chars) |
| `JWT_REFRESH_SECRET` | ✅ | — | Secret para refresh tokens (min 16 chars) |
| `JWT_EXPIRATION` | ❌ | `1h` | Duración del access token |
| `JWT_REFRESH_EXPIRATION` | ❌ | `24h` | Duración del refresh token |
| `PORT` | ❌ | `3000` | Puerto del servidor |
| `ALLOWED_ORIGINS` | ❌ | `*` | Orígenes CORS permitidos (separados por coma) |

## Licencia

MIT
