import type { ConfiguracionItem } from '../../db/schema/configuracion';
import { storageService } from '../../services/storage';
import type { SaveConfiguracionInput } from './configuracion.dto';
import { ConfiguracionRepository } from './configuracion.repository';

export class ConfiguracionService {
  constructor(private repo: ConfiguracionRepository = new ConfiguracionRepository()) {}

  async getConfiguracion(): Promise<Partial<ConfiguracionItem>> {
    const config = await this.repo.findFirst();
    if (!config) {
      return {
        nombre_negocio: '',
        direccion: '',
        telefono: '',
        nit: '',
        pie_pagina: '',
        ancho_papel: 80,
        font_size: 1,
      };
    }
    const { logo_data, qr_data, ...cleanConfig } = config;
    return cleanConfig;
  }

  async saveConfiguracion(
    input: SaveConfiguracionInput,
    logoFile?: Express.Multer.File,
    qrFile?: Express.Multer.File
  ): Promise<void> {
    const payload: any = {
      nombre_negocio: input.nombre_negocio.trim(),
      direccion: input.direccion ? input.direccion.trim() : null,
      telefono: input.telefono ? input.telefono.trim() : null,
      nit: input.nit ? input.nit.trim() : null,
      pie_pagina: input.pie_pagina ? input.pie_pagina.trim() : null,
      ancho_papel: input.ancho_papel || 80,
      font_size: input.font_size || 1,
    };

    if (logoFile) {
      payload.logo_data = logoFile.buffer;
      payload.logo_tipo = logoFile.mimetype.split('/')[1] || 'png';
      await storageService.uploadFile(
        {
          buffer: logoFile.buffer,
          filename: logoFile.originalname,
          mimetype: logoFile.mimetype,
          size: logoFile.size,
        },
        'logos'
      );
    }

    if (qrFile) {
      payload.qr_data = qrFile.buffer;
      payload.qr_tipo = qrFile.mimetype.split('/')[1] || 'png';
      await storageService.uploadFile(
        {
          buffer: qrFile.buffer,
          filename: qrFile.originalname,
          mimetype: qrFile.mimetype,
          size: qrFile.size,
        },
        'qr'
      );
    }

    await this.repo.save(payload);
  }
}
