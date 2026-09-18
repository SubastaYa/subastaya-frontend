import React, { useState } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Lock, Mail, AlertCircle, ArrowRight, ArrowLeft, User, CheckCircle2, Sparkles } from 'lucide-react';
import axios from 'axios';
import api from '../api/axios';

type LoginView = 'login' | 'register';

const TEST_ACCOUNTS = [
  { label: 'Vendedor', email: 'vendedor@test.com', password: '123456', detail: 'Publicaciones y cobros' },
  { label: 'Comprador 1', email: 'comprador1@test.com', password: '123456', detail: '$150.000 de saldo' },
  { label: 'Comprador 2', email: 'comprador2@test.com', password: '123456', detail: '$200.000 de saldo' },
  { label: 'Sin Fondos', email: 'sinfondos@test.com', password: '123456', detail: 'Saldo insuficiente ($500)' },
  { label: 'Auditor', email: 'auditoria@test.com', password: '123456', detail: 'Registro de actividades y logs' },
];

export const Login: React.FC = () => {
  const [view, setView] = useState<LoginView>('login');

  // Campos de formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Determinar destino tras autenticación exitosa
  const returnUrlParam = searchParams.get('returnUrl');
  const locationStateFrom = (location.state as { from?: { pathname: string; search?: string } })?.from;
  const redirectTarget = returnUrlParam
    ? decodeURIComponent(returnUrlParam)
    : locationStateFrom
    ? `${locationStateFrom.pathname}${locationStateFrom.search || ''}`
    : '/';

  // Manejador de Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor ingrese su correo electrónico y contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      await login(email.trim(), password);
      navigate(redirectTarget, { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (err.response?.status === 401) {
          setErrorMessage(detail || 'Credenciales inválidas. Compruebe su correo y contraseña.');
        } else if (err.response?.status === 400) {
          setErrorMessage(detail || 'Los datos proporcionados no son válidos.');
        } else {
          setErrorMessage('No fue posible conectar con el servidor de autenticación.');
        }
      } else {
        setErrorMessage('Ocurrió un error inesperado al procesar el inicio de sesión.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Manejador de Registro (Crear Cuenta)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Por favor complete todos los campos requeridos.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas ingresadas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe contener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/register', {
        email: email.trim(),
        nombre: nombre.trim(),
        password,
      });
      setSuccessMessage('¡Cuenta creada exitosamente! Ya puedes ingresar con tu correo y contraseña.');
      setView('login');
      setPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        if (err.response?.status === 409) {
          setErrorMessage(detail || 'El correo electrónico ya está en uso.');
        } else if (err.response?.status === 400) {
          setErrorMessage(detail || 'Los datos ingresados no son válidos.');
        } else {
          setErrorMessage('No fue posible completar el registro. Intente nuevamente.');
        }
      } else {
        setErrorMessage('No fue posible completar el registro. Intente nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchView = (newView: LoginView) => {
    setView(newView);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-50/60 select-none">
      <div className="w-full max-w-md">
        {/* Tarjeta de Autenticación */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-7 sm:p-9 transition-all select-none">
          {/* Cabecera con solo el bigote relleno de beige sin recuadro */}
          <div className="text-center mb-6 select-none">
            <Link
              to="/"
              className="inline-block mb-3 transition-transform duration-200 hover:scale-105 select-none"
              title="Volver al inicio"
            >
              <img
                src="/mustache_beige.png?v=4"
                alt="Bigote Subastas Ya"
                draggable={false}
                className="h-10 sm:h-12 w-auto object-contain mx-auto select-none"
              />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-serif select-none">
              {view === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h1>
            {view === 'register' && (
              <p className="text-xs text-slate-500 mt-1 select-none">
                Completa tus datos para unirte a Subastas Ya
              </p>
            )}
          </div>

          {/* Mensajes de Feedback */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 flex items-start gap-2.5 shadow-sm text-xs select-none"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-100 flex items-start gap-2.5 shadow-sm text-xs select-none"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div className="leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* VISTA: INICIAR SESIÓN */}
          {view === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 select-none"
                >
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    disabled={isLoading}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-action focus:ring-2 focus:ring-brand-action/15 transition-all disabled:bg-slate-50 select-text"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 select-none"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-action focus:ring-2 focus:ring-brand-action/15 transition-all disabled:bg-slate-50 select-text"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg font-semibold text-sm text-white bg-brand-action hover:bg-brand-action-hover active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow disabled:opacity-60 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    <span>Ingresando...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresa a Subastas Ya!</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>

              {/* Botonera de Cuentas de Prueba para Demostración */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Acceso rápido (Cuentas de prueba):
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {TEST_ACCOUNTS.map((acc, index) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => {
                        setEmail(acc.email);
                        setPassword(acc.password);
                        setErrorMessage(null);
                      }}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        index === 4 ? 'col-span-2' : ''
                      } ${
                        email === acc.email
                          ? 'border-brand-action bg-blue-50/80 ring-1 ring-brand-action/30'
                          : 'border-slate-200 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="block text-xs font-bold text-slate-800">
                          {acc.label}
                        </span>
                        {acc.label === 'Auditor' && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            Rol Exclusivo
                          </span>
                        )}
                      </div>
                      <span className="block text-[10px] text-slate-500 truncate">
                        {acc.detail}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
                ¿No tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => switchView('register')}
                  className="font-semibold text-brand-action hover:underline cursor-pointer ml-1"
                >
                  Crear cuenta
                </button>
              </div>
            </form>
          )}

          {/* VISTA: CREAR CUENTA */}
          {view === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Nombre Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Juan Pérez"
                    disabled={isLoading}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-action focus:ring-2 focus:ring-brand-action/15 transition-all disabled:bg-slate-50 select-text"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="juan@ejemplo.com"
                    disabled={isLoading}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-action focus:ring-2 focus:ring-brand-action/15 transition-all disabled:bg-slate-50 select-text"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    disabled={isLoading}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-action focus:ring-2 focus:ring-brand-action/15 transition-all disabled:bg-slate-50 select-text"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-confirm-password"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    disabled={isLoading}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-action focus:ring-2 focus:ring-brand-action/15 transition-all disabled:bg-slate-50 select-text"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg font-semibold text-sm text-white bg-brand-action hover:bg-brand-action-hover active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow disabled:opacity-60 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    <span>Registrando...</span>
                  </>
                ) : (
                  <>
                    <span>Registrarme en Subastas Ya</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="font-semibold text-brand-action hover:underline cursor-pointer ml-1"
                >
                  Iniciar sesión
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Pie de navegación a categorías */}
        <div className="text-center mt-5">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-action transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a categorías</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
