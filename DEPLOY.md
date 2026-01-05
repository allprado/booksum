# Configuração de Deploy - Vercel

## Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis de ambiente no painel do Vercel (Settings → Environment Variables):

### Supabase (Obrigatório)
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Google Gemini (Obrigatório - para resumos)
```
VITE_GOOGLE_API_KEY=AIzaSy...
```

### Azure Speech (Obrigatório - para áudio)
```
VITE_AZURE_SPEECH_KEY=sua_chave_azure
VITE_AZURE_SPEECH_REGION=brazilsouth
```

### OpenRouter (Opcional - alternativa ao Gemini)
```
VITE_OPENROUTER_API_KEY=sk-or-v1-...
```

### RapidAPI (Opcional - para Anna's Archive)
```
VITE_RAPIDAPI_KEY=sua_chave_rapidapi
```

## Configuração do Google OAuth para Produção

1. No Google Cloud Console, adicione o domínio de produção aos URIs autorizados:
   ```
   https://seu-app.vercel.app
   ```

2. No Supabase, adicione o domínio nas configurações do provider Google:
   - Authentication → Providers → Google
   - Adicionar domínio aos "Authorized Client IDs"

## Checklist de Deploy

- [ ] Todas as variáveis de ambiente configuradas no Vercel
- [ ] Schema SQL executado no Supabase
- [ ] Bucket 'audio-chapters' criado e configurado como público
- [ ] Políticas de Storage configuradas
- [ ] Google OAuth configurado para produção
- [ ] URIs de redirect atualizados no Google Cloud Console
- [ ] Domínio adicionado ao Supabase
- [ ] Build de teste executado localmente (`npm run build`)

## Comando de Deploy

```bash
# O Vercel faz deploy automático ao fazer push para main
git add .
git commit -m "feat: integração com Supabase"
git push origin main
```

## Verificação Pós-Deploy

1. Acesse o app em produção
2. Teste login com Google
3. Teste busca de livros
4. Teste geração de resumo
5. Verifique se áudios são salvos no Storage
6. Confirme que badges aparecem em livros com resumo
7. Teste biblioteca pessoal

## URLs Importantes

- **Dashboard Vercel**: https://vercel.com/dashboard
- **Dashboard Supabase**: https://app.supabase.com
- **Google Cloud Console**: https://console.cloud.google.com
- **Azure Portal**: https://portal.azure.com
