# Algoritmo del muro de Trickest

## Objetivo

Dar visibilidad a lo que sucede en la comunidad sin convertir el muro en un concurso de popularidad donde las noticias recientes desaparecen. La primera versión debe ser sencilla, explicable y fácil de ajustar con datos reales.

## Estado actual

- El muro mezcla eventos de usuarios, equipos, desafíos, envíos aprobados, spots visibles y productos recientes de la tienda.
- Cada tipo de evento se identifica por su origen y cuenta con reacciones persistidas en `WallActivity` y `WallReaction`.
- Cada usuario puede tener una sola reacción por actividad: `LIKE`, `LOVE`, `LAUGH`, `WOW` o `ANGRY`.
- La página obtiene hasta ocho eventos recientes de cada categoría, los mezcla y muestra hasta 24.
- Todavía no hay publicaciones libres de usuarios ni una tabla de impresiones del feed.

## Propuesta para el feed v1

Usar **recencia como criterio principal** y dar un **impulso moderado por reacciones**:

1. Obtener un conjunto reciente de eventos elegibles.
2. Separar el conjunto en ventanas cortas de tiempo para que una noticia más antigua no desplace noticias nuevas solo por acumular reacciones durante más tiempo.
3. Ordenar principalmente por fecha dentro de esas ventanas; dentro de ventanas comparables, destacar actividades con más reacciones.
4. Aplicar un límite por categoría al llenar la página para mantener variedad entre personas, equipos, desafíos, videos, spots y productos.
5. Usar desempates deterministas (fecha y luego ID) para evitar que el feed cambie de orden en cada carga sin una causa clara.

El intervalo de las ventanas, el horizonte de noticias y la intensidad del impulso deben tratarse como **parámetros de prueba**, no como reglas permanentes. Conviene comenzar con ventanas de pocas horas y ajustar después de revisar el volumen real de actividad.

### Puntuación candidata para experimentar

Si más adelante se necesita una fórmula única, probar una puntuación con dos partes:

```text
popularidad = log(1 + suma de reacciones)
score = componente_de_recencia + impulso_limitado(popularidad)
```

La recencia debe dominar y el impulso debe tener un tope. Inicialmente todas las reacciones cuentan igual; no hay una razón de producto para valorar más `LOVE` que `LIKE`, por ejemplo. No usar solo el total bruto de reacciones: favorece las publicaciones antiguas y no distingue exposición de interés.

La fórmula no se implementa en esta etapa. Primero hay que decidir y medir la ventana de recencia, el tamaño de página y el límite por categoría.

## Reglas de elegibilidad

- Usuarios nuevos: mostrar solo perfiles activos y completos.
- Equipos: mostrar solo equipos activos.
- Desafíos: mostrar cuando existan y estén disponibles para la comunidad; no incluir borradores si se añade ese estado.
- Envíos: mostrar únicamente aprobados y con video reproducible.
- Spots: mostrar solo cuando el creador esté activo y tenga `showOnMap` habilitado; no exponer coordenadas exactas en la tarjeta.
- Productos: anunciar como novedad solo productos publicados en los últimos 30 días de la categoría configurada para la tienda; enlazar directamente a la ficha externa y no anunciar como nuevos los productos antiguos del catálogo.
- Ocultar o excluir una actividad si su contenido de origen deja de ser visible.
- Las reacciones del muro son distintas de los votos que evalúan envíos.

## Arquitectura a seguir

1. **No recalcular el ranking completo del leaderboard en cada petición del muro.** El ranking de skaters tiene su propio objetivo y fuente de datos.
2. Mantener identificadores persistentes de actividad para asociar reacciones de forma estable.
3. Para ordenar con reacciones, obtener el conjunto candidato y sus agregados en el servidor; no confiar en conteos enviados por el cliente.
4. Añadir paginación cursor-based cuando se deje de mostrar una muestra pequeña. Evitar `skip/offset` para un feed que cambia con frecuencia.
5. Las publicaciones de usuario deben ser otro tipo de actividad con permisos y moderación definidos antes de permitir escritura. No reutilizar campos de eventos automáticos para contenido libre.

## Métricas de prueba

Al evaluar el orden, revisar:

- proporción de cada categoría en las primeras 20 noticias;
- edad de la noticia más antigua en ese bloque;
- distribución de reacciones por tipo y por actividad;
- cuántas noticias nuevas quedan fuera del primer bloque;
- estabilidad del orden entre cargas sin nuevas actividades ni reacciones.

Sin impresiones o vistas por actividad, las reacciones son una señal incompleta de popularidad. No presentar el resultado como “lo más popular” con precisión estadística; llamarlo **relevancia** o **destacados recientes**.

## Decisiones pendientes

- Definir el tamaño del primer bloque del feed y cuánto tiempo se considera “reciente”.
- Definir cuántas noticias de una misma categoría pueden aparecer seguidas.
- Decidir si se ofrecerá un selector explícito entre “Recientes” y “Destacados”.
- Definir política de moderación, edición y reporte antes de habilitar publicaciones de usuarios premium.
- Considerar registrar impresiones solo si luego se necesita comparar tasas de reacción y no únicamente conteos.
