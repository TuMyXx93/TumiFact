import { ClientesRepository } from './clientes.repository';
import { CreateClienteInput, UpdateClienteInput } from './clientes.dto';
import { ClienteItem } from '../../db/schema/clientes';

export class ClientesService {
  constructor(private repo: ClientesRepository = new ClientesRepository()) {}

  async getClientes(): Promise<ClienteItem[]> {
    return await this.repo.findAll();
  }

  async searchClientes(query: string): Promise<ClienteItem[]> {
    return await this.repo.search(query);
  }

  async getClienteById(id: number): Promise<ClienteItem | null> {
    return await this.repo.findById(id);
  }

  async createCliente(input: CreateClienteInput): Promise<ClienteItem> {
    return await this.repo.create({
      nombre: input.nombre.trim(),
      direccion: input.direccion ? input.direccion.trim() : null,
      telefono: input.telefono ? input.telefono.trim() : null
    });
  }

  async updateCliente(id: number, input: UpdateClienteInput): Promise<ClienteItem | null> {
    return await this.repo.update(id, {
      ...(input.nombre && { nombre: input.nombre.trim() }),
      ...(input.direccion !== undefined && { direccion: input.direccion ? input.direccion.trim() : null }),
      ...(input.telefono !== undefined && { telefono: input.telefono ? input.telefono.trim() : null })
    });
  }

  async deleteCliente(id: number): Promise<boolean> {
    return await this.repo.delete(id);
  }
}
