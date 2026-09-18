import React, { useEffect, useState, useCallback } from 'react';
import { AuctionCard, type SubastaListDto } from '../components/AuctionCard';
import { Filter, Layers, AlertCircle, RefreshCw, ArrowUpDown, DollarSign, X, Loader2, Search } from 'lucide-react';
import { auctionService, categoryService } from '../services';

interface CategoriaDto {
  id: number;
  nombre: string;
  urlIcono?: string;
}

export const Catalog: React.FC = () => {
  const [auctions, setAuctions] = useState<SubastaListDto[]>([]);
  const [categories, setCategories] = useState<CategoriaDto[]>([]);
  const [busqueda, setBusqueda] = useState<string>('');
  const [debouncedBusqueda, setDebouncedBusqueda] = useState<string>('');
  const [selectedEstado, setSelectedEstado] = useState<string>('Activa');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [selectedOrden, setSelectedOrden] = useState<string>('tiempo_restante');
  const [precioMin, setPrecioMin] = useState<string>('');
  const [precioMax, setPrecioMax] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const PAGE_SIZE = 12;

  // Cargar categorías disponibles al montar
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getAll();
        const data = Array.isArray(response.data) ? response.data : response.data.value || [];
        setCategories(data);
      } catch (err) {
        console.error('Error al cargar categorías:', err);
      }
    };
    fetchCategories();
  }, []);

  // Debounce para el campo de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBusqueda(busqueda);
    }, 350);
    return () => clearTimeout(timer);
  }, [busqueda]);

  // Cargar subastas con filtros dinámicos y paginación progresiva
  const fetchAuctions = useCallback(async (pageToLoad: number = 1, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page: pageToLoad,
        pageSize: PAGE_SIZE,
        tamanioPagina: PAGE_SIZE,
      };

      if (selectedEstado && selectedEstado !== 'Todas') {
        params.estado = selectedEstado;
      }

      if (selectedCategoria) {
        params.categoriaId = Number(selectedCategoria);
      }

      if (selectedOrden) {
        params.orden = selectedOrden;
      }

      const pMin = parseFloat(precioMin);
      if (!isNaN(pMin) && pMin > 0) {
        params.precioMin = pMin;
      }

      const pMax = parseFloat(precioMax);
      if (!isNaN(pMax) && pMax > 0) {
        params.precioMax = pMax;
      }

      if (debouncedBusqueda.trim()) {
        params.busqueda = debouncedBusqueda.trim();
      }

      const response = await auctionService.getCatalog(params);
      const data = Array.isArray(response.data) ? response.data : response.data.value || [];
      if (append) {
        setAuctions((prev) => [...prev, ...data]);
      } else {
        setAuctions(data);
      }

      setHasMore(data.length >= PAGE_SIZE);
      setPage(pageToLoad);
    } catch (err: unknown) {
      console.error('Error al obtener subastas:', err);
      setError('No se pudieron cargar las subastas. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectedEstado, selectedCategoria, selectedOrden, precioMin, precioMax, debouncedBusqueda]);

  useEffect(() => {
    fetchAuctions(1, false);
  }, [fetchAuctions]);

  const estadoFiltros = [
    { label: 'Todas', value: 'Todas' },
    { label: 'Activas', value: 'Activa' },
    { label: 'Próximas', value: 'Programada' },
    { label: 'Finalizadas', value: 'Finalizada' },
    { label: 'Desiertas', value: 'Desierta' },
  ];

  const ordenFiltros = [
    { label: 'Menor tiempo restante', value: 'tiempo_restante' },
    { label: 'Mayor puja / oferta', value: 'mayor_oferta' },
    { label: 'Menor precio base', value: 'precio_asc' },
    { label: 'Mayor precio base', value: 'precio_desc' },
  ];

  const hasActiveCustomFilters = Boolean(busqueda || precioMin || precioMax || selectedCategoria || selectedOrden !== 'tiempo_restante');

  const handleResetFilters = () => {
    setBusqueda('');
    setSelectedEstado('Todas');
    setSelectedCategoria('');
    setSelectedOrden('tiempo_restante');
    setPrecioMin('');
    setPrecioMax('');
  };

  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore) return;
    fetchAuctions(page + 1, true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl font-sans">
      {/* Encabezado de Subastas */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark tracking-tight">
          Subastas
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Explora las mejores oportunidades y participa en subastas
        </p>
      </div>

      {/* Barra de Filtros Superior */}
      <div className="bg-brand-surface rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm mb-8 space-y-4">
        {/* Barra de Búsqueda por Texto */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por título o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 font-medium focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] outline-none shadow-xs transition-all"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              title="Borrar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Fila 1: Filtro por Estado y Categoría */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Botones de Filtro por Estado */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Estado:
            </span>
            {estadoFiltros.map((filtro) => {
              const isSelected = selectedEstado === filtro.value;
              return (
                <button
                  key={filtro.value}
                  type="button"
                  onClick={() => setSelectedEstado(filtro.value)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${isSelected
                      ? 'bg-[#1E3A8A] text-white shadow-sm ring-2 ring-[#1E3A8A]/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                >
                  {filtro.label}
                </button>
              );
            })}
          </div>

          {/* Selector de Categoría */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="categoriaSelect"
              className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Categoría:
            </label>
            <select
              id="categoriaSelect"
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="w-full md:w-56 px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-brand-action/20 focus:border-brand-action outline-none shadow-sm transition-all cursor-pointer"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fila 2: Ordenamiento y Rango de Precios */}
        <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Selector de Ordenamiento */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="ordenSelect"
              className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1.5"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              Ordenar por:
            </label>
            <select
              id="ordenSelect"
              value={selectedOrden}
              onChange={(e) => setSelectedOrden(e.target.value)}
              className="w-full sm:w-60 px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-brand-action/20 focus:border-brand-action outline-none shadow-sm transition-all cursor-pointer"
            >
              {ordenFiltros.map((orden) => (
                <option key={orden.value} value={orden.value}>
                  {orden.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Rango de Precios */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              Precio:
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                placeholder="Mínimo"
                value={precioMin}
                onChange={(e) => setPrecioMin(e.target.value)}
                className="w-24 sm:w-28 px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-brand-action/20 focus:border-brand-action outline-none"
              />
              <span className="text-slate-400 text-xs">—</span>
              <input
                type="number"
                min="0"
                placeholder="Máximo"
                value={precioMax}
                onChange={(e) => setPrecioMax(e.target.value)}
                className="w-24 sm:w-28 px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:ring-2 focus:ring-brand-action/20 focus:border-brand-action outline-none"
              />
            </div>

            {hasActiveCustomFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="ml-2 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Restablecer todos los filtros"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alerta de Error */}
      {error && (
        <div className="mb-8 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchAuctions()}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-100/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reintentar
          </button>
        </div>
      )}

      {/* Grilla de Subastas / Estado de Carga / Estado Vacío */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-brand-surface rounded-xl border border-slate-200 p-4 shadow-sm animate-pulse flex flex-col justify-between h-96"
            >
              <div className="w-full h-48 bg-slate-200 rounded-lg mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-5 bg-slate-200 rounded w-3/4"></div>
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-2 mt-4">
                <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                <div className="h-7 bg-slate-200 rounded w-1/2"></div>
                <div className="h-10 bg-slate-200 rounded w-full mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : auctions.length === 0 ? (
        <div className="bg-brand-surface rounded-xl border border-slate-200 p-12 text-center shadow-sm max-w-xl mx-auto my-8">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
            <Layers className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-brand-dark mb-1">
            No se encontraron subastas
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            No hay artículos disponibles con los filtros actuales (
            <span className="font-semibold text-slate-700">
              {estadoFiltros.find((f) => f.value === selectedEstado)?.label || selectedEstado}
            </span>
            {selectedCategoria &&
              categories.find((c) => c.id === Number(selectedCategoria)) && (
                <>
                  {' '}en{' '}
                  <span className="font-semibold text-slate-700">
                    {categories.find((c) => c.id === Number(selectedCategoria))?.nombre}
                  </span>
                </>
              )}
            ).
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedEstado('Todas');
              setSelectedCategoria('');
            }}
            className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Ver todas las subastas
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>

          {/* Botón de Carga Progresiva / Cargar Más */}
          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-brand-action" />
                    <span>Cargando más subastas...</span>
                  </>
                ) : (
                  <span>Cargar más subastas</span>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
