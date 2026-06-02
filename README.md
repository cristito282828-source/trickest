# 🛹 Trickest Skate Platform

Plataforma de challenges de skateboarding con sistema de evaluación, comentarios en spots, y economía fantasy (en desarrollo).

---

## 🚀 **Características Principales**

### **Core Features**
- ✅ **Sistema de Challenges** - 10 niveles + bonus challenge
- ✅ **Submission System** - Upload de videos a YouTube para evaluación
- ✅ **Judge Evaluation** - Jueces evalúan submissions con score 0-100
- ✅ **User Profiles** - Perfiles completos de skaters con redes sociales
- ✅ **Spot System** - Mapa de spots con validación social
- ✅ **Comments & Replies** - Hilos de comentarios en spots
- ✅ **Notifications** - Sistema de notificaciones para actividad
- ✅ **Teams** - Sistema de equipos de skaters

### **Coming Soon** (ver [ROADMAP.md](docs/ROADMAP.md))
- 🔄 **SkateCoins** - Economía virtual del sistema
- 🔄 **Fantasy Teams** - Mercado de skaters
- 🔄 **AI Judge** - Análisis de videos con GLM-4V
- 🔄 **Leaderboards** - Rankings globales

---

## 🛠️ **Tech Stack**

### **Frontend**
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + NextUI
- **State:** React Server Components + Client Components
- **Auth:** NextAuth.js v4 (Google OAuth + Credentials)

### **Backend**
- **API:** Next.js API Routes
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Session:** JWT with NextAuth

### **Infraestructura**
- **Deployment:** Vercel
- **Database:** Supabase (PostgreSQL + Connection Pooling)
- **Storage:** YouTube (videos)

---

## 📋 **Requisitos Previos**

- Node.js 18+
- npm/yarn/pnpm/bun
- Cuenta de Google Cloud (para OAuth)
- Cuenta de Supabase
- Cuenta de YouTube (para videos)

---

## 🚦 **Quick Start**

### **1. Clonar e Instalar Dependencias**

```bash
# Clonar repositorio
git clone <repo-url>
cd trickest-next

# Instalar dependencias
npm install
# o
bun install
```

### **2. Configurar Variables de Entorno**

```bash
# Copiar .env.example a .env
cp .env.example .env

# Editar .env con tus credenciales:
```

Variables requeridas (ver [`.env.example`](.env.example)):
- `NEXTAUTH_URL` - URL de la aplicación
- `NEXTAUTH_SECRET` - Secreto para JWT
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Secret
- `DATABASE_URL` - Supabase connection string (port 6543)
- `DIRECT_URL` - Supabase direct connection (port 5432)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `NEXT_PUBLIC_BACKEND_URL` - Backend API URL

### **3. Configurar Base de Datos**

```bash
# Generar Prisma Client
npx prisma generate

# Hacer push del schema a la BD
npx prisma db push

# (Opcional) Seed de datos de prueba
npm run seed
```

### **4. Ejecutar Servidor de Desarrollo**

