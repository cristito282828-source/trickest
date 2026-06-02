import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

// Debug solo en desarrollo con flag explícito
const DEBUG_AUTH = process.env.NODE_ENV === 'development' && process.env.DEBUG_AUTH === 'true';

if (DEBUG_AUTH) {
  console.log('[AUTH] Debug mode enabled');
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Lazy load dependencies
        const prisma = (await import('@/app/lib/prisma')).default;
        const bcrypt = await import('bcryptjs');

        if (!credentials?.email || !credentials?.password) {
          if (DEBUG_AUTH) console.log('[AUTH] Missing email or password');
          throw new Error('Email y contraseña son requeridos');
        }

        // Buscar usuario en la BD
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          if (DEBUG_AUTH) console.log('[AUTH] User not found');
          throw new Error('Credenciales inválidas');
        }

        if (!user.password) {
          if (DEBUG_AUTH) console.log('[AUTH] User has no password set');
          throw new Error('Credenciales inválidas');
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          if (DEBUG_AUTH) console.log('[AUTH] Invalid password');
          throw new Error('Credenciales inválidas');
        }

        if (DEBUG_AUTH) console.log('[AUTH] Authentication successful');

        // Retornar usuario para la sesión
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          image: user.photo,
        };
      }
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60, // Actualizar token cada 24 horas
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  callbacks: {
    async signIn({ user, account }) {
      // Auto-crear usuario en BD cuando hace login con Google
      if (account?.provider === 'google' && user.email) {
        try {
          // Lazy load prisma
          const prisma = (await import('@/app/lib/prisma')).default;

          // Verificar si el usuario ya existe
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          // Si no existe, crearlo con datos de Google (sin contraseña aún)
          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || '',
                photo: user.image || '',
                profileStatus: 'basic', // Solo tiene datos de Google
                password: null, // Sin contraseña todavía
                createdAt: new Date(),
              },
            });
            if (DEBUG_AUTH) console.log('[AUTH] New Google user created');
          }
          // Si existe pero no tiene contraseña, el modal se mostrará en el cliente
        } catch (error) {
          if (DEBUG_AUTH) console.error('[AUTH] Error creating user:', error);
          // Permitir el login aunque falle la creación en BD
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        if (DEBUG_AUTH) console.log('[JWT] Token created for user');
      }

      // Obtener profileStatus, hasPassword y role de la BD
      if (token.email) {
        try {
          // Lazy load prisma
          const prisma = (await import('@/app/lib/prisma')).default;

           const dbUser = await prisma.user.findUnique({
             where: { email: token.email as string },
             select: {
               profileStatus: true,
               password: true,
               role: true,
               username: true,
             },
           });

           if (!dbUser) {
             if (DEBUG_AUTH) console.log('[JWT] User not found in DB');
           }

           token.profileStatus = dbUser?.profileStatus || 'basic';
           token.hasPassword = !!dbUser?.password; // true si tiene contraseña
           token.role = dbUser?.role || 'skater';
            token.username = dbUser?.username || undefined;
        } catch (error) {
          if (DEBUG_AUTH) console.error('[JWT] Error fetching user data:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.profileStatus = token.profileStatus as string;
        session.user.hasPassword = token.hasPassword as boolean;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  debug: process.env.NODE_ENV === 'development',
};
