import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit2,
  FileText,
  KeyRound,
  Lock,
  Mail,
  Percent,
  Phone,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { type Socket, io as socketIOClient } from 'socket.io-client';
import { apiFetch, resolveApiBaseUrl } from '../../lib/apiClient';
import { formatDate, formatNumber, formatTime } from '../../lib/format';

export interface Empleado {
  id: number;
  usuario_id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  numero_identificacion?: string;
  tipo_identificacion?: string;
  tipo_identificacion_id?: number;
  rol_id: number;
  rol_nombre: string;
  cargo: string;
  departamento?: string;
  salario: number;
  turno: string;
  descuento_max_porcentaje: number;
  descuento_max_monto: number;
  activo: boolean;
  ultimo_login?: string;
  created_at?: string;
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface TipoDoc {
  id: number;
  codigo: string;
  nombre: string;
}

export interface AuditLog {
  id: number | string;
  usuario_id?: number;
  usuario_nombre?: string;
  usuario_apellido?: string;
  rol_nombre?: string;
  accion: string;
  entidad?: string;
  entidad_id?: number;
  resultado: string;
  mensaje_error?: string;
  ip_address?: string;
  created_at: string;
}

export interface MetricasResponse {
  resumen?: {
    total_empleados: string | number;
    activos: string | number;
    inactivos: string | number;
    salario_promedio: string | number;
  };
  ventasPorEmpleado?: Array<{
    usuario_id: number;
    nombre: string;
    apellido: string;
    rol_nombre: string;
    total_vendido: string | number;
    total_facturas: string | number;
    ticket_promedio: string | number;
  }>;
  desempenoCaja?: Array<{
    usuario_id: number;
    nombre: string;
    apellido: string;
    total_turnos_cerrados: string | number;
    diferencia_acumulada: string | number;
  }>;
}

interface EmpleadoManagerProps {
  initialEmpleados: Empleado[];
  initialRoles: Rol[];
  initialTiposDoc: TipoDoc[];
}

// Evaluador semaforizado de fortaleza de contraseña
function evaluatePasswordStrength(password: string) {
  if (!password) {
    return {
      score: 0,
      label: 'Sin contraseña',
      color: 'text-slate-500',
      barColor: 'bg-slate-700',
      hasLength: false,
      hasUpper: false,
      hasLower: false,
      hasNumber: false,
      hasSpecial: false,
    };
  }

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (password.length >= 6) score += 1;
  if (hasLength) score += 1;
  if (hasUpper && hasLower) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  if (score <= 2) {
    return {
      score,
      label: 'Débil',
      color: 'text-rose-400',
      barColor: 'bg-rose-500',
      hasLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    };
  }
  if (score === 3) {
    return {
      score,
      label: 'Media',
      color: 'text-amber-400',
      barColor: 'bg-amber-500',
      hasLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    };
  }
  if (score === 4) {
    return {
      score,
      label: 'Fuerte',
      color: 'text-emerald-400',
      barColor: 'bg-emerald-500',
      hasLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    };
  }
  return {
    score,
    label: 'Muy Segura',
    color: 'text-emerald-300',
    barColor: 'bg-emerald-400',
    hasLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
  };
}

export default function EmpleadoManager({
  initialEmpleados = [],
  initialRoles = [],
  initialTiposDoc = [],
}: EmpleadoManagerProps) {
  const [activeTab, setActiveTab] = useState<'directorio' | 'metricas' | 'auditoria'>('directorio');
  const [empleados, setEmpleados] = useState<Empleado[]>(initialEmpleados);
  const [roles] = useState<Rol[]>(initialRoles);
  const [tiposDoc] = useState<TipoDoc[]>(initialTiposDoc);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Estados de métricas y auditoría
  const [metricas, setMetricas] = useState<MetricasResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditFilterUser, setAuditFilterUser] = useState<string>('');

