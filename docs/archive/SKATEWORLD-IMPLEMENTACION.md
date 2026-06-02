# 🛹 SKATEWORLD: Guía de Implementación - Economía Fantasy + AI Scouting

> **Versión:** 1.0
> **Fecha:** 27 Enero 2026
> **Autor:** Claude + Usuario
> **Proyecto:** Trickest Skate Platform

---

## 📋 TABLA DE CONTENIDOS

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Esquema de Base de Datos](#esquema-de-base-de-datos)
4. [API Endpoints](#api-endpoints)
5. [Lógica de Negocio](#lógica-de-negocio)
6. [Implementación Paso a Paso](#implementación-paso-a-paso)
7. [AI Scouting con GLM](#ai-scouting-con-glm)
8. [Frontend - Nuevas Páginas](#frontend---nuevas-páginas)

---

## 🎯 VISIÓN GENERAL

**SkateWorld es una economía fantasy donde:**
- Los usuarios pueden comprar/vender skaters
- Cada skater tiene un precio basado en su desempeño
- Los usuarios crean "equipos fantasy" compitiendo por ser el más valioso
- Sistema de transacciones internas con SkateCoins (token virtual)
- AI Scouting analiza videos y descubre talento

**Modelo de negocio similar a:**
- Sorare (fútbol fantasy con NFTs)
- Fantasy Premier League
- pero sin blockchain inicialmente (centralizado)

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────┐
│                    TRICKEST PLATFORM                         │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  USUARIOS    │  │  SKATERS     │  │  CHALLENGES  │      │
│  │  (existente) │  │  (existente) │  │  (existente) │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │                │
│         └─────────────────┼─────────────────┘                │
│                           │                                  │
│         ┌─────────────────▼─────────────────┐               │
│         │     SKATEWORLD ECONOMY (NUEVO)     │               │
│         ├────────────────────────────────────┤               │
│         │  • Marketplace de skaters          │               │
│         │  • Sistema de SkateCoins           │               │
│         │  • Transferencias                  │               │
│         │  • Equipos Fantasy                 │               │
│         │  • Leaderboards                    │               │
│         └────────────────────────────────────┘               │
│                           │                                  │
│         ┌─────────────────▼─────────────────┐               │
│         │     AI SCOUTING (GLM)              │               │
│         │  • Análisis de videos              │               │
│         │  • Predicción de potencial         │               │
│         │  • Valuación automática            │               │
│         └────────────────────────────────────┘               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ ESQUEMA DE BASE DE DATOS

### **Nuevas Tablas (Agregar al schema existente)**

#### **1. `user_wallets` - Billeteras de usuarios**
```sql
CREATE TABLE user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) DEFAULT 100.00, -- 100 SKT gratis al inicio
  total_earned DECIMAL(10, 2) DEFAULT 0.00,
  total_spent DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_wallet_per_user UNIQUE (user_id)
);

CREATE INDEX idx_wallets_user ON user_wallets(user_id);
```

#### **2. `skaters_market` - Mercado de skaters**
```sql
CREATE TABLE skaters_market (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skater_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Usuario con role 'skater'
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL = free agent
  current_price DECIMAL(10, 2) NOT NULL, -- Precio actual en SKT
  base_value DECIMAL(10, 2) NOT NULL,    -- Valor base calculado
  for_sale BOOLEAN DEFAULT false,
  listing_price DECIMAL(10, 2),          -- Precio de venta (si está en venta)
  price_history JSONB DEFAULT '[]',      -- Historial de precios
  total_transfers INTEGER DEFAULT 0,     -- Veces transferido
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_skater_market UNIQUE (skater_id)
);

CREATE INDEX idx_market_skater ON skaters_market(skater_id);
CREATE INDEX idx_market_owner ON skaters_market(owner_id);
CREATE INDEX idx_market_for_sale ON skaters_market(for_sale) WHERE for_sale = true;
```

#### **3. `transactions` - Historial de transacciones**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skater_id UUID REFERENCES users(id) ON DELETE SET NULL,
  from_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL = sistema
  to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,   -- NULL = sistema
  amount DECIMAL(10, 2) NOT NULL,      -- Cantidad de SKT
  transaction_type VARCHAR(20) NOT NULL, -- 'buy', 'sell', 'reward', 'bonus', 'penalty'
  metadata JSONB DEFAULT '{}',          -- Datos extra
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_transaction_type CHECK (
    transaction_type IN ('buy', 'sell', 'reward', 'bonus', 'penalty', 'scouting', 'transfer')
  )
);

CREATE INDEX idx_transactions_from ON transactions(from_user_id);
CREATE INDEX idx_transactions_to ON transactions(to_user_id);
CREATE INDEX idx_transactions_skater ON transactions(skater_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
```

#### **4. `teams` - Equipos Fantasy**
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  description TEXT,
  team_color VARCHAR(7), -- Hex color, ej: #FF5733
  logo_url VARCHAR(500),
  total_value DECIMAL(10, 2) DEFAULT 0.00, -- Suma de precios de skaters
  total_score INTEGER DEFAULT 0,           -- Suma de scores de skaters
  skaters_count INTEGER DEFAULT 0,         -- Cantidad de skaters
  skaters JSONB DEFAULT '[]',              -- Array de skater IDs
  achievements JSONB DEFAULT '[]',         -- Logros, badges, etc
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_team_per_owner UNIQUE (owner_id)
);

CREATE INDEX idx_teams_owner ON teams(owner_id);
CREATE INDEX idx_teams_value ON teams(total_value DESC);
CREATE INDEX idx_teams_slug ON teams(slug);
```

#### **5. `team_rosters` - Relación Team-Skater**
```sql
CREATE TABLE team_rosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  skater_id UUID REFERENCES users(id) ON DELETE CASCADE,
  purchase_price DECIMAL(10, 2) NOT NULL,  -- Precio de compra
  purchase_date TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,          -- false si fue vendido/transferido
  performance_score INTEGER DEFAULT 0,     -- Score acumulado en el equipo

  CONSTRAINT unique_skater_per_team UNIQUE (team_id, skater_id)
);

CREATE INDEX idx_rosters_team ON team_rosters(team_id);
CREATE INDEX idx_rosters_skater ON team_rosters(skater_id);
```

#### **6. `market_listings` - Listados de venta**
```sql
CREATE TABLE market_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skater_id UUID REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  asking_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'sold', 'cancelled', 'expired'
  expires_at TIMESTAMP,                -- Opcional: listings expiran en X días
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  sold_at TIMESTAMP,

  CONSTRAINT valid_status CHECK (
    status IN ('active', 'sold', 'cancelled', 'expired')
  )
);

CREATE INDEX idx_listings_skater ON market_listings(skater_id);
CREATE INDEX idx_listings_seller ON market_listings(seller_id);
CREATE INDEX idx_listings_status ON market_listings(status);
CREATE INDEX idx_listings_created ON market_listings(created_at DESC);
```

#### **7. `scout_reports` - Reportes de AI Scouting**
```sql
CREATE TABLE scout_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skater_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_url VARCHAR(500),
  analysis JSONB NOT NULL, -- Reporte completo de AI
  technique_score INTEGER,  -- 0-100
  olympic_potential INTEGER, -- 0-100%
  suggested_price DECIMAL(10, 2),
  detected_tricks TEXT[],
  comparison_notes TEXT,
  model_version VARCHAR(50), -- ej: 'glm-4.6v'
  confidence DECIMAL(3, 2),  -- 0.00-1.00
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_scores CHECK (
    technique_score BETWEEN 0 AND 100 AND
    olympic_potential BETWEEN 0 AND 100 AND
    confidence BETWEEN 0 AND 1
  )
);

CREATE INDEX idx_scout_skater ON scout_reports(skater_id);
CREATE INDEX idx_scout_created ON scout_reports(created_at DESC);
CREATE INDEX idx_scout_potential ON scout_reports(olympic_potential DESC);
```

---

## 🔌 API ENDPOINTS

### **Wallet API**

#### **GET `/api/wallet/balance`**
Obtener saldo de SkateCoins del usuario actual.

```typescript
// app/api/wallet/balance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const wallet = await prisma.user_wallets.findUnique({
    where: { user_id: session.user.id },
    select: {
      balance: true,
      total_earned: true,
      total_spent: true,
    }
  });

  if (!wallet) {
    // Crear wallet si no existe
    const newWallet = await prisma.user_wallets.create({
      data: {
        user_id: session.user.id,
        balance: 100.00, // Bono de bienvenida
      }
    });
    return NextResponse.json(newWallet);
  }

  return NextResponse.json(wallet);
}
```

#### **GET `/api/wallet/transactions`**
Historial de transacciones del usuario.

```typescript
// app/api/wallet/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const transactions = await prisma.transactions.findMany({
    where: {
      OR: [
        { from_user_id: session.user.id },
        { to_user_id: session.user.id }
      ]
    },
    include: {
      skater: {
        select: {
          id: true,
          name: true,
          avatar: true,
          city: true,
        }
      }
    },
    orderBy: { created_at: 'desc' },
    take: limit,
    skip: offset,
  });

  return NextResponse.json({ transactions, count: transactions.length });
}
```

---

### **Market API**

#### **GET `/api/market/skaters`**
Listar skaters disponibles en el mercado.

```typescript
// app/api/market/skaters/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const forSale = searchParams.get('for_sale') === 'true';
  sortBy = searchParams.get('sort_by') || 'price';
  order = searchParams.get('order') || 'asc';

  const skaters = await prisma.skaters_market.findMany({
    where: forSale ? { for_sale: true } : {},
    include: {
      skater: {
        select: {
          id: true,
          name: true,
          avatar: true,
          city: true,
          score: true,
          tricks_count: true,
          followers_count: true,
        }
      },
      owner: {
        select: {
          id: true,
          name: true,
          avatar: true,
        }
      }
    },
    orderBy: { [sortBy]: order },
  });

  return NextResponse.json({ skaters });
}
```

#### **POST `/api/market/list`**
Poner skater a la venta.

```typescript
// app/api/market/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { skater_id, asking_price } = await req.json();

  // Verificar que el usuario sea dueño del skater
  const marketEntry = await prisma.skaters_market.findUnique({
    where: { skater_id }
  });

  if (marketEntry?.owner_id !== session.user.id) {
    return NextResponse.json(
      { error: 'You do not own this skater' },
      { status: 403 }
    );
  }

  // Crear listing
  const listing = await prisma.market_listings.create({
    data: {
      skater_id,
      seller_id: session.user.id,
      asking_price,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    }
  });

  // Actualizar skater market
  await prisma.skaters_market.update({
    where: { skater_id },
    data: {
      for_sale: true,
      listing_price: asking_price,
    }
  });

  return NextResponse.json({ listing, message: 'Skater listed for sale' });
}
```

#### **POST `/api/market/buy`**
Comprar un skater del mercado.

```typescript
// app/api/market/buy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { listing_id } = await req.json();

  // Obtener listing
  const listing = await prisma.market_listings.findUnique({
    where: { id: listing_id },
    include: {
      skater: true,
      seller: true,
    }
  });

  if (!listing || listing.status !== 'active') {
    return NextResponse.json(
      { error: 'Listing not available' },
      { status: 404 }
    );
  }

  // Verificar saldo del comprador
  const buyerWallet = await prisma.user_wallets.findUnique({
    where: { user_id: session.user.id }
  });

  if (!buyerWallet || buyerWallet.balance < listing.asking_price) {
    return NextResponse.json(
      { error: 'Insufficient funds' },
      { status: 400 }
    );
  }

  // Procesar transacción
  await prisma.$transaction(async (tx) => {
    // 1. Descontar del comprador
    await tx.user_wallets.update({
      where: { user_id: session.user.id },
      data: {
        balance: { decrement: listing.asking_price },
        total_spent: { increment: listing.asking_price },
      }
    });

    // 2. Añadir al vendedor
    await tx.user_wallets.update({
      where: { user_id: listing.seller_id },
      data: {
        balance: { increment: listing.asking_price },
        total_earned: { increment: listing.asking_price },
      }
    });

    // 3. Transferir skater
    await tx.skaters_market.update({
      where: { skater_id: listing.skater_id },
      data: {
        owner_id: session.user.id,
        for_sale: false,
        listing_price: null,
        total_transfers: { increment: 1 },
      }
    });

    // 4. Crear registro de transacción
    await tx.transactions.create({
      data: {
        skater_id: listing.skater_id,
        from_user_id: listing.seller_id,
        to_user_id: session.user.id,
        amount: listing.asking_price,
        transaction_type: 'buy',
        metadata: { listing_id }
      }
    });

    // 5. Actualizar listing
    await tx.market_listings.update({
      where: { id: listing_id },
      data: {
        status: 'sold',
        sold_at: new Date(),
      }
    });
  });

  return NextResponse.json({
    message: 'Skater purchased successfully',
    skater_id: listing.skater_id,
    amount: listing.asking_price
  });
}
```

---

### **Teams API**

#### **POST `/api/teams/create`**
Crear un equipo fantasy.

```typescript
// app/api/teams/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, description, team_color } = await req.json();

  // Generar slug único
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Verificar que el usuario no tenga otro equipo
  const existing = await prisma.teams.findUnique({
    where: { owner_id: session.user.id }
  });

  if (existing) {
    return NextResponse.json(
      { error: 'You already have a team' },
      { status: 400 }
    );
  }

  const team = await prisma.teams.create({
    data: {
      name,
      slug,
      description,
      team_color,
      owner_id: session.user.id,
    }
  });

  return NextResponse.json({ team });
}
```

#### **GET `/api/teams/my-team`**
Obtener el equipo del usuario actual.

```typescript
// app/api/teams/my-team/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const team = await prisma.teams.findFirst({
    where: { owner_id: session.user.id },
    include: {
      rosters: {
        where: { is_active: true },
        include: {
          skater: {
            select: {
              id: true,
              name: true,
              avatar: true,
              city: true,
              score: true,
            }
          }
        }
      }
    }
  });

  if (!team) {
    return NextResponse.json({ team: null, message: 'No team found' });
  }

  return NextResponse.json({ team });
}
```

#### **POST `/api/teams/add-skater`**
Añadir skater al equipo.

```typescript
// app/api/teams/add-skater/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { skater_id } = await req.json();

  // Obtener equipo del usuario
  const team = await prisma.teams.findFirst({
    where: { owner_id: session.user.id }
  });

  if (!team) {
    return NextResponse.json(
      { error: 'No team found' },
      { status: 404 }
    );
  }

  // Verificar que el skater pertenezca al usuario
  const marketEntry = await prisma.skaters_market.findUnique({
    where: { skater_id }
  });

  if (marketEntry?.owner_id !== session.user.id) {
    return NextResponse.json(
      { error: 'You do not own this skater' },
      { status: 403 }
    );
  }

  // Añadir al roster
  const roster = await prisma.team_rosters.create({
    data: {
      team_id: team.id,
      skater_id,
      purchase_price: marketEntry.current_price,
    }
  });

  // Actualizar equipo
  const skaters = [...(team.skaters as any[]), skater_id];
  await prisma.teams.update({
    where: { id: team.id },
    data: {
      skaters,
      skaters_count: { increment: 1 },
      total_value: { increment: marketEntry.current_price },
    }
  });

  return NextResponse.json({ roster, message: 'Skater added to team' });
}
```

---

### **Leaderboard API**

#### **GET `/api/leaderboard/teams`**
Ranking de equipos más valiosos.

```typescript
// app/api/leaderboard/teams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50');

  const teams = await prisma.teams.findMany({
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          avatar: true,
        }
      }
    },
    orderBy: { total_value: 'desc' },
    take: limit,
  });

  return NextResponse.json({ teams });
}
```

---

## 🧠 LÓGICA DE NEGOCIO

### **Cálculo del Precio de Skater**

```typescript
// lib/skater-pricing.ts
export function calculateSkaterPrice(skater: any): number {
  const { score, tricks_count, followers_count, total_transfers } = skater;

  // Fórmula base
  const basePrice = (score * 0.5) + (tricks_count * 10) + (followers_count * 2);

  // Bonus por transferencias (demanda)
  const demandMultiplier = 1 + (total_transfers * 0.1);

  // Precio final (mínimo 10 SKT)
  const finalPrice = Math.max(10, Math.round(basePrice * demandMultiplier));

  return finalPrice;
}

// Actualizar precio de todos los skaters periódicamente
export async function updateAllSkaterPrices() {
  const skaters = await prisma.skaters_market.findMany({
    include: { skater: true }
  });

  for (const marketEntry of skaters) {
    const newPrice = calculateSkaterPrice(marketEntry.skater);

    await prisma.skaters_market.update({
      where: { id: marketEntry.id },
      data: {
        current_price: newPrice,
        price_history: {
          ...((marketEntry.price_history as any) || []),
          {
            price: newPrice,
            date: new Date().toISOString(),
          }
        }
      }
    });
  }
}
```

### **Recompensas por Actividad**

```typescript
// lib/rewards.ts
export const REWARDS = {
  COMPLETE_CHALLENGE: 10,        // SKT por completar challenge
  SUBMIT_TRICK_VIDEO: 5,         // SKT por subir video
  NEW_FOLLOWER: 2,               // SKT por nuevo seguidor
  REFERRAL: 50,                  // SKT por referir usuario
  DAILY_LOGIN: 1,                // SKT por login diario
  WEEKLY_TOP_SCORE: 100,         // SKT por top semanal
};

export async function grantReward(
  userId: string,
  type: keyof typeof REWARDS,
  metadata: any = {}
) {
  const amount = REWARDS[type];

  await prisma.$transaction(async (tx) => {
    // Actualizar wallet
    await tx.user_wallets.update({
      where: { user_id: userId },
      data: {
        balance: { increment: amount },
        total_earned: { increment: amount },
      }
    });

    // Crear registro de transacción
    await tx.transactions.create({
      data: {
        to_user_id: userId,
        amount,
        transaction_type: 'reward',
        metadata: { reward_type: type, ...metadata }
      }
    });
  });

  return { amount, type };
}
```

---

## 📅 IMPLEMENTACIÓN PASO A PASO

### **SEMANA 1: Base de Datos**

**Día 1-2: Crear tablas**
- [ ] Ejecutar SQL para crear todas las tablas nuevas
- [ ] Verificar que las relaciones (foreign keys) funcionan
- [ ] Crear índices para optimización

**Día 3-4: Migración de datos existentes**
- [ ] Crear entrada en `skaters_market` para cada skater existente
- [ ] Calcular precio inicial para cada skater
- [ ] Crear wallet con 100 SKT para cada usuario existente

**Día 5-7: Testing de DB**
- [ ] Insertar datos de prueba
- [ ] Verificar queries funcionan correctamente
- [ ] Testear transacciones y rollbacks

---

### **SEMANA 2: API Core**

**Día 1-2: Wallet API**
- [ ] Implementar `/api/wallet/balance`
- [ ] Implementar `/api/wallet/transactions`
- [ ] Testear con Postman/Thunder Client

**Día 3-4: Market API**
- [ ] Implementar `/api/market/skaters`
- [ ] Implementar `/api/market/list`
- [ ] Implementar `/api/market/buy`
- [ ] Testear flujo completo de compra-venta

**Día 5-7: Teams API**
- [ ] Implementar `/api/teams/create`
- [ ] Implementar `/api/teams/my-team`
- [ ] Implementar `/api/teams/add-skater`
- [ ] Testear creación y gestión de equipos

---

### **SEMANA 3: Frontend**

**Día 1-2: Página Wallet**
- [ ] Crear `/app/wallet/page.tsx`
- [ ] Mostrar saldo actual
- [ ] Historial de transacciones
- [ ] Gráfico de ganancias/pérdidas

**Día 3-4: Página Market**
- [ ] Crear `/app/market/page.tsx`
- [ ] Listado de skaters en venta
- [ ] Filtros (precio, potencial, ubicación)
- [ ] Modal de compra

**Día 5-7: Página Teams**
- [ ] Crear `/app/team/page.tsx`
- [ ] Ver mi equipo fantasy
- [ ] Añadir/eliminar skaters
- [ ] Estadísticas del equipo

---

### **SEMANA 4: AI Scouting (GLM)**

Ver sección detallada abajo.

---

## 🤖 AI SCOUTING CON GLM

### **Configuración de GLM API**

```typescript
// lib/glm.ts
const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

const glmClient = {
  async analyzeVideo(videoUrl: string, prompt: string) {
    const response = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4v', // Vision model
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'video_url', video_url: videoUrl }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      })
    });

    return response.json();
  }
};

export default glmClient;
```

### **Endpoint de Scouting**

```typescript
// app/api/ai/scout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import glmClient from '@/lib/glm';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { video_url, skater_id } = await req.json();

  // Prompt de análisis
  const prompt = `
    Analiza este video de skateboarding y genera un reporte técnico en formato JSON:

    {
      "technique_score": 0-100,
      "olympic_potential": 0-100,
      "detected_tricks": ["ollie", "kickflip", ...],
      "style_notes": "descripción del estilo",
      "suggested_price": número en SkateCoins,
      "comparison": "skater profesional similar",
      "strengths": ["fortaleza1", "fortaleza2"],
      "improvement_areas": ["área a mejorar1", "área2"]
    }
  `;

  try {
    const analysis = await glmClient.analyzeVideo(video_url, prompt);

    // Guardar reporte
    const report = await prisma.scout_reports.create({
      data: {
        skater_id,
        video_url,
        analysis: analysis.choices[0].message.content,
        technique_score: analysis.technique_score,
        olympic_potential: analysis.olympic_potential,
        suggested_price: analysis.suggested_price,
        detected_tricks: analysis.detected_tricks,
        comparison_notes: analysis.comparison,
        model_version: 'glm-4v',
        confidence: 0.85,
      }
    });

    return NextResponse.json({ report });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to analyze video' },
      { status: 500 }
    );
  }
}
```

---

## 🎨 FRONTEND - NUEVAS PÁGINAS

### **`/app/wallet/page.tsx` - Billetera**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function WalletPage() {
  const { data: session } = useSession();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetch('/api/wallet/balance')
      .then(res => res.json())
      .then(data => setBalance(data.balance));

    fetch('/api/wallet/transactions?limit=20')
      .then(res => res.json())
      .then(data => setTransactions(data.transactions));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">💰 Tu Billetera</h1>

        {/* Balance Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 mb-8 shadow-lg">
          <p className="text-zinc-600 dark:text-zinc-400 mb-2">Saldo disponible</p>
          <p className="text-6xl font-bold text-green-600">
            {balance} SKT
          </p>
        </div>

        {/* Transactions */}
        <h2 className="text-2xl font-bold mb-4">Historial</h2>
        <div className="space-y-4">
          {transactions.map(tx => (
            <div key={tx.id} className="bg-white dark:bg-zinc-900 rounded-xl p-4 flex justify-between">
              <div>
                <p className="font-semibold">{tx.transaction_type}</p>
                <p className="text-sm text-zinc-500">
                  {new Date(tx.created_at).toLocaleDateString()}
                </p>
              </div>
              <p className={`text-xl font-bold ${tx.to_user_id === session?.user?.id ? 'text-green-600' : 'text-red-600'}`}>
                {tx.to_user_id === session?.user?.id ? '+' : '-'}{tx.amount} SKT
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### **`/app/market/page.tsx` - Marketplace**

```typescript
'use client';

import { useEffect, useState } from 'react';

export default function MarketPage() {
  const [skaters, setSkaters] = useState([]);

  useEffect(() => {
    fetch('/api/market/skaters?for_sale=true')
      .then(res => res.json())
      .then(data => setSkaters(data.skaters));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🛹 Mercado de Skaters</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {skaters.map(market => (
            <div key={market.id} className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-lg">
              {/* Skater Avatar */}
              <div className="relative h-48 bg-gradient-to-br from-purple-500 to-pink-500">
                <img
                  src={market.skater.avatar}
                  alt={market.skater.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full font-bold">
                  {market.listing_price} SKT
                </div>
              </div>

              {/* Skater Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{market.skater.name}</h3>
                <p className="text-zinc-500 mb-4">{market.skater.city}</p>

                {/* Stats */}
                <div className="flex justify-between text-sm mb-4">
                  <span>Score: {market.skater.score}</span>
                  <span>Trucos: {market.skater.tricks_count}</span>
                </div>

                {/* Buy Button */}
                <button
                  onClick={() => buySkater(market.skater_id, market.listing_price)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition"
                >
                  Comprar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  async function buySkater(skaterId: string, price: number) {
    const response = await fetch('/api/market/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: skaterId })
    });

    if (response.ok) {
      alert('¡Skater comprado!');
      // Recargar página
    }
  }
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **Base de Datos**
- [ ] Crear tabla `user_wallets`
- [ ] Crear tabla `skaters_market`
- [ ] Crear tabla `transactions`
- [ ] Crear tabla `teams`
- [ ] Crear tabla `team_rosters`
- [ ] Crear tabla `market_listings`
- [ ] Crear tabla `scout_reports`
- [ ] Crear índices para optimización
- [ ] Migrar skaters existentes a `skaters_market`
- [ ] Crear wallet inicial para cada usuario

### **API - Wallet**
- [ ] `GET /api/wallet/balance`
- [ ] `GET /api/wallet/transactions`
- [ ] `POST /api/wallet/grant` (admin only)

### **API - Market**
- [ ] `GET /api/market/skaters`
- [ ] `POST /api/market/list`
- [ ] `POST /api/market/buy`
- [ ] `POST /api/market/cancel-listing`

### **API - Teams**
- [ ] `POST /api/teams/create`
- [ ] `GET /api/teams/my-team`
- [ ] `GET /api/teams/[id]`
- [ ] `POST /api/teams/add-skater`
- [ ] `DELETE /api/teams/remove-skater`

### **API - Leaderboard**
- [ ] `GET /api/leaderboard/teams`
- [ ] `GET /api/leaderboard/skaters`
- [ ] `GET /api/leaderboard/users`

### **API - AI Scouting**
- [ ] `POST /api/ai/scout`
- [ ] `GET /api/ai/scout-reports/[skater_id]`
- [ ] Integración con GLM Vision API

### **Frontend**
- [ ] `/wallet` - Billetera
- [ ] `/market` - Marketplace
- [ ] `/team` - Mi equipo
- [ ] `/leaderboard` - Rankings
- [ ] `/scouting` - AI Scouting

---

## 🚀 SIGUIENTES PASOS

Una vez completada esta implementación:

1. **Beta Testing con comunidad real**
   - Invitar a 50 skaters de Colombia
   - Recopilar feedback
   - Iterar en base a datos

2. **Lanzar en Colombia**
   - Marketing en redes sociales
   - Partner con skateshops
   - Eventos de skate reales

3. **Monetización**
   - Venta de "Pro Scout" ($10/mes)
   - Sponsors pagando en SKT
   - Marketplace fee (5%)

4. **Preparar para blockchain**
   - Documentar arquitectura
   - Preparar smart contracts
   - Buscar funding cuando tengas tracción

---

## 📞 SOPORTE

Para dudas o problemas durante la implementación:
- Revisar logs de console
- Verificar que las relaciones DB estén correctas
- Testear cada endpoint individualmente
- Usar datos de prueba inicialmente

---

**¡Let's build SkateWorld! 🛹🚀**
