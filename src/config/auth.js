/**
 * Detecta a URL correta para redirecionamento OAuth
 * SEMPRE usa o Supabase como callback, nunca a URL da app diretamente
 */
export const getAuthRedirectUrl = () => {
  // Se estiver rodando em produção (não localhost), usa a URL atual
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.origin
  }

  // Em desenvolvimento local, garante que usa a porta correta do Vite (5173)
  return 'http://localhost:5173'
}
