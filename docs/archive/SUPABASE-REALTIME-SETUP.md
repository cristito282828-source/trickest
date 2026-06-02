# Configurar Supabase Realtime para Notificaciones

## Problema
Las notificaciones requieren recargar la página para aparecer.

## Solución
Habilitar Supabase Realtime en la tabla `notifications`.

## Pasos

### 1. Ir al Dashboard de Supabase
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto

### 2. Habilitar Replication
1. En el menú lateral, ve a **Database** → **Replication**
2. Busca la tabla `notifications` en la lista
3. Haz clic en el **toggle** para habilitar replication
4. Asegúrate de que diga "Realtime: Enabled"

### 3. Verificar (opcional)
1. Ve a **Database** → **Realtime**
2. Deberías ver `notifications` en la lista de tablas con Realtime habilitado

## Cómo funciona

**Sin Realtime (actual):**
- Usuario comenta → DB inserta → Usuario B recarga página → Ve notificación ❌

**Con Realtime (correcto):**
- Usuario comenta → DB inserta → Supabase envía por WebSocket → Usuario B ve notificación instantáneamente ✅

## Probar

1. Abre la app en dos navegadores (o incógnito)
2. En **Browser A**: Comenta en un spot
3. En **Browser B**: Deberías ver el badge actualizar en **< 1 segundo** sin recargar

## Logs de Debug

Abre la consola del navegador para ver:
- `🔔 Suscribiendo a notificaciones para: userEmail`
- `🔔 Nueva notificación recibida:` cuando llegue una nueva
- `🔔 Status del canal: SUBSCRIBED` cuando se conecte

## Troubleshooting

**No se suscribe:**
- Verifica que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` están en `.env`
- Revisa la consola para errores de conexión

**No llegan notificaciones:**
- Verifica que la tabla `notifications` tiene Realtime habilitado
- Revisa el filtro: `userId=eq.userEmail` debe coincidir con el email del usuario

**Error de permisos:**
- Verifica que el RLS (Row Level Security) permite leer notificaciones del usuario actual
- La policy debería ser: `user_id = auth.uid()` o similar para el email
