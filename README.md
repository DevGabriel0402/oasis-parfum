# Oasis Parfums

Painel e catálogos em React, Vite e TypeScript, usando Google Sheets apenas pelas APIs server-side da Vercel.

## Incluído

- Login persistente com cookie HttpOnly, JWT e senha em hash bcrypt.
- Dashboard, produtos, pedidos, catálogos de varejo/atacado e configurações.
- Catálogos responsivos com carrinho e finalização via WhatsApp.
- Compatibilidade por aliases com cabeçalhos antigos em português.
- Migração não destrutiva: preserva Catálogo e Pedidos e anexa só colunas ausentes.

## Configuração do Google

1. No Google Cloud, habilite a Google Sheets API.
2. Configure Workload Identity Federation entre Google Cloud e o OIDC da Vercel.
3. Crie uma conta de serviço sem chave e compartilhe a planilha com seu e-mail como Editor.
4. Cadastre as variáveis GCP e da conta de serviço na Vercel.

Este projeto usa federação OIDC: os tokens são temporários e nenhuma chave privada do Google é armazenada.

No primeiro login, o sistema cria Configuracoes e grava somente o hash da senha. Depois, ADMIN_INITIAL_PASSWORD pode ser removida da Vercel.

## Desenvolvimento

    npm install
    npm run dev

Use npm run dev, pois as rotas /api precisam do ambiente local da Vercel.

## Publicação

Crie um projeto Vercel e adicione as variáveis em Settings - Environment Variables. Nenhuma variável secreta deve começar com VITE_.

## Schema compatível

O sistema reconhece cabeçalhos antigos como Nome, Perfume, Preço, Valor, Foto, Qtd e Situação. Colunas canônicas ausentes são anexadas ao final da primeira linha, sem reordenar ou limpar dados.

- Catálogo: ID, Produto, Marca, Descrição, Imagem, Preço Varejo, Preço Atacado, Estoque, Categoria, Ativo, Destaque, Quantidade Mínima Atacado, Slug, Atualizado em.
- Pedidos: ID, Data, Cliente, Telefone, Tipo, Itens, Quantidade, Total, Status, Observações.
- Configuracoes: Chave, Valor, Atualizado em.
