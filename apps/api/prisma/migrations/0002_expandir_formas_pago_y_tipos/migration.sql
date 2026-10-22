-- 0002: Expandir medios de pago y agregar tipo de factura para cambios
-- Contexto: el POS professional soporta efectivo, tarjeta, transferencia y mixto.
-- El CHECK heredado del legacy solo permitia efectivo/transferencia.

ALTER TABLE facturas DROP CONSTRAINT IF EXISTS facturas_forma_pago_check;

ALTER TABLE facturas
  ADD CONSTRAINT facturas_forma_pago_check
  CHECK (forma_pago::text = ANY (ARRAY['efectivo','tarjeta','transferencia','mixto']::text[]));

-- Permite registrar el tipo 'cambio' en la factura generada por un cambio de artículo.
ALTER TABLE facturas DROP CONSTRAINT IF EXISTS facturas_tipo_check;
ALTER TABLE facturas
  ADD CONSTRAINT facturas_tipo_check
  CHECK (tipo::text = ANY (ARRAY['contado','separado_final','cambio']::text[]));

-- El estado de la factura original refleja devoluciones sin alterar sus líneas.
ALTER TABLE facturas DROP CONSTRAINT IF EXISTS facturas_estado_check;
ALTER TABLE facturas
  ADD CONSTRAINT facturas_estado_check
  CHECK (estado::text = ANY (
    ARRAY['completada','anulada','devuelta','parcialmente_devuelta']::text[]
  ));
