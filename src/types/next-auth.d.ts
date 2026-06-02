import { Session } from "next-auth";

// Extender el tipo de sesión para incluir el accessToken, profileStatus, hasPassword y role
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      profileStatus?: string;
      hasPassword?: boolean;
      role?: string;
      username?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    profileStatus?: string;
    hasPassword?: boolean;
    role?: string;
    username?: string;
  }
}
