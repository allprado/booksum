#!/bin/bash

# Script para aplicar as políticas RLS corrigidas ao Supabase
# Uso: ./apply-rls.sh ou bash apply-rls.sh

echo "🔧 BookSum - RLS Policy Fixer"
echo "=============================="
echo ""
echo "Este script aplica as políticas RLS corretas ao seu banco de dados Supabase."
echo ""
echo "⚠️  ANTES DE CONTINUAR:"
echo "1. Abra https://app.supabase.com/"
echo "2. Selecione seu projeto"
echo "3. Vá em SQL Editor"
echo "4. Cole todo o conteúdo do arquivo 'supabase-fix-rls.sql'"
echo "5. Clique em 'Execute' ou aperte Ctrl+Enter"
echo ""
echo "📋 Arquivo a executar: supabase-fix-rls.sql"
echo ""
echo "O arquivo contém:"
echo "  ✅ DROP de todas as políticas RLS antigas/conflitantes"
echo "  ✅ CREATE de novas políticas RLS corretas"
echo "  ✅ Configurações corretas para leitura pública e inserção autenticada"
echo ""
echo "Se tiver dúvidas, consulte APLICAR_RLS.md"
echo ""
