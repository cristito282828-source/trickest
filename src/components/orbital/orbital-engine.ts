/**
 * Motor de física para la animación orbital de productos
 *
 * Puro TypeScript, sin dependencias de React. Testeable de forma aislada.
 *
 * Comportamiento:
 * - Cada producto se mueve con velocidad propia (vx, vy)
 * - Rebota en los 4 bordes del viewport
 * - Separación automática entre productos cercanos (estilo enjambre)
 *
 * Uso:
 *   const engine = new OrbitalEngine({ width, height, products, radius })
 *   engine.update(deltaTime)
 *   engine.getProducts()  // para renderizar
 *   engine.handleClick(x, y)  // para anclar
 *   engine.handleHover(x, y)  // para resaltar
 */
import type { Variation, ProductAttribute } from '@/lib/woocommerce/types';

export interface OrbitalProduct {
  id: string
  name: string
  slug: string
  price: string | null
  imageUrl: string | null
  variations?: Variation[]
  attributes?: ProductAttribute[]
}

export interface OrbitalState {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  hovered: boolean
  anchored: boolean
  // Datos del producto original (para el panel de detalle)
  product: OrbitalProduct
}

export interface OrbitalEngineConfig {
  width: number
  height: number
  products: OrbitalProduct[]
  radius?: number // Default: 40 (círculo de 80x80)
  minSpeed?: number // Default: 60 px/s
  maxSpeed?: number // Default: 140 px/s
  separationPadding?: number // Default: 1.1 (10% más que la suma de radios)
}

export class OrbitalEngine {
  private width: number
  private height: number
  private radius: number
  private minSpeed: number
  private maxSpeed: number
  private separationPadding: number
  private products: OrbitalState[] = []
  private anchoredId: string | null = null
  private hoveredId: string | null = null

  constructor(config: OrbitalEngineConfig) {
    this.width = config.width
    this.height = config.height
    this.radius = config.radius ?? 40
    this.minSpeed = config.minSpeed ?? 60
    this.maxSpeed = config.maxSpeed ?? 140
    this.separationPadding = config.separationPadding ?? 1.1

    this.initializeProducts(config.products)
  }

  /**
   * Inicializa los productos con posiciones aleatorias y velocidades aleatorias
   * Distribución uniforme en el viewport
   */
  private initializeProducts(products: OrbitalProduct[]) {
    this.products = products.map((product) => {
      const speed = this.randomSpeed()
      const angle = Math.random() * Math.PI * 2
      return {
        id: product.id,
        x: this.radius + Math.random() * (this.width - this.radius * 2),
        y: this.radius + Math.random() * (this.height - this.radius * 2),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: this.radius,
        hovered: false,
        anchored: false,
        product,
      }
    })
  }

