import { ProductosRepository } from './productos.repository';
import { CreateProductoInput, UpdateProductoInput } from './productos.dto';
import { ProductoItem } from '../../db/schema/productos';

export class ProductosService {
  constructor(private repo: ProductosRepository = new ProductosRepository()) {}

  async getProductos(): Promise<ProductoItem[]> {
    return await this.repo.findAll();
  }

  async searchProductos(query: string): Promise<ProductoItem[]> {
    return await this.repo.search(query);
  }

  async getProductoById(id: number): Promise<ProductoItem | null> {
    return await this.repo.findById(id);
  }

  async createProducto(input: CreateProductoInput): Promise<ProductoItem> {
    const existing = await this.repo.findByCodigo(input.codigo.trim());
    if (existing) {
      const error: any = new Error('Ya existe un producto con ese código');
      error.statusCode = 400;
      error.code = '23505';
      throw error;
    }

    return await this.repo.create({
      codigo: input.codigo.trim(),
      nombre: input.nombre.trim(),
      precio_kg: (input.precio_kg ?? 0).toString(),
      precio_unidad: (input.precio_unidad ?? 0).toString(),
      precio_libra: (input.precio_libra ?? 0).toString()
    });
  }

  async updateProducto(id: number, input: UpdateProductoInput): Promise<ProductoItem | null> {
    return await this.repo.update(id, {
      ...(input.codigo && { codigo: input.codigo.trim() }),
      ...(input.nombre && { nombre: input.nombre.trim() }),
      ...(input.precio_kg !== undefined && { precio_kg: input.precio_kg.toString() }),
      ...(input.precio_unidad !== undefined && { precio_unidad: input.precio_unidad.toString() }),
      ...(input.precio_libra !== undefined && { precio_libra: input.precio_libra.toString() })
    });
  }

  async deleteProducto(id: number): Promise<boolean> {
    return await this.repo.delete(id);
  }
}
