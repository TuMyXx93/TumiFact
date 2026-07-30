#!/bin/bash

# Script de testing - ECL FRUVER PostgreSQL Migration
# Prueba CRUD operations desde el frontend

BASE_URL="http://localhost:3000"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  TESTING CRUD OPERATIONS - ECL FRUVER + PostgreSQL${NC}"
echo -e "${BLUE}═════════════════════════════════════════════════════════════${NC}\n"

# ===========================
# 1. TEST PRODUCTOS
# ===========================
echo -e "${YELLOW}1️⃣ TESTING PRODUCTOS${NC}"
echo "─────────────────────────────────────────────────────────────"

# Crear producto
echo -e "${BLUE}   POST /api/productos${NC}"
PRODUCTO_RESPONSE=$(curl -s -X POST "$BASE_URL/api/productos" \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "FRESA-001",
    "nombre": "Fresas Frescas Premium",
    "precio_kg": 15000,
    "precio_unidad": 5000,
    "precio_libra": 6800
  }')

PRODUCTO_ID=$(echo $PRODUCTO_RESPONSE | grep -o '"id":[0-9]*' | cut -d: -f2 | head -1)

if [ -z "$PRODUCTO_ID" ]; then
  echo -e "   ${RED}❌ Error creando producto${NC}"
  echo "   Respuesta: $PRODUCTO_RESPONSE"
  PRODUCTO_ID=1
else
  echo -e "   ${GREEN}✅ Producto creado: ID=$PRODUCTO_ID${NC}"
fi

# Obtener productos
echo -e "${BLUE}   GET /api/productos${NC}"
PRODUCTOS=$(curl -s "$BASE_URL/api/productos?limit=5")
if echo "$PRODUCTOS" | grep -q "Fresas"; then
  echo -e "   ${GREEN}✅ Productos obtenidos correctamente${NC}"
else
  echo -e "   ${YELLOW}⚠️  Respuesta del servidor: $(echo $PRODUCTOS | head -c 100)${NC}"
fi

# Actualizar producto
echo -e "${BLUE}   PUT /api/productos/$PRODUCTO_ID${NC}"
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/productos/$PRODUCTO_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "FRESA-001",
    "nombre": "Fresas Premium Actualizadas",
    "precio_kg": 16000,
    "precio_unidad": 5500,
    "precio_libra": 7200
  }')

if echo "$UPDATE_RESPONSE" | grep -q "actualizado"; then
  echo -e "   ${GREEN}✅ Producto actualizado${NC}"
else
  echo -e "   ${RED}❌ Error actualizando: $UPDATE_RESPONSE${NC}"
fi

# ===========================
# 2. TEST CLIENTES
# ===========================
echo -e "\n${YELLOW}2️⃣ TESTING CLIENTES${NC}"
echo "─────────────────────────────────────────────────────────────"

# Crear cliente
echo -e "${BLUE}   POST /api/clientes${NC}"
CLIENTE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/clientes" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Fruver Central S.A.S.",
    "direccion": "Carrera 50 #25-15, Medellín",
    "telefono": "3015234567"
  }')

CLIENTE_ID=$(echo $CLIENTE_RESPONSE | grep -o '"id":[0-9]*' | cut -d: -f2 | head -1)

if [ -z "$CLIENTE_ID" ]; then
  echo -e "   ${RED}❌ Error creando cliente${NC}"
  echo "   Respuesta: $CLIENTE_RESPONSE"
  CLIENTE_ID=1
else
  echo -e "   ${GREEN}✅ Cliente creado: ID=$CLIENTE_ID${NC}"
fi

# Obtener clientes
echo -e "${BLUE}   GET /api/clientes${NC}"
CLIENTES=$(curl -s "$BASE_URL/api/clientes?limit=5")
if echo "$CLIENTES" | grep -q "Fruver"; then
  echo -e "   ${GREEN}✅ Clientes obtenidos correctamente${NC}"
else
  echo -e "   ${YELLOW}⚠️  Respuesta: $(echo $CLIENTES | head -c 100)${NC}"
fi

# ===========================
# 3. TEST CONFIGURACIÓN
# ===========================
echo -e "\n${YELLOW}3️⃣ TESTING CONFIGURACIÓN${NC}"
echo "─────────────────────────────────────────────────────────────"

# Obtener configuración
echo -e "${BLUE}   GET /api/configuracion${NC}"
CONFIG=$(curl -s "$BASE_URL/api/configuracion")
if echo "$CONFIG" | grep -q "nombre_negocio"; then
  echo -e "   ${GREEN}✅ Configuración obtenida${NC}"
else
  echo -e "   ${RED}❌ Error: $CONFIG${NC}"
fi

