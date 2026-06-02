# 🛹 SKATEWORLD V2: Guía de Implementación - Economía Fantasy + AI Scouting

> **Versión:** 2.0 (Compatible con schema actual)
> **Fecha:** 27 Enero 2026
> **Proyecto:** Trickest Skate Platform

---

## 📋 TABLA DE CONTENIDOS

1. [Visión General](#visión-general)
2. [Integración con Schema Existente](#integración-con-schema-existente)
3. [Nuevas Tablas Prisma](#nuevas-tablas-prisma)
4. [API Endpoints](#api-endpoints)
5. [Lógica de Negocio](#lógica-de-negocio)
6. [Implementación Paso a Paso](#implementación-paso-a-paso)
7. [AI Scouting con GLM](#ai-scouting-con-glm)
8. [Frontend - Nuevas Páginas](#frontend---nuevas-páginas)

---

## 🎯 VISIÓN GENERAL

**SkateWorld es una economía fantasy donde:**
- Los usuarios pueden comprar/vender skaters (usuarios con role='skater')
- Cada skater tiene un precio basado en su desempeño (score, submissions aprobadas)
- Los usuarios crean "equipos fantasy" compitiendo por ser el más valioso
- Sistema de transacciones internas con SkateCoins (SKT)
- AI Scouting analiza videos y descubre talento emergente

**Modelo de negocio similar a:**
- Sorare (fútbol fantasy con NFTs)
- Fantasy Premier League
- pero sin blockchain inicialmente (centralizado)

---

## 🔗 INTEGRACIÓN CON SCHEMA EXISTENTE

### **Tablas existentes que usaremos:**

```prisma
model User {
  id       Int     @id @default(autoincrement())
  email    String  @unique
  role     String  @default("skater") // "skater" | "judge" | "admin"
  name     String?
  photo    String?
  ciudad   String?

  // Relaciones existentes
  submissions   Submission[]
  team         Team?        @relation("TeamMembers")
  ownedTeams   Team[]       @relation("TeamOwner")
  notifications Notification[]
}

model Team {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  ownerId     String   // Email del creador
  maxMembers  Int      @default(5)
  isActive    Boolean  @default(true)

  owner       User     @relation("TeamOwner", fields: [ownerId], references: [email])
  members     User[]   @relation("TeamMembers")
}

model Submission {
  id          Int      @id @default(autoincrement())
  userId      String   // Email
  challengeId Int
  score       Int?     // 0-100
  status      String   // "pending", "approved", "rejected"
}
```

---

## 🗄️ NUEVAS TABLAS PRISMA

### **1. `UserWallet` - Billeteras de usuarios**

```prisma
model UserWallet {
  id           Int      @id @default(autoincrement())
  userEmail    String   @unique // Email del usuario (clave primaria lógica)
  balance       Decimal  @default(100.00) @db.Decimal(10, 2) // 100 SKT gratis al inicio
  totalEarned   Decimal  @default(0.00) @db.Decimal(10, 2)
  totalSpent    Decimal  @default(0.00) @db.Decimal(10, 2)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userEmail], references: [email], onDelete: Cascade)

  @@index([userEmail])
  @@map("user_wallets")
}
```

**Actualización en `User`:**
```prisma
model User {
  // ... campos existentes
  wallet       UserWallet? // Nueva relación
}
```

---

### **2. `SkaterMarket` - Mercado de skaters**

```prisma
model SkaterMarket {
  id             Int      @id @default(autoincrement())
  skaterEmail    String   @unique // Email del skater (role='skater')
  ownerEmail     String?  // NULL = free agent (sin dueño)
  currentPrice   Decimal  @db.Decimal(10, 2) // Precio actual en SKT
  baseValue      Decimal  @db.Decimal(10, 2) // Valor base calculado
  forSale        Boolean  @default(false)
  listingPrice   Decimal? @db.Decimal(10, 2) // Precio de venta
  priceHistory    Json     @default("[]") // Historial de precios
  totalTransfers Int      @default(0) // Veces transferido
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  skater         User     @relation("SkaterMarket", fields: [skaterEmail], references: [email], onDelete: Cascade)
  owner          User?    @relation("SkaterOwner", fields: [ownerEmail], references: [email], onDelete: SetNull)

  @@index([skaterEmail])
  @@index([ownerEmail])
  @@index([forSale])
  @@map("skaters_market")
}
```

**Actualización en `User`:**
```prisma
model User {
  // ... campos existentes
  marketListing SkaterMarket? @relation("SkaterMarket")     // Si este usuario es skater en el mercado
  ownedSkaters  SkaterMarket[] @relation("SkaterOwner")     // Skaters que este usuario posee
}
```

---

### **3. `Transaction` - Historial de transacciones**

```prisma
model Transaction {
  id               Int      @id @default(autoincrement())
  skaterEmail      String?  // Email del skater involucrado
  fromUserEmail    String?  // NULL = sistema
  toUserEmail      String?  // NULL = sistema
  amount           Decimal  @db.Decimal(10, 2)
  transactionType  String   // 'buy', 'sell', 'reward', 'bonus', 'penalty', 'transfer'
  metadata         Json?    @default("{}")
  createdAt        DateTime @default(now())

  skater           User?    @relation("SkaterTransactions", fields: [skaterEmail], references: [email], onDelete: SetNull)
  fromUser         User?    @relation("TransactionsFrom", fields: [fromUserEmail], references: [email], onDelete: SetNull)
  toUser           User?    @relation("TransactionsTo", fields: [toUserEmail], references: [email], onDelete: SetNull)

  @@index([fromUserEmail])
  @@index([toUserEmail])
  @@index([skaterEmail])
  @@index([transactionType])
  @@index([createdAt])
  @@map("transactions")
}
```

**Actualización en `User`:**
```prisma
model User {
  // ... campos existentes
  skaterTransactions  Transaction[] @relation("SkaterTransactions")
  transactionsFrom    Transaction[] @relation("TransactionsFrom")
  transactionsTo      Transaction[] @relation("TransactionsTo")
}
```

---

### **4. `MarketListing` - Listados de venta**

```prisma
model MarketListing {
  id            Int      @id @default(autoincrement())
  skaterEmail   String
  sellerEmail   String
  askingPrice   Decimal  @db.Decimal(10, 2)
  status        String   @default("active") // 'active', 'sold', 'cancelled', 'expired'
  expiresAt     DateTime?
  metadata      Json?    @default("{}")
  createdAt     DateTime @default(now())
  soldAt        DateTime?

  skater        User     @relation("ListingSkater", fields: [skaterEmail], references: [email], onDelete: Cascade)
  seller        User     @relation("ListingSeller", fields: [sellerEmail], references: [email], onDelete: Cascade)

  @@index([skaterEmail])
  @@index([sellerEmail])
  @@index([status])
  @@index([createdAt])
  @@map("market_listings")
}
```

**Actualización en `User`:**
```prisma
model User {
  // ... campos existentes
  listingsAsSkater MarketListing[] @relation("ListingSkater")
  listingsAsSeller  MarketListing[] @relation("ListingSeller")
}
```

---

### **5. `FantasyTeam` - Equipos Fantasy (extiende Team existente)**

```prisma
model FantasyTeam {
  id             Int      @id @default(autoincrement())
  teamId         Int      @unique // Referencia al Team existente
  teamColor      String?  // Hex color, ej: #FF5733
  logoUrl        String?
  totalValue     Decimal  @default(0.00) @db.Decimal(10, 2) // Suma de precios de skaters
  totalScore     Int      @default(0) // Suma de scores de skaters
  skatersEmails  Json     @default("[]") // Array de emails de skaters
  achievements   Json     @default("[]") // Logros, badges
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  team           Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@index([teamId])
  @@index([totalValue])
  @@map("fantasy_teams")
}
```

**Actualización en `Team`:**
```prisma
model Team {
  // ... campos existentes
  fantasyTeam FantasyTeam?
}
```

---

### **6. `FantasyRoster` - Relación FantasyTeam-Skater**

```prisma
model FantasyRoster {
  id              Int      @id @default(autoincrement())
  fantasyTeamId   Int
  skaterEmail     String
  purchasePrice   Decimal  @db.Decimal(10, 2)
  purchaseDate    DateTime @default(now())
  isActive        Boolean  @default(true)
  performanceScore Int     @default(0)

  fantasyTeam     FantasyTeam @relation(fields: [fantasyTeamId], references: [id], onDelete: Cascade)
  skater          User        @relation(fields: [skaterEmail], references: [email], onDelete: Cascade)

  @@unique([fantasyTeamId, skaterEmail])
  @@index([fantasyTeamId])
  @@index([skaterEmail])
  @@map("fantasy_rosters")
}
```

**Actualización en `User`:**
```prisma
model User {
  // ... campos existentes
  fantasyRosters FantasyRoster[]
}
```

---

### **7. `ScoutReport` - Reportes de AI Scouting**

```prisma
model ScoutReport {
  id                 Int      @id @default(autoincrement())
  skaterEmail        String
  videoUrl           String?
  analysis           Json     // Reporte completo de AI
  techniqueScore     Int?     // 0-100
  olympicPotential   Int?     // 0-100
  suggestedPrice     Decimal? @db.Decimal(10, 2)
  detectedTricks     String[]  // Trucos detectados
  comparisonNotes    String?  // Comparación con pros
  modelVersion       String?  // ej: 'glm-4v'
  confidence         Decimal? @db.Decimal(3, 2) // 0.00-1.00
  createdAt          DateTime @default(now())

  skater             User     @relation(fields: [skaterEmail], references: [email], onDelete: Cascade)

  @@index([skaterEmail])
  @@index([createdAt])
  @@index([olympicPotential])
  @@map("scout_reports")
}
```

**Actualización en `User`:**
```prisma
model User {
  // ... campos existentes
  scoutReports ScoutReport[]
}
```

---

## 🔌 API ENDPOINTS

### **Wallet API**

#### **GET `/api/wallet/balance`**
```typescript
// app/api/wallet/balance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/app/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const wallet = await prisma.userWallet.findUnique({
    where: { userEmail: session.user.email },
    select: {
      balance: true,
      totalEarned: true,
      totalSpent: true,
    }
  });

  if (!wallet) {
    // Crear wallet si no existe con bono de bienvenida
    const newWallet = await prisma.userWallet.create({
      data: {
        userEmail: session.user.email,
        balance: 100.00, // Bono de bienvenida
      }
    });
    return NextResponse.json(newWallet);
  }

  return NextResponse.json(wallet);
}
```

#### **GET `/api/wallet/transactions`**
```typescript
// app/api/wallet/transactions/route.ts
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50');

  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [
        { fromUserEmail: session.user.email },
        { toUserEmail: session.user.email }
      ]
    },
    include: {
      skater: {
        select: {
          email: true,
          name: true,
          photo: true,
          ciudad: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({ transactions });
}
```

---

### **Market API**

#### **GET `/api/market/skaters`**
```typescript
// app/api/market/skaters/route.ts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const forSale = searchParams.get('for_sale') === 'true';
  const sortBy = searchParams.get('sort_by') || 'currentPrice';
  const order = searchParams.get('order') || 'asc';

  const skaters = await prisma.skaterMarket.findMany({
    where: forSale ? { forSale: true } : {},
    include: {
      skater: {
        select: {
          email: true,
          name: true,
          photo: true,
          ciudad: true,
        }
      },
      owner: {
        select: {
          email: true,
          name: true,
          photo: true,
        }
      }
    },
    orderBy: { [sortBy]: order },
  });

  // Enriquecer con datos de submissions
  const enrichedSkaters = await Promise.all(
    skaters.map(async (market) => {
      const submissions = await prisma.submission.count({
        where: {
          userId: market.skaterEmail,
          status: 'approved'
        }
      });

      const avgScore = await prisma.submission.aggregate({
        where: {
          userId: market.skaterEmail,
          status: 'approved',
          score: { not: null }
        },
        _avg: { score: true }
      });

      return {
        ...market,
        approvedSubmissions: submissions,
        averageScore: avgScore._avg.score || 0,
      };
    })
  );

  return NextResponse.json({ skaters: enrichedSkaters });
}
```

#### **POST `/api/market/list`**
```typescript
// app/api/market/list/route.ts
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { skaterEmail, askingPrice } = await req.json();

  // Verificar que el usuario sea dueño del skater
  const marketEntry = await prisma.skaterMarket.findUnique({
    where: { skaterEmail }
  });

  if (marketEntry?.ownerEmail !== session.user.email) {
    return NextResponse.json(
      { error: 'You do not own this skater' },
      { status: 403 }
    );
  }

  // Crear listing
  const listing = await prisma.marketListing.create({
    data: {
      skaterEmail,
      sellerEmail: session.user.email,
      askingPrice,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    }
  });

  // Actualizar skater market
  await prisma.skaterMarket.update({
    where: { skaterEmail },
    data: {
      forSale: true,
      listingPrice: askingPrice,
    }
  });

  return NextResponse.json({ listing, message: 'Skater listed for sale' });
}
```

#### **POST `/api/market/buy`**
```typescript
// app/api/market/buy/route.ts
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { listingId } = await req.json();

  const listing = await prisma.marketListing.findUnique({
    where: { id: listingId },
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

  // Verificar saldo
  const buyerWallet = await prisma.userWallet.findUnique({
    where: { userEmail: session.user.email }
  });

  if (!buyerWallet || buyerWallet.balance < listing.askingPrice) {
    return NextResponse.json(
      { error: 'Insufficient funds' },
      { status: 400 }
    );
  }

  // Transacción atómica
  await prisma.$transaction(async (tx) => {
    // 1. Descontar del comprador
    await tx.userWallet.update({
      where: { userEmail: session.user.email },
      data: {
        balance: { decrement: listing.askingPrice },
        totalSpent: { increment: listing.askingPrice },
      }
    });

    // 2. Añadir al vendedor
    await tx.userWallet.update({
      where: { userEmail: listing.sellerEmail },
      data: {
        balance: { increment: listing.askingPrice },
        totalEarned: { increment: listing.askingPrice },
      }
    });

    // 3. Transferir skater
    await tx.skaterMarket.update({
      where: { skaterEmail: listing.skaterEmail },
      data: {
        ownerEmail: session.user.email,
        forSale: false,
        listingPrice: null,
        totalTransfers: { increment: 1 },
      }
    });

    // 4. Crear registro de transacción
    await tx.transaction.create({
      data: {
        skaterEmail: listing.skaterEmail,
        fromUserEmail: listing.sellerEmail,
        toUserEmail: session.user.email,
        amount: listing.askingPrice,
        transactionType: 'buy',
        metadata: { listingId }
      }
    });

    // 5. Actualizar listing
    await tx.marketListing.update({
      where: { id: listingId },
      data: {
        status: 'sold',
        soldAt: new Date(),
      }
    });
  });

  return NextResponse.json({
    message: 'Skater purchased successfully',
    skaterEmail: listing.skaterEmail,
    amount: listing.askingPrice
  });
}
```

---

## 🧠 LÓGICA DE NEGOCIO

### **Cálculo del Precio de Skater**

```typescript
// lib/skater-pricing.ts
export async function calculateSkaterPrice(skaterEmail: string): Promise<number> {
  // Obtener submissions aprobadas
  const submissions = await prisma.submission.findMany({
    where: {
      userId: skaterEmail,
      status: 'approved'
    },
    include: {
      challenge: true
    }
  });

  // Calcular score promedio
  const avgScore = submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length || 0;

  // Contar challenges únicos completados
  const uniqueChallenges = new Set(submissions.map(s => s.challengeId)).size;

  // Obtener followers
  const followersCount = await prisma.follow.count({
    where: { followingId: skaterEmail }
  });

  // Fórmula base
  const basePrice = (avgScore * 2) + (uniqueChallenges * 15) + (followersCount * 1);

  // Obtener transferencias previas para multiplicador de demanda
  const marketEntry = await prisma.skaterMarket.findUnique({
    where: { skaterEmail }
  });

  const demandMultiplier = 1 + ((marketEntry?.totalTransfers || 0) * 0.1);

  // Precio final (mínimo 10 SKT)
  const finalPrice = Math.max(10, Math.round(basePrice * demandMultiplier));

  return finalPrice;
}

// Actualizar precio de todos los skaters (cron job)
export async function updateAllSkaterPrices() {
  const skaters = await prisma.user.findMany({
    where: { role: 'skater' }
  });

  for (const skater of skaters) {
    const newPrice = await calculateSkaterPrice(skater.email);

    await prisma.skaterMarket.upsert({
      where: { skaterEmail: skater.email },
      create: {
        skaterEmail: skater.email,
        currentPrice: newPrice,
        baseValue: newPrice,
        ownerEmail: null, // Free agent inicialmente
      },
      update: {
        currentPrice: newPrice,
        priceHistory: {
          ...((await prisma.skaterMarket.findUnique({
            where: { skaterEmail: skater.email }
          }))?.priceHistory as any[] || []),
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
  APPROVE_SUBMISSION: 20,       // SKT cuando juez aprueba tu video
  COMPLETE_CHALLENGE: 10,       // SKT por completar challenge
  NEW_FOLLOWER: 2,              // SKT por nuevo seguidor
  REFERRAL: 50,                 // SKT por referir usuario
  DAILY_LOGIN: 1,               // SKT por login diario
  WEEKLY_TOP_SCORE: 100,        // SKT por top semanal
  SPOT_VALIDATION: 5,           // SKT por validar un spot
  COMMENT_ON_SPOT: 1,           // SKT por comentar en spot
};

export async function grantReward(
  userEmail: string,
  type: keyof typeof REWARDS,
  metadata: any = {}
) {
  const amount = REWARDS[type];

  await prisma.$transaction(async (tx) => {
    // Crear wallet si no existe
    await tx.userWallet.upsert({
      where: { userEmail },
      create: { userEmail, balance: 0 },
      update: {}
    });

    // Actualizar wallet
    await tx.userWallet.update({
      where: { userEmail },
      data: {
        balance: { increment: amount },
        totalEarned: { increment: amount },
      }
    });

    // Crear registro de transacción
    await tx.transaction.create({
      data: {
        toUserEmail: userEmail,
        amount,
        transactionType: 'reward',
        metadata: { rewardType: type, ...metadata }
      }
    });
  });

  return { amount, type };
}
```

---

## 📅 IMPLEMENTACIÓN PASO A PASO

### **FASE 1: Base de Datos (3 días)**

**Día 1: Agregar modelos al schema**
- [ ] Agregar todos los nuevos modelos a `schema.prisma`
- [ ] Actualizar modelos existentes (User, Team) con relaciones
- [ ] Ejecutar `npx prisma db push`

**Día 2: Script de migración**
- [ ] Crear script `scripts/initialize-skateworld.ts`
- [ ] Crear wallet para cada usuario existente
- [ ] Crear entrada en SkaterMarket para cada role='skater'
- [ ] Calcular precios iniciales

**Día 3: Testing**
- [ ] Verificar que todas las relaciones funcionan
- [ ] Testear queries complejas con joins
- [ ] Verificar transacciones atómicas

---

### **FASE 2: API Core - Wallet (2 días)**

**Día 1:**
- [ ] `GET /api/wallet/balance`
- [ ] `GET /api/wallet/transactions`

**Día 2:**
- [ ] `POST /api/wallet/grant` (admin only)
- [ ] Integrar rewards con submissions existentes

---

### **FASE 3: API Core - Market (3 días)**

**Día 1:**
- [ ] `GET /api/market/skaters`
- [ ] Lógica de cálculo de precios

**Día 2:**
- [ ] `POST /api/market/list`
- [ ] `POST /api/market/buy`

**Día 3:**
- [ ] `POST /api/market/cancel-listing`
- [ ] Testing completo de flujo compra-venta

---

### **FASE 4: Frontend - Wallet & Market (4 días)**

**Día 1-2: Página Wallet**
- [ ] `/app/wallet/page.tsx`
- [ ] Mostrar saldo con animaciones
- [ ] Historial de transacciones
- [ ] Gráfico de evolución

**Día 3-4: Página Market**
- [ ] `/app/market/page.tsx`
- [ ] Grid de skaters con stats
- [ ] Filtros y sorting
- [ ] Modal de compra con confirmación

---

### **FASE 5: Fantasy Teams (3 días)**

**Día 1:**
- [ ] Extender modelo Team existente
- [ ] `POST /api/fantasy-team/create`
- [ ] `GET /api/fantasy-team/my-team`

**Día 2-3:**
- [ ] `/app/team/page.tsx`
- [ ] Añadir/eliminar skaters del team
- [ ] Ver stats del team
- [ ] Leaderboard de teams

---

### **FASE 6: AI Scouting - Opcional (3 días)**

**Día 1:**
- [ ] Configurar GLM API key
- [ ] Crear `lib/glm.ts`

**Día 2:**
- [ ] `POST /api/ai/scout`
- [ ] Procesar responses de GLM

**Día 3:**
- [ ] `/app/scouting/page.tsx`
- [ ] Subir video para análisis
- [ ] Mostrar reporte con scores

---

## 🤖 AI SCOUTING CON GLM

### **Configuración**

```bash
# .env.local
GLM_API_KEY=your_api_key_here
```

```typescript
// lib/glm.ts
const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

export const glmClient = {
  async analyzeVideo(videoUrl: string) {
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
              {
                type: 'text',
                text: `Analiza este video de skateboarding y genera un reporte técnico en formato JSON con:
{
  "technique_score": 0-100,
  "olympic_potential": 0-100,
  "detected_tricks": ["ollie", "kickflip", ...],
  "style_notes": "descripción del estilo",
  "suggested_skt": número en SkateCoins,
  "comparison": "skater profesional similar",
  "strengths": ["fortaleza1", "fortaleza2"],
  "improvement_areas": ["área a mejorar1", "área2"]
}`
              },
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
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **Schema Prisma**
- [ ] Agregar `UserWallet`
- [ ] Agregar `SkaterMarket`
- [ ] Agregar `Transaction`
- [ ] Agregar `MarketListing`
- [ ] Agregar `FantasyTeam`
- [ ] Agregar `FantasyRoster`
- [ ] Agregar `ScoutReport`
- [ ] Actualizar `User` con nuevas relaciones
- [ ] Actualizar `Team` con `fantasyTeam`

### **API - Wallet**
- [ ] `GET /api/wallet/balance`
- [ ] `GET /api/wallet/transactions`
- [ ] `POST /api/wallet/grant` (admin)

### **API - Market**
- [ ] `GET /api/market/skaters`
- [ ] `POST /api/market/list`
- [ ] `POST /api/market/buy`
- [ ] `POST /api/market/cancel-listing`

### **API - Fantasy**
- [ ] `POST /api/fantasy-team/create`
- [ ] `GET /api/fantasy-team/my-team`
- [ ] `POST /api/fantasy-team/add-skater`
- [ ] `DELETE /api/fantasy-team/remove-skater`
- [ ] `GET /api/leaderboard/teams`

### **API - AI Scouting**
- [ ] `POST /api/ai/scout`
- [ ] `GET /api/ai/scout-reports/[email]`

### **Frontend**
- [ ] `/wallet` - Billetera SkateCoins
- [ ] `/market` - Marketplace de skaters
- [ ] `/team` - Mi equipo fantasy
- [ ] `/leaderboard` - Rankings
- [ ] `/scouting` - AI Scouting (opcional)

---

## 🚀 SIGUIENTES PASOS

1. **Revisar y aprobar este documento**
2. **Ejecutar FASE 1** (Schema + migración)
3. **Implementar FASE 2-3** (APIs)
4. **Deploy a staging** para testing
5. **Beta con 50 usuarios**
6. **Iterar basado en feedback**

---

**¡Let's build SkateWorld V2! 🛹💰🚀**
