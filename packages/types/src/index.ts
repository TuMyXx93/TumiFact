// Re-export de tipos del backend para frontend
// Por ahora re-exporta desde schemas; en el futuro tipos puros sin Zod
export type { LoginInput, RegisterUserInput } from '@tumifact/schemas';
export type { CreateProductoInput, UpdateProductoInput } from '@tumifact/schemas';
export type { CreateClienteInput, UpdateClienteInput } from '@tumifact/schemas';
export type { CreateFacturaInput, DetalleFacturaInput } from '@tumifact/schemas';
export type { AbrirCajaInput, CerrarCajaInput } from '@tumifact/schemas';
export type { CreateSeparadoInput, CreateAbonoInput } from '@tumifact/schemas';