# Actualizar configuración
echo -e "${BLUE}   POST /api/configuracion${NC}"
CONFIG_UPDATE=$(curl -s -X POST "$BASE_URL/api/configuracion" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_negocio": "ECL FRUVER - Distribuidora Oficial",
    "direccion": "Calle Principal 123, Medellín",
    "telefono": "+573001234567",
    "nit": "901234567-8",
    "pie_pagina": "Gracias por su compra. Garantía en la calidad.",
    "ancho_papel": 80,
    "font_size": 1
  }')

if echo "$CONFIG_UPDATE" | grep -q "actualizado\|creado"; then
  echo -e "   ${GREEN}✅ Configuración actualizada${NC}"
else
  echo -e "   ${YELLOW}⚠️  Respuesta: $(echo $CONFIG_UPDATE | head -c 150)${NC}"
fi

# ===========================
# 4. TEST BÚSQUEDAS
# ===========================
echo -e "\n${YELLOW}4️⃣ TESTING BÚSQUEDAS${NC}"
echo "─────────────────────────────────────────────────────────────"

# Buscar productos
echo -e "${BLUE}   GET /api/productos/buscar?q=Fresas${NC}"
SEARCH_PRODUCTOS=$(curl -s "$BASE_URL/api/productos/buscar?q=Fresas")
if echo "$SEARCH_PRODUCTOS" | grep -q "Fresas"; then
  echo -e "   ${GREEN}✅ Búsqueda de productos funciona${NC}"
else
  echo -e "   ${YELLOW}⚠️  Búsqueda: $SEARCH_PRODUCTOS${NC}"
fi

# Buscar clientes
echo -e "${BLUE}   GET /api/clientes/buscar?q=Fruver${NC}"
SEARCH_CLIENTES=$(curl -s "$BASE_URL/api/clientes/buscar?q=Fruver")
if echo "$SEARCH_CLIENTES" | grep -q "Fruver"; then
  echo -e "   ${GREEN}✅ Búsqueda de clientes funciona${NC}"
else
  echo -e "   ${YELLOW}⚠️  Búsqueda: $SEARCH_CLIENTES${NC}"
fi

# ===========================
# 5. TEST FACTURAS
# ===========================
echo -e "\n${YELLOW}5️⃣ TESTING FACTURAS${NC}"
echo "─────────────────────────────────────────────────────────────"

# Crear factura
echo -e "${BLUE}   POST /api/facturas${NC}"
FACTURA_RESPONSE=$(curl -s -X POST "$BASE_URL/api/facturas" \
  -H "Content-Type: application/json" \
  -d "{
    \"cliente_id\": $CLIENTE_ID,
    \"total\": 75000,
    \"forma_pago\": \"efectivo\",
    \"productos\": [
      {
        \"producto_id\": $PRODUCTO_ID,
        \"cantidad\": 5,
        \"precio\": 15000,
        \"unidad\": \"KG\",
        \"subtotal\": 75000
      }
    ]
  }")

FACTURA_ID=$(echo $FACTURA_RESPONSE | grep -o '"id":[0-9]*' | cut -d: -f2 | head -1)

if [ -z "$FACTURA_ID" ]; then
  echo -e "   ${RED}❌ Error creando factura${NC}"
  echo "   Respuesta: $FACTURA_RESPONSE"
  FACTURA_ID=1
else
  echo -e "   ${GREEN}✅ Factura creada: ID=$FACTURA_ID${NC}"
fi

# Obtener detalles de factura
echo -e "${BLUE}   GET /api/facturas/$FACTURA_ID/detalles${NC}"
FACTURA_DETALLES=$(curl -s "$BASE_URL/api/facturas/$FACTURA_ID/detalles")
if echo "$FACTURA_DETALLES" | grep -q "cliente\|productos"; then
  echo -e "   ${GREEN}✅ Detalles de factura obtenidos${NC}"
else
  echo -e "   ${RED}❌ Error: $FACTURA_DETALLES${NC}"
fi

# ===========================
# RESUMEN
# ===========================
echo -e "\n${BLUE}═════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ TESTING COMPLETADO${NC}"
echo -e "${BLUE}═════════════════════════════════════════════════════════════${NC}"
echo ""
echo "📊 Datos de Prueba Creados:"
echo "   • Producto: ID=$PRODUCTO_ID (Fresas Premium)"
echo "   • Cliente: ID=$CLIENTE_ID (Fruver Central)"
echo "   • Factura: ID=$FACTURA_ID"
echo ""
echo "🔗 URLs para verificar en el navegador:"
echo "   • http://localhost:3000/                    (Inicio)"
echo "   • http://localhost:3000/productos           (Gestión de Productos)"
echo "   • http://localhost:3000/clientes            (Gestión de Clientes)"
echo "   • http://localhost:3000/configuracion       (Configuración)"
echo "   • http://localhost:3000/facturas/$FACTURA_ID/imprimir (Vista de Factura)"
echo ""
