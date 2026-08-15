/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Usuario autenticado inyectado por el middleware JWT */
    user?: {
      id: number;
      nombre: string;
      apellido?: string;
      email: string;
      rol_id: number;
      rol_nombre?: string;
      [key: string]: any;
    } | null;
  }
}