  private randomSpeed(): number {
    return this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed)
  }

  /**
   * Actualiza la física de todos los productos
   * @param deltaTime - Tiempo en segundos desde el último frame
   */
  update(deltaTime: number) {
    for (const p of this.products) {
      if (p.anchored) {
        // El producto anclado se queda quieto en el centro
        p.x = this.width / 2
        p.y = this.height / 2
        continue
      }

      // Mover
      p.x += p.vx * deltaTime
      p.y += p.vy * deltaTime

      // Rebote en bordes
      if (p.x - p.radius < 0) {
        p.x = p.radius
        p.vx = Math.abs(p.vx)
      } else if (p.x + p.radius > this.width) {
        p.x = this.width - p.radius
        p.vx = -Math.abs(p.vx)
      }

      if (p.y - p.radius < 0) {
        p.y = p.radius
        p.vy = Math.abs(p.vy)
      } else if (p.y + p.radius > this.height) {
        p.y = this.height - p.radius
        p.vy = -Math.abs(p.vy)
      }
    }

    // Separación automática entre productos (enjambre)
    this.applySeparation()
  }

  /**
   * Aplica fuerza de repulsión entre productos que están demasiado cerca
   * Estilo enjambre: si dist < (rA + rB) * padding, se empujan
   */
  private applySeparation() {
    for (let i = 0; i < this.products.length; i++) {
      const a = this.products[i]
      if (a.anchored) continue

      for (let j = i + 1; j < this.products.length; j++) {
        const b = this.products[j]
        if (b.anchored) continue

        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const minDist = (a.radius + b.radius) * this.separationPadding

        if (dist < minDist && dist > 0) {
          // Vector unitario de a hacia b
          const nx = dx / dist
          const ny = dy / dist
          // Fuerza inversamente proporcional a la distancia
          const overlap = (minDist - dist) / 2
          a.x -= nx * overlap
          a.y -= ny * overlap
          b.x += nx * overlap
          b.y += ny * overlap

          // También ajustar velocidades para que se alejen naturalmente
          const vRel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
          if (vRel < 0) {
            // Se están acercando, invertir componente normal
            a.vx += vRel * nx * 0.5
            a.vy += vRel * ny * 0.5
            b.vx -= vRel * nx * 0.5
            b.vy -= vRel * ny * 0.5
          }
        }
      }
    }
  }

  /**
   * Maneja click en coordenadas (x, y)
   * Si hay un producto bajo el cursor, lo ancla
   * Si había otro anclado, lo libera
   * @returns el producto anclado (o null si no había nada bajo el cursor)
   */
  handleClick(x: number, y: number): OrbitalState | null {
    const target = this.findProductAt(x, y)

    if (!target) {
      // Click en el vacío: liberar el anclado si había
      this.releaseAnchored()
      return null
    }

    if (this.anchoredId === target.id) {
      // Click en el mismo anclado: liberar
      this.releaseAnchored()
      return null
    }

    // Liberar el anterior y anclar el nuevo
    this.releaseAnchored()
    target.anchored = true
    this.anchoredId = target.id

    // Detener el anclado (lo deja en el centro en el próximo update)
    target.vx = 0
    target.vy = 0
    return target
  }

  /**
   * Maneja movimiento del mouse
   * Marca el producto bajo el cursor como hovered
   * @returns el producto hovered (o null)
   */
  handleHover(x: number, y: number): OrbitalState | null {
    const target = this.findProductAt(x, y)
    const newHoveredId = target?.id ?? null

    if (newHoveredId !== this.hoveredId) {
      // Limpiar hover anterior
      if (this.hoveredId) {
        const prev = this.products.find((p) => p.id === this.hoveredId)
        if (prev) prev.hovered = false
      }
      // Setear nuevo hover
      if (newHoveredId && target) {
        target.hovered = true
      }
      this.hoveredId = newHoveredId
    }

    return target
  }

  /**
   * Libera el producto anclado
   */
  releaseAnchored() {
    if (!this.anchoredId) return

    const anchored = this.products.find((p) => p.id === this.anchoredId)
    if (anchored) {
      anchored.anchored = false
      // Reanudar con velocidad aleatoria
      const speed = this.randomSpeed()
      const angle = Math.random() * Math.PI * 2
      anchored.vx = Math.cos(angle) * speed
      anchored.vy = Math.sin(angle) * speed
    }
    this.anchoredId = null
  }

  /**
   * Busca el producto en las coordenadas (x, y)
   * Retorna null si no hay ninguno
   */
  private findProductAt(x: number, y: number): OrbitalState | null {
    // Priorizar el anclado si está clickeado (siempre detectable)
    for (let i = this.products.length - 1; i >= 0; i--) {
      const p = this.products[i]
      const dx = x - p.x
      const dy = y - p.y
      // El producto anclado tiene un hitbox más grande para facilitar el click
      const hitRadius = p.anchored ? p.radius * 1.5 : p.radius
      if (dx * dx + dy * dy < hitRadius * hitRadius) {
        return p
      }
    }
    return null
  }

  /**
   * Devuelve todos los productos (para renderizar)
   */
  getProducts(): readonly OrbitalState[] {
    return this.products
  }

  /**
   * Devuelve el producto anclado actualmente (o null)
   */
  getAnchored(): OrbitalState | null {
    if (!this.anchoredId) return null
    return this.products.find((p) => p.id === this.anchoredId) ?? null
  }

  /**
   * Actualiza el tamaño del viewport (cuando el usuario redimensiona la ventana)
   */
  resize(width: number, height: number) {
    this.width = width
    this.height = height

    // Re-posicionar productos anclados al nuevo centro
    if (this.anchoredId) {
      const anchored = this.products.find((p) => p.id === this.anchoredId)
      if (anchored) {
        anchored.x = width / 2
        anchored.y = height / 2
      }
    }
  }
}
