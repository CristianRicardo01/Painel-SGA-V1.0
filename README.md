# Painel SGA — Painel de Atendimento

![Vue.js](https://img.shields.io/badge/Vue.js-3-42b883?logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-orange)

Painel web para exibição de chamadas do **Novo SGA**, desenvolvido para recepções, clínicas, hospitais e ambientes de atendimento. A interface prioriza a leitura à distância e pode ser utilizada em computadores, monitores e televisores.

> **Estado do projeto:** em desenvolvimento. Nesta versão, o módulo de campanhas com fotos e vídeos está temporariamente desativado. O foco atual é o painel de chamadas, conexão com o SGA, histórico, relógio, tela cheia e alertas sonoros/voz.

---

## ✨ Funcionalidades

- **Painel de chamadas:** destaca a senha atual e o local/guichê de atendimento.
- **Histórico recente:** mostra as últimas chamadas recebidas.
- **Integração configurável:** permite informar a URL base do Novo SGA, escolher a unidade e selecionar os serviços que serão exibidos.
- **Seleção em lote:** botão para selecionar ou desmarcar todos os serviços disponíveis.
- **Modo de demonstração:** permite visualizar o layout sem conectar imediatamente ao SGA.
- **Alertas sonoros:** opções de sons locais e teste de reprodução.
- **Anúncio por voz:** utiliza os recursos de síntese de voz disponíveis no navegador.
- **Relógio e data:** informação de horário no painel.
- **Tela cheia:** aproveita melhor a área disponível e permite sair do modo de tela cheia.
- **Layout responsivo:** estilos adaptados para celulares, tablets, computadores e TVs de alta resolução.
- **Configurações locais:** as preferências são mantidas no navegador do equipamento utilizado.

## 🧰 Tecnologias

- [Vue 3](https://vuejs.org/) — interface baseada em componentes.
- [Vite 8](https://vite.dev/) — servidor de desenvolvimento e build de produção.
- JavaScript (ES Modules).
- HTML5 e CSS responsivo.
- Web Audio / HTML Audio e Speech Synthesis, conforme suporte do navegador.
- Apache/XAMPP para hospedagem da versão compilada.

## 📋 Requisitos

### Para desenvolvimento e compilação

- Node.js compatível com Vite 8 (**20.19+ ou 22.12+**).
- npm.
- Navegador moderno atualizado.

Consulte os requisitos atuais na [documentação oficial do Vite](https://vite.dev/guide/).

### Para hospedar no XAMPP

- Apache com `mod_rewrite` habilitado.
- Permissão para uso de `.htaccess` (`AllowOverride All` no diretório correspondente).
- Node.js/npm **não são necessários no servidor** quando a pasta `dist` já foi gerada em uma máquina de desenvolvimento e copiada para o servidor.

> O painel em si é uma aplicação frontend estática. O PHP não é necessário para renderizar a interface desta versão. A versão atual não inclui a API local de campanhas.

## 🚀 Começar em desenvolvimento

Clone o repositório e entre na pasta do projeto:

```bash
git clone <URL-DO-SEU-REPOSITORIO>
cd paineltv-modernizado
```

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O Vite exibirá no terminal o endereço local, normalmente `http://localhost:5173/`.

### Outros comandos

| Comando           | Finalidade                                                       |
| ----------------- | ---------------------------------------------------------------- |
| `npm run dev`     | Inicia o servidor de desenvolvimento com atualização automática. |
| `npm run build`   | Gera a versão otimizada para produção dentro de `dist/`.         |
| `npm run preview` | Serve localmente o build gerado para uma verificação prévia.     |

No Windows, o projeto também inclui os arquivos `iniciar-desenvolvimento.bat` e `gerar-producao.bat`, que automatizam esses comandos.

## 🏗️ Gerar a versão de produção

Na raiz do projeto, execute:

```bash
npm install
npm run build
```

O Vite criará/atualizará a pasta `dist/`. Essa pasta contém o `index.html` final e os recursos compilados para publicação.

A pasta `dist/` e `node_modules/` estão no `.gitignore`: normalmente, não precisam ser versionadas no GitHub. Gere `dist/` na máquina de desenvolvimento antes de publicar ou copie o build para o servidor.

## 🖥️ Publicar no Apache/XAMPP

O projeto foi preparado para poder ficar dentro de uma subpasta do `htdocs`, sem espalhar os arquivos da aplicação por outras pastas.

Exemplo de caminho no Windows:

```text
C:\xampp\htdocs\sgaprd\paineltv-modernizado\
```

1. Na máquina de desenvolvimento, execute `npm run build`.
2. Copie a pasta `dist/` gerada para dentro de `paineltv-modernizado/` no servidor.
3. Mantenha o arquivo `.htaccess` na raiz de `paineltv-modernizado/`.
4. No XAMPP, inicie o Apache.
5. Acesse o endereço correspondente à sua instalação, por exemplo:

   ```text
   http://localhost/sgaprd/paineltv-modernizado/
   ```

   Para abrir em outro computador ou TV da rede, substitua `localhost` pelo endereço IP ou nome de rede do servidor.

### Se aparecer uma página em branco ou erro 404

- Confirme que `dist/index.html` existe.
- Confira se `dist/assets/` contém o JavaScript e o CSS gerados no último build.
- Verifique se `mod_rewrite` está habilitado no Apache.
- No bloco `<Directory>` que atende o `htdocs`, confira se `AllowOverride All` está habilitado.
- Abra as ferramentas de desenvolvedor do navegador (F12) e verifique a aba **Console** e a aba **Network**.
- Consulte `C:\xampp\apache\logs\error.log` se o Apache apresentar erro HTTP 500.

## 🔌 Configurar a conexão com o Novo SGA

1. Abra **Configurações → Conexão** no painel.
2. Escolha o modo de demonstração para validar o visual ou o modo de conexão com o SGA.
3. Informe a URL base do Novo SGA, sem acrescentar `/api` ao final.
4. Teste a conexão, escolha a unidade e selecione os serviços que devem aparecer.
5. Salve as configurações.

O adaptador de integração está em `src/services/legacySgaApi.js` e utiliza as seguintes rotas identificadas no projeto de referência:

- `GET /api/unidades`
- `GET /api/servicos/{unitId}`
- `GET /api/painel/{unitId}?servicos=1,2,3`

**Importante:** essas rotas precisam ser confirmadas na instalação real do Novo SGA. Versões diferentes podem utilizar endpoints, autenticação ou contratos de resposta diferentes. Se o SGA estiver em outro domínio, o servidor também precisa permitir as requisições do navegador (CORS).

## 🔊 Sons e voz

Os arquivos de áudio distribuídos com o projeto ficam em `public/sounds/`. As opções são selecionadas em **Configurações → Som e voz**. O funcionamento do áudio depende das permissões do navegador; em alguns equipamentos, pode ser necessário interagir com a página antes da primeira reprodução.

Para adicionar outro arquivo de áudio, copie-o para `public/sounds/` e inclua a opção correspondente no seletor de sons de `src/App.vue`. Depois, gere novamente o build com `npm run build`.

## 🗂️ Estrutura do projeto

```text
paineltv-modernizado/
├── public/
│   └── sounds/                 # Arquivos de áudio usados pelo painel
├── src/
│   ├── components/
│   │   └── AppIcon.vue         # Componente de ícones
│   ├── services/
│   │   └── legacySgaApi.js     # Adaptador para API do SGA
│   ├── App.vue                 # Interface e lógica principal
│   ├── main.js                 # Inicialização do Vue
│   └── style.css               # Estilos e responsividade
├── dist/                       # Build de produção (gerado localmente)
├── .htaccess                   # Regras de publicação no Apache
├── index.html                  # Entrada do Vite em desenvolvimento
├── package.json                # Scripts e dependências
├── package-lock.json           # Versões resolvidas pelo npm
├── vite.config.js              # Configuração do Vite
├── iniciar-desenvolvimento.bat # Atalho de desenvolvimento para Windows
├── gerar-producao.bat          # Atalho para gerar o build
└── README.md
```

## 🛣️ Próximas melhorias

- Validar a integração com a versão do Novo SGA utilizada no ambiente de destino.
- Adicionar testes automatizados para normalização e apresentação das chamadas.
- Documentar os contratos das APIs conforme a versão do SGA.
- Reintroduzir o módulo de campanhas em uma etapa futura, caso necessário.

## 🤝 Contribuição

Sugestões e melhorias são bem-vindas. Para contribuir:

1. Crie um fork do repositório.
2. Crie uma branch para sua alteração (`git checkout -b feat/minha-melhoria`).
3. Faça commits pequenos e objetivos.
4. Envie um Pull Request explicando o problema e a solução proposta.

## 📄 Licença

Este repositório ainda não declara uma licença de código aberto. Antes de permitir reutilização, distribuição ou modificação por terceiros, adicione um arquivo `LICENSE` com a licença escolhida.

---

<p align="center">
  Desenvolvido para modernizar a visualização de chamadas do atendimento com uma interface responsiva e de fácil leitura.
</p>
