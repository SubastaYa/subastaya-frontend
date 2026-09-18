import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auctionService, categoryService } from '../services';
import {
  PlusCircle,
  Tag,
  DollarSign,
  Image as ImageIcon,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import axios from 'axios';
import { parseLocalInputDate, toLocalDatetimeInputString } from '../utils/dateUtils';

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

  // Helper para inicializar fechas en hora local: inicio ahora, fin sugerido en 7 días
  const getInitialDates = () => {
    const now = new Date();
    const fin = new Date();
    fin.setDate(fin.getDate() + 7); // Cierre sugerido por defecto en 7 días

    return {
      inicio: toLocalDatetimeInputString(now),
      fin: toLocalDatetimeInputString(fin),
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
        const response = await categoryService.getAll();
        setCategorias(response.data || []);
        if (response.data && response.data.length > 0) {
          setFormData((prev) => ({ ...prev, categoriaId: response.data[0].id.toString() }));
        }
      } catch (err: unknown) {
        console.error('Error al cargar categorías:', err);
        setError('No se pudieron cargar las categorías del sistema.');
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
    const inicioDate = parseLocalInputDate(formData.fechaInicio);
    const finDate = parseLocalInputDate(formData.fechaFin);
    const now = new Date();

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
      setError('La fecha de cierre debe ser posterior a la fecha de inicio.');
      return;
    }

    if (finDate.getTime() <= now.getTime()) {
      setError('La fecha de cierre debe ser posterior al momento actual.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Si la fecha de inicio es inmediata (ahora o dentro del minuto actual),
      // nos aseguramos de enviar un timestamp menor o igual al momento actual
      // para que el backend la clasifique directamente como Activa (1).
      const isImmediate = inicioDate.getTime() <= now.getTime() + 60000;
      const fechaInicioIso = isImmediate
        ? new Date(Math.min(inicioDate.getTime(), now.getTime() - 2000)).toISOString()
        : inicioDate.toISOString();

      const payload = {
        categoriaId: categoriaIdNum,
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        urlImagen: formData.urlImagen.trim(),
        precioBase: precioBaseNum,
        incrementoMinimo: incrementoMinimoNum,
        fechaInicio: fechaInicioIso,
        fechaFin: finDate.toISOString(),
      };

      const response = await auctionService.create(payload);
      const subastaId = response.data?.id;

      setSuccess('¡Subasta creada y publicada con éxito! Redirigiendo a la sala de subasta...');

      setTimeout(() => {
        if (subastaId) {
          navigate(`/auctions/${subastaId}`);
        } else {
          navigate('/');
        }
      }, 1200);
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
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 font-sans">
      {/* Cabecera Principal */}
      <div className="bg-[#E6F4EA] rounded-xl border border-[#C5E8D2] p-4 sm:p-6 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-dark font-sans tracking-tight">
            Publicar Nueva Subasta
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-sans">
            Define los parámetros de tu artículo, valor y ventana de tiempo
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#C5E8D2] bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 transition-all font-sans self-stretch sm:self-auto justify-center shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Volver a las subastas</span>
        </Link>
      </div>

      {/* Alertas de Error / Éxito (Mismo estilo que Billetera) */}
      {error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50/90 text-rose-900 flex items-start justify-between gap-3 text-sm shadow-sm animate-in fade-in duration-200 font-sans"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <p className="font-medium leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {success && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50/90 text-emerald-900 flex items-start justify-between gap-3 text-sm shadow-sm animate-in fade-in duration-200 font-sans"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <p className="font-medium leading-relaxed">{success}</p>
          </div>
        </div>
      )}

      {/* Formulario Principal con tarjetas modulares estilo Billetera */}
      <form onSubmit={handleSubmit} className="space-y-6 font-sans">

        {/* SECCIÓN 1: Información del Producto */}
        <div className="bg-brand-surface rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 font-sans">
          <div className="group flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100 cursor-pointer select-none">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center shrink-0 p-1.5 shadow-sm transition-all duration-300 group-hover:bg-blue-100/70 group-hover:shadow-md group-hover:border-blue-200 active:scale-95">
              <img
                src="/monopoly_car.png"
                alt="Auto de Producto"
                className="w-full h-full object-contain drop-shadow-sm transition-all duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6 group-hover:-translate-y-1 group-hover:drop-shadow-[0_6px_12px_rgba(30,58,138,0.25)]"
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-brand-dark tracking-tight font-sans transition-colors duration-200 group-hover:text-brand-action">
                Información del Producto
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-sans">
                Describe el artículo, especificaciones técnicas e imagen principal
              </p>
            </div>
          </div>

          <div className="space-y-5 font-sans">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Categoría */}
              <div>
                <label
                  htmlFor="categoriaId"
                  className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 font-sans"
                >
                  Categoría <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Tag className="w-4 h-4" />
                  </div>
                  <select
                    id="categoriaId"
                    name="categoriaId"
                    value={formData.categoriaId}
                    onChange={handleChange}
                    disabled={isLoadingCategorias || isSubmitting}
                    className="w-full pl-10 pr-8 py-2.5 text-sm sm:text-base font-medium rounded-lg bg-white border border-slate-300 text-brand-dark focus:outline-none focus:border-brand-action focus:ring-2 focus:ring-brand-action/15 transition-all disabled:bg-slate-50 font-sans cursor-pointer"
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

              {/* Título del Producto */}
              <div>
                <label
                  htmlFor="titulo"
                  className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 font-sans"
                >
                  Título del Producto <span className="text-rose-500">*</span>
                </label>
                <input
                  id="titulo"
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Ej: iPhone 15 Pro Max 256GB"
                  disabled={isSubmitting}
                  maxLength={200}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base font-medium rounded-lg bg-white border border-slate-300 text-brand-dark placeholder-slate-400 focus:outline-none focus:border-brand-action focus:ring-2 focus:ring-brand-action/15 transition-all disabled:bg-slate-50 font-sans"
                  required
                />
              </div>
            </div>

            {/* Descripción Detallada */}
            <div>
              <label
                htmlFor="descripcion"
                className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 font-sans"
              >
                Descripción Detallada <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={4}
                placeholder="Describe el estado del artículo, especificaciones técnicas, accesorios incluidos e información relevante para los postores."
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 text-sm font-medium rounded-lg bg-white border border-slate-300 text-brand-dark placeholder-slate-400 focus:outline-none focus:border-brand-action focus:ring-2 focus:ring-brand-action/15 transition-all disabled:bg-slate-50 font-sans resize-y min-h-[100px]"
                required
              />
            </div>

            {/* URL de la Imagen */}
            <div>
              <label
                htmlFor="urlImagen"
                className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 font-sans"
              >
                URL de la Imagen Principal <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <input
                  id="urlImagen"
                  type="url"
                  name="urlImagen"
                  value={formData.urlImagen}
                  onChange={handleChange}
                  placeholder=""
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-2.5 text-sm sm:text-base font-medium rounded-lg bg-white border border-slate-300 text-brand-dark placeholder-slate-400 focus:outline-none focus:border-brand-action focus:ring-2 focus:ring-brand-action/15 transition-all disabled:bg-slate-50 font-sans"
                  required
                />
              </div>

              {/* Vista previa de imagen si hay URL */}
              {formData.urlImagen && (
                <div className="mt-3.5 p-3 rounded-lg bg-slate-50/80 border border-slate-200 flex items-center gap-3.5 font-sans">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300 flex items-center justify-center">
                    <img
                      src={formData.urlImagen}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/default-subasta.jpg';
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-700 block mb-0.5 font-sans">
                      Vista previa de imagen
                    </span>
                    <span className="text-xs text-slate-500 truncate block font-sans">
                      {formData.urlImagen}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Valor  */}
        <div className="bg-brand-surface rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 font-sans">
          <div className="group flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100 cursor-pointer select-none">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-center shrink-0 p-1.5 shadow-sm transition-all duration-300 group-hover:bg-emerald-100/70 group-hover:shadow-md group-hover:border-emerald-200 active:scale-95">
              <img
                src="/monopoly_money.png"
                alt="Billetes Monopoly"
                className="w-full h-full object-contain drop-shadow-sm transition-all duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6 group-hover:-translate-y-1 group-hover:drop-shadow-[0_6px_12px_rgba(16,185,129,0.25)]"
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-brand-dark tracking-tight font-sans transition-colors duration-200 group-hover:text-emerald-700">
                Valor
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-sans">
                Configura el precio base y la escala mínima de puja requerida
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 font-sans">
            {/* Precio Base */}
            <div>
              <label
                htmlFor="precioBase"
                className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 font-sans"
              >
                Precio Base de Salida ($ ARS) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  id="precioBase"
                  type="number"
                  step="any"
                  min="1"
                  name="precioBase"
                  value={formData.precioBase}
                  onChange={handleChange}
                  placeholder="800000"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-2.5 text-base sm:text-lg font-bold rounded-lg bg-white border border-slate-300 text-brand-dark placeholder-slate-400 focus:outline-none focus:border-brand-action focus:ring-2 focus:ring-brand-action/15 transition-all disabled:bg-slate-50 font-sans tracking-tight"
                  required
                />
              </div>
              <span className="text-xs text-slate-400 mt-1.5 block font-sans">
                Monto mínimo con el que iniciará la subasta.
              </span>
            </div>

            {/* Incremento Mínimo */}
            <div>
              <label
                htmlFor="incrementoMinimo"
                className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 font-sans"
              >
                Incremento Mínimo entre Ofertas ($ ARS) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <input
                  id="incrementoMinimo"
                  type="number"
                  step="any"
                  min="1"
                  name="incrementoMinimo"
                  value={formData.incrementoMinimo}
                  onChange={handleChange}
                  placeholder="15000"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-2.5 text-base sm:text-lg font-bold rounded-lg bg-white border border-slate-300 text-brand-dark placeholder-slate-400 focus:outline-none focus:border-brand-action focus:ring-2 focus:ring-brand-action/15 transition-all disabled:bg-slate-50 font-sans tracking-tight"
                  required
                />
              </div>
              <span className="text-xs text-slate-400 mt-1.5 block font-sans">
                Cada nueva oferta debe superar a la anterior al menos por esta suma.
              </span>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Ventana Temporal */}
        <div className="bg-brand-surface rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 font-sans">
          <div className="group flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100 cursor-pointer select-none">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-center justify-center shrink-0 p-1.5 shadow-sm transition-all duration-300 group-hover:bg-amber-100/70 group-hover:shadow-md group-hover:border-amber-300 active:scale-95">
              <img
                src="/pocket_watch.png"
                alt="Reloj de Bolsillo"
                className="w-full h-full object-contain drop-shadow-sm transition-all duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6 group-hover:-translate-y-1 group-hover:drop-shadow-[0_6px_12px_rgba(217,119,6,0.25)]"
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-brand-dark tracking-tight font-sans transition-colors duration-200 group-hover:text-amber-700">
                Ventana tiempo de la Subasta
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-sans">
                Estipula el momento de apertura y cierre oficial del remate
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 font-sans">
            {/* Fecha de Inicio */}
            <div>
              <label
                htmlFor="fechaInicio"
                className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 font-sans"
              >
                Fecha y Hora de Inicio <span className="text-rose-500">*</span>
              </label>
              <input
                id="fechaInicio"
                type="datetime-local"
                name="fechaInicio"
                value={formData.fechaInicio}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 text-sm sm:text-base font-medium rounded-lg bg-white border border-slate-300 text-brand-dark focus:outline-none focus:border-brand-action focus:ring-2 focus:ring-brand-action/15 transition-all disabled:bg-slate-50 font-sans cursor-pointer"
                required
              />
              <span className="text-xs text-slate-400 mt-1.5 block font-sans">
                Instante en que se habilitará la recepción de ofertas (inicia de inmediato por defecto).
              </span>
            </div>

            {/* Fecha de Cierre */}
            <div>
              <label
                htmlFor="fechaFin"
                className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 font-sans"
              >
                Fecha y Hora de Cierre <span className="text-rose-500">*</span>
              </label>
              <input
                id="fechaFin"
                type="datetime-local"
                name="fechaFin"
                value={formData.fechaFin}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 text-sm sm:text-base font-medium rounded-lg bg-white border border-slate-300 text-brand-dark focus:outline-none focus:border-brand-action focus:ring-2 focus:ring-brand-action/15 transition-all disabled:bg-slate-50 font-sans cursor-pointer"
                required
              />
              <span className="text-xs text-slate-400 mt-1.5 block font-sans">
                Cierre definitivo de la subasta y adjudicación automática.
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Acciones y Envío */}
        <div className="bg-brand-surface rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-end gap-3 font-sans">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 active:scale-[0.99] transition-all font-sans cursor-pointer"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-action hover:bg-brand-action-hover active:scale-[0.99] transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-sans"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                <span>Publicando Subasta...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
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
