/**
 * Cache de imágenes para los productos orbitales
 *
 * Pre-carga las imágenes de los productos de Tory Skateshop en paralelo
 * antes de que la animación empiece, así aparecen desde el primer frame.
 */

const imageCache = new Map<string, HTMLImageElement>()
const loadingPromises = new Map<string, Promise<HTMLImageElement>>()

/**
 * Carga una imagen y la cachea. Si ya está cacheada, la retorna inmediatamente.
 * Si está en proceso de carga, retorna la misma promise (dedup).
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  // Si ya está cacheada, retornar inmediatamente
  const cached = imageCache.get(url)
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached)
  }

  // Si ya está cargando, retornar la misma promise
  const loading = loadingPromises.get(url)
  if (loading) return loading

  // Cargar nueva imagen
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    // crossOrigin para permitir export a canvas si lo necesitamos después
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageCache.set(url, img)
      loadingPromises.delete(url)
      resolve(img)
    }
    img.onerror = () => {
      loadingPromises.delete(url)
      reject(new Error(`Failed to load image: ${url}`))
    }
    img.src = url
  })

  loadingPromises.set(url, promise)
  return promise
}

/**
 * Pre-carga un batch de imágenes en paralelo.
 * @param urls - Array de URLs a pre-cargar
 * @returns Promise que resuelve cuando TODAS están cargadas (o fallaron)
 */
export async function preloadAll(urls: string[]): Promise<void> {
  // Filtrar URLs vacías y dedup
  const uniqueUrls = Array.from(new Set(urls.filter((u) => u && u.length > 0)))
  if (uniqueUrls.length === 0) return

  // Filtrar las que NO están ya cacheadas
  const toLoad = uniqueUrls.filter((url) => {
    const cached = imageCache.get(url)
    return !cached || !cached.complete || cached.naturalWidth === 0
  })

  if (toLoad.length === 0) return

  // Cargar todas en paralelo
  await Promise.allSettled(toLoad.map((url) => loadImage(url)))
}

/**
 * Obtiene una imagen cacheada (sync). Retorna null si no está cargada aún.
 */
export function getCachedImage(url: string): HTMLImageElement | null {
  const img = imageCache.get(url)
  if (img && img.complete && img.naturalWidth > 0) {
    return img
  }
  return null
}

/**
 * Limpia el cache de imágenes (útil para tests o memory cleanup).
 */
export function clearImageCache(): void {
  imageCache.clear()
  loadingPromises.clear()
}

/**
 * Devuelve el tamaño del cache (útil para debug).
 */
export function getCacheSize(): number {
  return imageCache.size
}
