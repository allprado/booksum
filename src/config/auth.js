/**
 * Detecta a URL correta para redirecionamento OAuth
 * Funciona tanto em desenvolvimento quanto em produção
 */
export const getAuthRedirectUrl = () => {
  // Se estiver rodando em produção (não localhost), usa a URL atual
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.origin
  }

  // Em desenvolvimento local, garante que usa a porta correta do Vite (5173)
  return 'http://localhost:5173'
}

export const getAuthCallbackUrl = () => {
  return `${getAuthRedirectUrl()}/auth/v1/callback`
}
