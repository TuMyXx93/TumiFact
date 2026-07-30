// pnpm hook configuration
// Este archivo permite customizar el comportamiento de pnpm para casos especiales

function readPackage(pkg) {
  // Aquí se pueden agregar hooks para resolver conflictos de dependencias
  // Ejemplo: peerDependencies forcing, overrides, etc.
  
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
