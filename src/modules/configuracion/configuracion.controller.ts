import type { Request, Response } from 'express';
import { Router } from 'express';
import multer from 'multer';
import { requireRole, verifyAuth } from '../../shared/middleware/auth';
import { validateDTO } from '../../shared/middleware/validate';
import { SaveConfiguracionDTO } from './configuracion.dto';
import { ConfiguracionService } from './configuracion.service';

export const configuracionRouter = Router();
const service = new ConfiguracionService();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

configuracionRouter.get('/', verifyAuth, async (req: Request, res: Response) => {
  try {
    const data = await service.getConfiguracion();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

configuracionRouter.post(
  '/',
  verifyAuth,
  requireRole('admin'),
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'qr', maxCount: 1 },
  ]),
  validateDTO(SaveConfiguracionDTO),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const logoFile = files?.logo ? files.logo[0] : undefined;
      const qrFile = files?.qr ? files.qr[0] : undefined;

      await service.saveConfiguracion(req.body, logoFile, qrFile);
      res.json({ message: 'Configuración guardada exitosamente' });
    } catch (error: any) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);