```bash
# Opción 1: npm
npm run dev

# Opción 2: bun (más rápido)
bun run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## 📁 **Estructura del Proyecto**

```
trickest-next/
├── docs/                    # Documentación
│   ├── DESIGN_SYSTEM.md    # Guía de estilos
│   ├── ROADMAP.md          # Roadmap del proyecto
│   ├── SKATEWORLD-IMPLEMENTACION-V2.md  # Economía Fantasy
│   ├── JUDGE_AI_COMPARISON.md          # Juez Virtual AI
│   └── BUTTON_STYLES.md    # Estilos de botones
├── scripts/                 # Scripts utilitarios
│   ├── test/              # Scripts de prueba
│   ├── check-tables.js    # Verificar tablas BD
│   └── analyze-existing-submissions.js  # Analizador AI
├── lib/                    # Librerías compartidas
│   ├── auth.ts            # Configuración NextAuth
│   ├── auth-helpers.ts    # Helpers de autenticación
│   ├── prisma.ts          # Singleton Prisma Client
│   └── validation.ts      # Utilidades de validación
├── prisma/
│   └── schema.prisma      # Esquema de base de datos
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (routes)/     # Rutas agrupadas
│   │   │   ├── dashboard/  # Dashboards
│   │   │   ├── spots/      # Páginas de spots
│   │   │   └── profile/    # Perfil de usuario
│   │   ├── api/           # API Routes
│   │   └── layout.tsx     # Layout raíz
│   ├── components/        # Componentes React
│   │   ├── atoms/         # Elementos básicos
│   │   ├── molecules/     # Combinaciones simples
│   │   └── organisms/     # Secciones complejas
│   └── lib/              # Librerías cliente
├── public/                # Archivos estáticos
└── .env.example          # Template de variables de entorno
```

---

## 🗄️ **Modelos de Base de Datos Principales**

### **User**
- Usuarios con 3 roles: `skater`, `judge`, `admin`
- Autenticación vía Google OAuth o email/password
- Perfiles con datos personales, redes sociales, y preferencias de skate

### **Challenge**
- 11 niveles: 1-10 + 1 bonus
- Cada challenge tiene nombre, descripción, video demo, y puntos
- Skaters suben videos para completar challenges

### **Submission**
- Videos de skaters completando challenges
- Status: `pending` → `approved`/`rejected`
- Score 0-100 otorgado por jueces
- Sistema de votación comunitaria

### **Spot**
- Spots de skate (skateparks, spots street, skateshops)
- Sistema de validación social (confidence score)
- Comentarios y check-ins
- Ubicaciones con coordenadas GPS

### **Team**
- Equipos de skaters (máx 5 miembros)
- Dueño puede invitar skaters
- Sistema de rankings

### **Notification**
- Tipos: `comment_reply`, `team_invitation`, `submission_evaluated`, etc.
- Link directos a la acción relevante
- Metadata JSON para datos extra

---

## 🔐 **Sistema de Autenticación**

### **Proveedores Disponibles**
1. **Google OAuth** - Login con cuenta de Google
2. **Credentials** - Email + contraseña (opcional)

### **Flujo de Registro**
1. Usuario se registra con Google
2. Cuenta se crea con `profileStatus: 'basic'`
3. Modal guía a completar perfil:
   - SetPasswordModal
   - SkateProfileCompletionModal
   - WelcomeModal
4. Estado final: `profileStatus: 'complete'`

### **Roles y Permisos**
- **skater** - Puede submitir tricks, ver challenges
- **judge** - Puede evaluar submissions, todo lo de skater
- **admin** - Todo el acceso + gestión del sistema

---

## 📱 **Páginas Principales**

### **Públicas**
- `/` - Landing page
- `/spots` - Mapa de spots
- `/spots?spot=X` - Ver spot individual
- `/profile/[username]` - Perfiles públicos de skaters

### **Dashboard (requieren auth)**
- `/dashboard` - Dashboard según rol
- `/dashboard/skaters` - Skaters: ver challenges, submissions
- `/dashboard/judges` - Jueces: evaluar submissions pendientes
- `/dashboard/jueces` - (legacy, same as judges)

---

## 🧪 **Testing**

### **Verificar Conexión a BD**
```bash
node scripts/check-tables.js
```

### **Verificar Usuario**
```bash
node scripts/test/test-db-user.js
```

### **Seed de Datos**
```bash
npm run seed
```

Crea usuarios de prueba:
- **Admin:** admin@trickest.com (pass: password123)
- **Jueces:** judge1-3@trickest.com (pass: password123)
- **11 Challenges** (levels 1-10 + bonus)

---

## 🚀 **Deploy**

### **Vercel (Recomendado)**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### **Variables de Entorno en Vercel**
Configurar en el dashboard de Vercel:
- Todas las variables de `.env.example`
- Asegurar `DATABASE_URL` use port 6543 (pgbouncer)
- Configurar `NEXTAUTH_URL` con el dominio de Vercel

---

## 📚 **Documentación Adicional**

- **[CLAUDE.md](CLAUDE.md)** - Guía completa para desarrollo con Claude Code
- **[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)** - Sistema de diseño visual
- **[docs/ROADMAP.md](docs/ROADMAP.md)** - Roadmap del proyecto
- **[docs/SKATEWORLD-IMPLEMENTACION-V2.md](docs/SKATEWORLD-IMPLEMENTACION-V2.md)** - Economía Fantasy (próximo feature)
- **[docs/JUDGE_AI_COMPARISON.md](docs/JUDGE_AI_COMPARISON.md)** - Sistema de juez AI

---

## 🐛 **Troubleshooting**

### **Problema: Error de conexión a BD**
```bash
# Verificar que Prisma Client esté generado
npx prisma generate

# Verificar conexión
node scripts/check-tables.js
```

### **Problema: Auth no funciona**
```bash
# Verificar variables de entorno
cat .env | grep NEXTAUTH

# Asegurar NEXTAUTH_URL esté correcta
# Local: http://localhost:3000
# Prod: https://tu-dominio.com
```

### **Problema: Videos no se reproducen**
- Verificar que el dominio de YouTube esté en `next.config.mjs`
- Revisar configuración de `image.domains`

---

## 🤝 **Contribuir**

Este es un proyecto privado. Para contribuir:

1. Fork el repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Add nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

---

## 📄 **Licencia**

Propiedad privada. Todos los derechos reservados.

---

## 👥 **Equipo**

- **Desarrollo:** Trickest Team
- **Tecnología:** Next.js, Prisma, Supabase, NextAuth

---

**Made with ❤️ for the skate community**

🛹 **Happy Shredding!**
