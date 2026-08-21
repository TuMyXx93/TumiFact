// Re-export de tipos del backend para frontend
// Por ahora re-exporta desde schemas; en el futuro tipos puros sin Zod
export type {
  AbrirCajaInput,
  CerrarCajaInput,
  CreateAbonoInput,
  CreateClienteInput,
  CreateFacturaInput,
  CreateProductoInput,
  CreateSeparadoInput,
  DetalleFacturaInput,
  LoginInput,
  RegisterUserInput,
  UpdateClienteInput,
  UpdateProductoInput,
} from '@tumifact/schemas';