  // Estado del Modal de Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Empleado | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    tipo_identificacion_id: 1,
    numero_identificacion: '',
    email: '',
    telefono: '',
    password: '',
    rol_id: 3,
    cargo: 'Vendedor/Cajero',
    departamento: 'Caja',
    salario: 1600000,
    turno: 'completo',
    descuento_max_porcentaje: 10,
    descuento_max_monto: 50000,
  });

  const passwordStrength = evaluatePasswordStrength(formData.password);

  const fetchEmpleados = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/empleados');
      if (res.ok) {
        const data = await res.json();
        setEmpleados(data || []);
      }
    } catch (err) {
      console.error('Error al recargar empleados:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetricas = async () => {
    try {
      const res = await apiFetch('/api/empleados/metricas');
      if (res.ok) {
        const data = await res.json();
        setMetricas(data);
      }
    } catch (err) {
      console.error('Error al consultar métricas:', err);
    }
  };

  const fetchAuditoria = async (userId?: string) => {
    try {
      const url = userId
        ? `/api/empleados/auditoria?usuario_id=${userId}`
        : '/api/empleados/auditoria';
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data || []);
      }
    } catch (err) {
      console.error('Error al consultar auditoría:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'metricas') {
      fetchMetricas();
    } else if (activeTab === 'auditoria') {
      fetchAuditoria(auditFilterUser);
    } else if (activeTab === 'directorio') {
      fetchEmpleados();
    }
  }, [activeTab, auditFilterUser]);

  // Conexión en tiempo real con WebSockets
  useEffect(() => {
    let socket: Socket | null = null;
    (async () => {
      try {
        const baseUrl = await resolveApiBaseUrl();
        const socketTarget =
          baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
        const storedToken =
          typeof window !== 'undefined'
            ? localStorage.getItem('tumifact_token') ||
              sessionStorage.getItem('tumifact_token') ||
              ''
            : '';

        socket = socketIOClient(socketTarget, {
          transports: ['websocket', 'polling'],
          auth: { token: storedToken },
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
        });

        const handleRealtimeEvent = () => {
          if (activeTab === 'metricas') fetchMetricas();
          if (activeTab === 'auditoria') fetchAuditoria(auditFilterUser);
          if (activeTab === 'directorio') fetchEmpleados();
        };

        socket.on('factura:creada', handleRealtimeEvent);
        socket.on('caja:abierta', handleRealtimeEvent);
        socket.on('caja:cerrada', handleRealtimeEvent);
        socket.on('usuario:conectado', handleRealtimeEvent);
      } catch (err) {
        console.warn('Socket connection error in EmpleadoManager:', err);
      }
    })();

    const interval = setInterval(() => {
      if (activeTab === 'metricas') fetchMetricas();
      if (activeTab === 'auditoria') fetchAuditoria(auditFilterUser);
    }, 6000);

    return () => {
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, [activeTab, auditFilterUser]);

  const handleOpenCreateModal = () => {
    setEditingEmp(null);
    setConfirmPassword('');
    setFormData({
      nombre: '',
      apellido: '',
      tipo_identificacion_id: tiposDoc[0]?.id || 1,
      numero_identificacion: '',
      email: '',
      telefono: '',
      password: '',
      rol_id: roles.find((r) => r.nombre === 'empleado')?.id || 3,
      cargo: 'Vendedor/Cajero',
      departamento: 'Caja',
      salario: 1600000,
      turno: 'completo',
      descuento_max_porcentaje: 10,
      descuento_max_monto: 50000,
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (emp: Empleado) => {
    setEditingEmp(emp);
    setConfirmPassword('');
    setFormData({
      nombre: emp.nombre,
      apellido: emp.apellido,
      tipo_identificacion_id: emp.tipo_identificacion_id || tiposDoc[0]?.id || 1,
      numero_identificacion: emp.numero_identificacion || '',
      email: emp.email,
      telefono: emp.telefono || '',
      password: '',
      rol_id: emp.rol_id,
      cargo: emp.cargo || 'Vendedor/Cajero',
      departamento: emp.departamento || 'Caja',
      salario: emp.salario || 0,
      turno: emp.turno || 'completo',
      descuento_max_porcentaje: emp.descuento_max_porcentaje || 10,
      descuento_max_monto: emp.descuento_max_monto || 50000,
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const res = await apiFetch(`/api/empleados/${id}/toggle-status`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: 'Estado de acceso actualizado exitosamente',
        });
        await fetchEmpleados();
      } else {
        const data = await res.json();
        setStatusMessage({
          type: 'error',
          text: data.error || 'Error al cambiar estado',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Error de conexión con el servidor',
      });
    }
  };

  const handleDeleteEmpleado = async (id: number, nombre: string) => {
    if (
      !confirm(`¿Estás seguro de eliminar a ${nombre}? Esta acción eliminará su cuenta y accesos.`)
    )
      return;

    try {
      const res = await apiFetch(`/api/empleados/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: `Colaborador ${nombre} eliminado exitosamente`,
        });
        await fetchEmpleados();
      } else {
        const data = await res.json();
        setStatusMessage({
          type: 'error',
          text: data.error || 'No se pudo eliminar el empleado',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Error de red al intentar eliminar',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    // Validación de contraseñas
    if (!editingEmp) {
      if (!formData.password || formData.password.length < 6) {
        setStatusMessage({
          type: 'error',
          text: 'La contraseña inicial debe tener al menos 6 caracteres',
        });
        return;
      }
      if (formData.password !== confirmPassword) {
        setStatusMessage({
          type: 'error',
          text: 'Las contraseñas no coinciden. Por favor verifica ambos campos.',
        });
        return;
      }
    } else {
      if (formData.password) {
        if (formData.password.length < 6) {
          setStatusMessage({
            type: 'error',
            text: 'La nueva contraseña debe tener al menos 6 caracteres',
          });
          return;
        }
        if (formData.password !== confirmPassword) {
          setStatusMessage({
            type: 'error',
            text: 'Las nuevas contraseñas no coinciden',
          });
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      if (editingEmp) {
        // Actualizar
        const payload: any = { ...formData };
        if (!payload.password || payload.password.trim() === '') {
          delete payload.password;
        }

        const res = await apiFetch(`/api/empleados/${editingEmp.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok) {
          setStatusMessage({
            type: 'success',
            text: 'Empleado actualizado con éxito',
          });
          setIsModalOpen(false);
          await fetchEmpleados();
        } else {
          const detailMsg = data.details ? Object.values(data.details).join(', ') : data.error;
          setStatusMessage({
            type: 'error',
            text: detailMsg || 'Error al actualizar empleado',
          });
        }
      } else {
        // Crear
        const res = await apiFetch('/api/empleados', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (res.ok) {
          setStatusMessage({
            type: 'success',
            text: 'Nuevo empleado registrado exitosamente',
          });
          setIsModalOpen(false);
          await fetchEmpleados();
        } else {
          const detailMsg = data.details ? Object.values(data.details).join(', ') : data.error;
          setStatusMessage({
            type: 'error',
            text: detailMsg || 'Error al registrar empleado',
          });
        }
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Error inesperado de comunicación con el servidor',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmpleados = empleados.filter((emp) => {
    const term = search.toLowerCase();
    const fullName = `${emp.nombre} ${emp.apellido}`.toLowerCase();
    const doc = (emp.numero_identificacion || '').toLowerCase();
    const email = (emp.email || '').toLowerCase();
    const cargo = (emp.cargo || '').toLowerCase();
    const rol = (emp.rol_nombre || '').toLowerCase();
    return (
      fullName.includes(term) ||
      doc.includes(term) ||
      email.includes(term) ||
      cargo.includes(term) ||
      rol.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast / Alert Status */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border shadow-lg animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3 text-xs font-semibold">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs Principales */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-2 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('directorio')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'directorio'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="h-4 w-4" />
            Directorio del Personal
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-slate-800/80 text-slate-300 border border-slate-700 font-mono">
              {empleados.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('metricas')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'metricas'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Métricas de Rendimiento
          </button>

          <button
            onClick={() => setActiveTab('auditoria')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'auditoria'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="h-4 w-4" />
            Auditoría de Actividad
          </button>
        </div>

        {activeTab === 'directorio' && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            Registrar Colaborador
          </button>
        )}
      </div>

      {/* === VISTA 1: DIRECTORIO DE EMPLEADOS === */}
      {activeTab === 'directorio' && (
        <div className="space-y-4">
          {/* Barra de Búsqueda y Filtros */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por nombre, cédula, cargo, rol o correo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              onClick={fetchEmpleados}
              disabled={loading}
              title="Recargar directorio"
              className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Grilla de Tarjetas de Colaboradores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmpleados.map((emp) => (
              <div
                key={emp.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-4 ${
                  emp.activo
                    ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-md'
                    : 'bg-slate-900/40 border-rose-950/40 opacity-75'
                }`}
              >
                {/* Header Tarjeta */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-white text-sm font-['Outfit'] flex items-center gap-2">
                        {emp.nombre} {emp.apellido}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {emp.cargo || 'Sin cargo asignado'}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                        emp.rol_nombre === 'admin'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : emp.rol_nombre === 'gerente'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}
                    >
                      {emp.rol_nombre}
                    </span>
                  </div>

                  {/* Datos Clave */}
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                    {emp.numero_identificacion && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                        <span className="font-mono">
                          {emp.tipo_identificacion || 'DOC'}: {emp.numero_identificacion}
                        </span>
                      </div>
                    )}
                    {emp.telefono && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                        <span>{emp.telefono}</span>
                      </div>
                    )}
                  </div>

                  {/* Detalles Salariales y Descuentos */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                    <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block">Salario Base</span>
                      <span className="font-bold text-white font-mono">
                        ${formatNumber(emp.salario)}
                      </span>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block">Desc. Máx</span>
                      <span className="font-bold text-amber-300 font-mono">
                        {emp.descuento_max_porcentaje}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span
                      className={`h-2 w-2 rounded-full ${emp.activo ? 'bg-emerald-400' : 'bg-rose-500'}`}
                    />
                    <span>{emp.activo ? 'Acceso Habilitado' : 'Acceso Bloqueado'}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStatus(emp.id)}
                      title={emp.activo ? 'Desactivar acceso' : 'Activar acceso'}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        emp.activo
                          ? 'bg-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                    >
                      {emp.activo ? (
                        <UserX className="h-3.5 w-3.5" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleEditClick(emp)}
                      title="Editar datos"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 border border-slate-700 transition-colors cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteEmpleado(emp.id, `${emp.nombre} ${emp.apellido}`)}
                      title="Eliminar empleado"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === VISTA 2: MÉTRICAS DE RENDIMIENTO === */}
      {activeTab === 'metricas' && (
        <div className="space-y-6">
          {metricas ? (
            <>
              {/* KPIs Globales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Total Colaboradores
                  </p>
                  <p className="text-2xl font-black text-white font-mono mt-1">
                    {metricas.resumen?.total_empleados || 0}
                  </p>
                  <p className="text-[11px] text-emerald-400 mt-1 font-semibold">
                    {metricas.resumen?.activos || 0} con acceso activo
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Inactivos / Bloqueados
                  </p>
                  <p className="text-2xl font-black text-rose-400 font-mono mt-1">
                    {metricas.resumen?.inactivos || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Sin permisos de login</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Salario Promedio
                  </p>
                  <p className="text-2xl font-black text-white font-mono mt-1">
                    ${formatNumber(metricas.resumen?.salario_promedio || 0)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Nómina mensual estimada</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Auditoría
                  </p>
                  <p className="text-2xl font-black text-indigo-400 font-mono mt-1">100%</p>
                  <p className="text-[11px] text-indigo-300 mt-1">Trazabilidad en audit_log</p>
                </div>
              </div>

              {/* Tabla de Rendimiento de Ventas por Empleado */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-white text-sm font-['Outfit']">
                  Ventas Acumuladas por Colaborador
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-3">Colaborador</th>
                        <th className="pb-3">Rol</th>
                        <th className="pb-3 text-right">Facturas Emitidas</th>
                        <th className="pb-3 text-right">Ticket Promedio</th>
                        <th className="pb-3 text-right">Total Facturado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {metricas.ventasPorEmpleado?.map((v: any) => (
                        <tr key={v.usuario_id} className="hover:bg-slate-800/30">
                          <td className="py-3 font-semibold text-white">
                            {v.nombre} {v.apellido}
                          </td>
                          <td className="py-3">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                              {v.rol_nombre}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono text-slate-300">
                            {v.total_facturas}
                          </td>
                          <td className="py-3 text-right font-mono text-slate-300">
                            ${formatNumber(v.ticket_promedio)}
                          </td>
                          <td className="py-3 text-right font-mono font-bold text-emerald-400">
                            ${formatNumber(v.total_vendido)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-600" />
              Cargando métricas de rendimiento...
            </div>
          )}
        </div>
      )}

      {/* === VISTA 3: AUDITORÍA DE ACTIVIDAD === */}
      {activeTab === 'auditoria' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-white text-sm font-['Outfit']">
                Historial Forense de Actividad (Audit Log)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Registro inmutable de transacciones, aperturas de caja, ventas e inicios de sesión.
              </p>
            </div>

            {/* Filtro por Empleado */}
            <select
              value={auditFilterUser}
              onChange={(e) => setAuditFilterUser(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Todos los Colaboradores</option>
              {empleados.map((e) => (
                <option key={e.usuario_id} value={e.usuario_id}>
                  {e.nombre} {e.apellido} ({e.rol_nombre})
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3">Fecha / Hora</th>
                  <th className="pb-3">Usuario</th>
                  <th className="pb-3">Acción</th>
                  <th className="pb-3">Entidad</th>
                  <th className="pb-3">Resultado</th>
                  <th className="pb-3">IP Origen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 text-slate-400 font-mono text-[11px]">
                        {formatDate(log.created_at)} {formatTime(log.created_at)}
                      </td>
                      <td className="py-2.5 font-semibold text-white">
                        {log.usuario_nombre} {log.usuario_apellido}
                        <span className="text-[10px] text-slate-500 block font-normal uppercase">
                          {log.rol_nombre}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className="font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-[10px] border border-blue-500/20 font-bold">
                          {log.accion}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-300 font-mono text-[11px]">
                        {log.entidad} {log.entidad_id ? `#${log.entidad_id}` : ''}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.resultado === 'ok'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {log.resultado}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-slate-500 text-[11px]">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No hay registros de auditoría para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === MODAL NUEVO / EDITAR EMPLEADO === */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base font-['Outfit']">
                {editingEmp ? 'Editar Datos del Empleado' : 'Registrar Nuevo Empleado'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Tipo Doc.
                  </label>
                  <select
                    value={formData.tipo_identificacion_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tipo_identificacion_id: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {tiposDoc.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.codigo} - {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Número Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.numero_identificacion}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numero_identificacion: e.target.value,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* SECCIÓN DE CONTRASEÑA CON VALIDACIÓN SEMAFORIZADA */}
              <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      {editingEmp ? 'Cambiar Contraseña (Opcional)' : 'Contraseña Inicial *'}
                    </label>
                    <input
                      type="password"
                      required={!editingEmp}
                      placeholder={
                        editingEmp ? 'Dejar en blanco para conservar' : 'Mínimo 6 caracteres'
                      }
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Confirmar Contraseña {formData.password ? '*' : ''}
                    </label>
                    <input
                      type="password"
                      required={!editingEmp || !!formData.password}
                      placeholder="Repite la contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full bg-slate-800 border rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${
                        formData.password &&
                        confirmPassword &&
                        formData.password !== confirmPassword
                          ? 'border-rose-500 focus:border-rose-500'
                          : formData.password &&
                              confirmPassword &&
                              formData.password === confirmPassword
                            ? 'border-emerald-500 focus:border-emerald-500'
                            : 'border-slate-700 focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Semáforo e Indicador de Fortaleza */}
                {formData.password.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">
                        Seguridad de la contraseña:
                      </span>
                      <span className={`font-bold ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </span>
                    </div>

                    {/* Barra de Progreso Semafórica */}
                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${passwordStrength.barColor}`}
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                        }}
                      />
                    </div>

                    {/* Criterios Visuales */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px] text-slate-400 pt-1">
                      <span
                        className={`flex items-center gap-1 ${formData.password.length >= 8 ? 'text-emerald-400' : 'text-slate-500'}`}
                      >
                        {formData.password.length >= 8 ? '✓' : '○'} 8+ Caracteres
                      </span>
                      <span
                        className={`flex items-center gap-1 ${passwordStrength.hasUpper && passwordStrength.hasLower ? 'text-emerald-400' : 'text-slate-500'}`}
                      >
                        {passwordStrength.hasUpper && passwordStrength.hasLower ? '✓' : '○'} Mayús.
                        & Minús.
                      </span>
                      <span
                        className={`flex items-center gap-1 ${passwordStrength.hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}
                      >
                        {passwordStrength.hasNumber ? '✓' : '○'} Números
                      </span>
                      <span
                        className={`flex items-center gap-1 ${passwordStrength.hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}
                      >
                        {passwordStrength.hasSpecial ? '✓' : '○'} Especiales (!@#)
                      </span>
                    </div>

                    {confirmPassword && formData.password !== confirmPassword && (
                      <p className="text-[11px] text-rose-400 font-semibold pt-1">
                        ⚠️ Las contraseñas no coinciden
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Rol de Acceso *
                  </label>
                  <select
                    value={formData.rol_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rol_id: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre.toUpperCase()} — {r.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Turno de Trabajo
                  </label>
                  <select
                    value={formData.turno}
                    onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="completo">Jornada Completa</option>
                    <option value="mañana">Turno Mañana</option>
                    <option value="tarde">Turno Tarde</option>
                    <option value="noche">Turno Noche</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Cargo</label>
                  <input
                    type="text"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Salario (COP)
                  </label>
                  <input
                    type="number"
                    value={formData.salario}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salario: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Desc. Máx Aut. (%)
                  </label>
                  <input
                    type="number"
                    max={100}
                    min={0}
                    value={formData.descuento_max_porcentaje}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        descuento_max_porcentaje: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>
                    {editingEmp
                      ? submitting
                        ? 'Guardando...'
                        : 'Guardar Cambios'
                      : submitting
                        ? 'Creando...'
                        : 'Crear Empleado'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
