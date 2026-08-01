const { body, validationResult } = require('express-validator');

const formatErrors = (req) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formatted = {};
        errors.array().forEach(err => {
            if (!formatted[err.path]) {
                formatted[err.path] = err.msg;
            }
        });
        return formatted;
    }
    return null;
};

const handleValidation = (req, res, next) => {
    const errors = formatErrors(req);
    if (errors) {
        return res.status(400).json({ error: 'Validación fallida', details: errors });
    }
    next();
};

const validateProductos = [
    body('codigo')
        .notEmpty().withMessage('El código es requerido')
        .isString().withMessage('El código debe ser texto'),
    body('nombre')
        .notEmpty().withMessage('El nombre es requerido')
        .isString().withMessage('El nombre debe ser texto'),
    body('precio_kg')
        .optional()
        .isFloat({ min: 0 }).withMessage('precio_kg debe ser numérico >= 0'),
    body('precio_unidad')
        .optional()
        .isFloat({ min: 0 }).withMessage('precio_unidad debe ser numérico >= 0'),
    body('precio_libra')
        .optional()
        .isFloat({ min: 0 }).withMessage('precio_libra debe ser numérico >= 0'),
    handleValidation
];

const validateClientes = [
    body('nombre')
        .notEmpty().withMessage('El nombre es requerido')
        .isString().withMessage('El nombre debe ser texto'),
    body('telefono')
        .optional()
        .isString().withMessage('El teléfono debe ser texto'),
    handleValidation
];

const validateFacturas = [
    body('cliente_id')
        .isInt({ min: 1 }).withMessage('cliente_id debe ser un entero > 0'),
    body('productos')
        .isArray({ min: 1 }).withMessage('productos debe ser un array no vacío'),
    body('productos.*.producto_id')
        .isInt({ min: 1 }).withMessage('producto_id debe ser un entero > 0'),
    body('productos.*.cantidad')
        .isFloat({ min: 0.01 }).withMessage('cantidad debe ser numérico > 0'),
    body('productos.*.precio')
        .isFloat({ min: 0 }).withMessage('precio debe ser numérico >= 0'),
    body('productos.*.unidad')
        .optional()
        .isIn(['KG', 'UND', 'LB']).withMessage('unidad debe ser KG, UND o LB'),
    handleValidation
];

module.exports = {
    validateProductos,
    validateClientes,
    validateFacturas,
    handleValidation
};
