import type { ConfiguracionItem } from '../../db/schema/configuracion';
import { storageService } from '../../services/storage';
import { recordAudit } from '../../shared/utils/audit';
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
    qrFile?: Express.Multer.File,
    req?: any
  ): Promise<void> {
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (logoFile && !allowedMimes.includes(logoFile.mimetype)) {
      const error: any = new Error('Tipo de archivo de logo no soportado');
      error.statusCode = 400;
      throw error;
    }
    if (qrFile && !allowedMimes.includes(qrFile.mimetype)) {
      const error: any = new Error('Tipo de archivo de QR no soportado');
      error.statusCode = 400;
      throw error;
    }

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
    }

    if (qrFile) {
      payload.qr_data = qrFile.buffer;
      payload.qr_tipo = qrFile.mimetype.split('/')[1] || 'png';
    }

    await this.repo.save(payload);

    if (logoFile) {
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

    await recordAudit({
      usuarioId: req?.user?.id,
      accion: 'CONFIGURACION_ACTUALIZADA',
      entidad: 'configuracion_impresion',
      datosNuevos: {
        nombre_negocio: payload.nombre_negocio,
        ancho_papel: payload.ancho_papel,
        font_size: payload.font_size,
        logo: !!logoFile,
        qr: !!qrFile,
      },
      req,
    });
  }
}
