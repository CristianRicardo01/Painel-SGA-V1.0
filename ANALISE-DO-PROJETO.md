# Estado técnico atual — Painel SGA

## Objetivo

Painel de chamada de senhas do Novo SGA, modernizado com Vue 3, Vite e CSS responsivo. O painel exibe a chamada atual, local de atendimento, histórico, relógio, som e anúncio por voz.

## Funcionalidades nesta edição

- Interface responsiva para celular, tablet, computador e TVs grandes.
- Tela cheia com botão discreto para sair.
- Relógio e data próximos da senha chamada.
- Modo demonstração e integração isolada em `src/services/legacySgaApi.js`.
- Configurações de conexão, aparência e som/voz.
- Seleção de todos os serviços.
- Sons de alerta armazenados em `public/sounds/`.
- Configurações salvas no navegador de cada equipamento.

O recurso de campanhas foi retirado temporariamente desta edição: não há aba de campanhas, rotação de mídia ou API de campanhas. O card de boas-vindas voltou ao modo fixo. A pasta de sons foi mantida.

## Ambiente XAMPP informado

Configuração observada na captura do usuário em 22/10/2026:

- Windows 64-bit.
- XAMPP Control Panel 3.2.2.
- XAMPP/PHP 7.0.3.
- Apache ativo nas portas 80 e 443.
- MySQL ativo na porta 3306.

O Apache serve os arquivos de produção contidos em `dist/`; Node.js/npm são necessários apenas no computador usado para desenvolvimento e compilação. Como a funcionalidade de campanhas não está ativa, a interface não depende da API PHP de campanhas.

## Desenvolvimento e publicação

Desenvolvimento:

```powershell
npm install
npm run dev
```

Compilação:

```powershell
npm run build
```

O build gera/atualiza `dist/` dentro da pasta do projeto. Para o Apache, mantenha `.htaccess` na raiz do projeto e acesse `/sgaprd/paineltv-modernizado/`.

## Integração com o Novo SGA

O adaptador atual foi preparado a partir de rotas identificadas anteriormente:

- `GET /api/unidades`
- `GET /api/servicos/{unidade}`
- `GET /api/painel/{unidade}?servicos=1,2,3`

Essas rotas precisam ser validadas contra a versão real do Novo SGA antes do uso em produção.
