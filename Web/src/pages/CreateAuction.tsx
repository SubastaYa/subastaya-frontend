import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/axios';
import {
  PlusCircle,
  Tag,
  DollarSign,
  Calendar,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';

interface Categoria {
  id: number;
  nombre: string;
  urlIcono?: string;
}

export const CreateAuction: React.FC = () => {
  const navigate = useNavigate();

  // Estados de datos y categorías
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoadingCategorias, setIsLoadingCategorias] = useState(true);

  // Helper para formatear fechas a YYYY-MM-DDTHH:mm para inputs de tipo datetime-local
  const getInitialDates = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Inicio en 5 mins
    const fin = new Date();
    fin.setDate(fin.getDate() + 7); // Cierre en 7 días

    const toLocalISO = (d: Date) => {
      const tzOffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    return {
      inicio: toLocalISO(now),
      fin: toLocalISO(fin),
    };
  };

  const initialDates = getInitialDates();

  const [formData, setFormData] = useState({
    categoriaId: '',
    titulo: '',
    descripcion: '',
    urlImagen: '',
    precioBase: '',
    incrementoMinimo: '',
    fechaInicio: initialDates.inicio,
    fechaFin: initialDates.fin,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar categorías al montar el componente
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        setIsLoadingCategorias(true);
        const response = await api.get<Categoria[]>('/categories');
        setCategorias(response.data || []);
        if (response.data && response.data.length > 0) {
          setFormData((prev) => ({ ...prev, categoriaId: response.data[0].id.toString() }));
        }
      } catch (err: unknown) {
        console.error('Error al cargar categorías:', err);
        // Fallback endpoint si /categories no responde
        try {
          const fallbackResp = await api.get<Categoria[]>('/categorias');
          setCategorias(fallbackResp.data || []);
          if (fallbackResp.data && fallbackResp.data.length > 0) {
            setFormData((prev) => ({ ...prev, categoriaId: fallbackResp.data[0].id.toString() }));
          }
        } catch {
          setError('No se pudieron cargar las categorías del sistema.');
        }
      } finally {
        setIsLoadingCategorias(false);
      }
    };

    fetchCategorias();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validaciones del cliente
    const categoriaIdNum = Number(formData.categoriaId);
    const precioBaseNum = parseFloat(formData.precioBase);
    const incrementoMinimoNum = parseFloat(formData.incrementoMinimo);
    const inicioDate = new Date(formData.fechaInicio);
    const finDate = new Date(formData.fechaFin);

    if (!categoriaIdNum || categoriaIdNum <= 0) {
      setError('Por favor selecciona una categoría válida.');
      return;
    }

    if (!formData.titulo.trim()) {
      setError('El título de la subasta es obligatorio.');
      return;
    }

    if (!formData.descripcion.trim()) {
      setError('La descripción del artículo es obligatoria.');
      return;
    }

    if (!formData.urlImagen.trim()) {
      setError('La URL de la imagen principal es obligatoria.');
      return;
    }

    if (isNaN(precioBaseNum) || precioBaseNum <= 0) {
      setError('El precio base debe ser un número positivo mayor a 0.');
      return;
    }

    if (isNaN(incrementoMinimoNum) || incrementoMinimoNum <= 0) {
      setError('El incremento mínimo debe ser un número positivo mayor a 0.');
      return;
    }

    if (isNaN(inicioDate.getTime()) || isNaN(finDate.getTime())) {
      setError('Por favor especifica fechas válidas para la subasta.');
      return;
    }

    if (finDate <= inicioDate) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        categoriaId: categoriaIdNum,
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        urlImagen: formData.urlImagen.trim(),
        precioBase: precioBaseNum,
        incrementoMinimo: incrementoMinimoNum,
        fechaInicio: inicioDate.toISOString(),
        fechaFin: finDate.toISOString(),
      };

      await api.post('/auctions', payload);

      setSuccess('¡Subasta creada y publicada con éxito! Redirigiendo al catálogo...');

      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: unknown) {
      setIsSubmitting(false);
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data;
        if (typeof data === 'string') {
          setError(data);
        } else if (data.message) {
          setError(data.message);
        } else if (data.errors) {
          const messages = Object.values(data.errors).flat().join(' ');
          setError(messages || 'Errores de validación en la publicación.');
        } else if (data.detail) {
          setError(data.detail);
        } else {
          setError('Ocurrió un error de validación (400 Bad Request) al crear la subasta.');
        }
      } else {
        setError('Ocurrió un error inesperado al conectar con el servidor.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 font-sans select-none">
      {/* Botón de volver */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Catálogo
        </Link>
      </div>

      {/* Encabezado */}
      <div className="bg-brand-navy rounded-2xl p-6 sm:p-8 text-white shadow-md mb-8 border border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-action/20 border border-brand-action/40 flex items-center justify-center text-brand-action">
            <PlusCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Publicar Nueva Subasta</h1>
            <p className="text-sm text-slate-300">
              Define los parámetros de tu artículo, condiciones económicas y ventana temporal.
            </p>
          </div>
        </div>
      </div>

      {/* Alertas Globales de Error / Éxito */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-sm shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1 font-semibold">{success}</div>
        </div>
      )}

      {/* Formulario Principal */}
      <form onSubmit={handleSubmit} className="bg-brand-surface rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
        
        {/* SECCIÓN 1: Información del Producto */}
        <div>
          <h2 className="text-lg font-bold text-brand-dark border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-action" />
            Información del Producto
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Categoría */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Categoría *
              </label>
              <div className="relative">
                <Tag className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  name="categoriaId"
                  value={formData.categoriaId}
                  onChange={handleChange}
                  disabled={isLoadingCategorias || isSubmitting}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-brand-action focus:ring-2 focus:ring-brand-action/20 transition-all outline-none"
                  required
                >
                  {isLoadingCategorias ? (
                    <option value="">Cargando categorías...</option>
                  ) : (
                    categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Título */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Título del Producto *
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                placeholder="Ej: iPhone 15 Pro Max 256GB"
                disabled={isSubmitting}
                maxLength={200}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-brand-action focus:ring-2 focus:ring-brand-action/20 transition-all outline-none"
                required
              />
            </div>

            {/* Descripción */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Descripción Detallada *
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={4}
                placeholder="Describe el estado del artículo, especificaciones técnicas, garantía e información relevante para los postores."
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-brand-action focus:ring-2 focus:ring-brand-action/20 transition-all outline-none resize-y"
                required
              />
            </div>

            {/* URL de Imagen */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                URL de la Imagen Principal *
              </label>
              <div className="relative mb-3">
                <ImageIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="url"
                  name="urlImagen"
                  value={formData.urlImagen}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/photo-1695048133142-1a20484d2569"
                  disabled={isSubmitting}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-brand-action focus:ring-2 focus:ring-brand-action/20 transition-all outline-none"
                  required
                />
              </div>

              {/* Preview de Imagen */}
              {formData.urlImagen && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                    <img
                      src={formData.urlImagen}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/default-subasta.jpg';
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 block mb-0.5">Vista previa de imagen</span>
                    <span className="text-xs text-slate-500 line-clamp-1 break-all">{formData.urlImagen}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Condiciones Económicas */}
        <div>
          <h2 className="text-lg font-bold text-brand-dark border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-brand-action" />
            Condiciones Económicas
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Precio Base */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Precio Base de Salida ($ ARS) *
              </label>
              <div className="relative">
                <DollarSign className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="precioBase"
                  value={formData.precioBase}
                  onChange={handleChange}
                  placeholder="800000"
                  disabled={isSubmitting}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-brand-action focus:ring-2 focus:ring-brand-action/20 transition-all outline-none"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Monto mínimo con el que iniciará la subasta.</p>
            </div>

            {/* Incremento Mínimo */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Incremento Mínimo entre Ofertas ($ ARS) *
              </label>
              <div className="relative">
                <TrendingUp className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="incrementoMinimo"
                  value={formData.incrementoMinimo}
                  onChange={handleChange}
                  placeholder="15000"
                  disabled={isSubmitting}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-brand-action focus:ring-2 focus:ring-brand-action/20 transition-all outline-none"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Cada nueva oferta debe superar a la anterior al menos por esta suma.</p>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Ventana Temporal */}
        <div>
          <h2 className="text-lg font-bold text-brand-dark border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-action" />
            Ventana Temporal de la Subasta
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Fecha de Inicio */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Fecha y Hora de Inicio *
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  name="fechaInicio"
                  value={formData.fechaInicio}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-brand-action focus:ring-2 focus:ring-brand-action/20 transition-all outline-none cursor-pointer"
                  required
                />
              </div>
            </div>

            {/* Fecha de Cierre */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Fecha y Hora de Cierre *
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  name="fechaFin"
                  value={formData.fechaFin}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-brand-action focus:ring-2 focus:ring-brand-action/20 transition-all outline-none cursor-pointer"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botón de Enviar */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-4">
          <Link
            to="/"
            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-brand-action hover:bg-brand-action-hover text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Publicando Subasta...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5" />
                <span>Publicar Subasta</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAuction;
