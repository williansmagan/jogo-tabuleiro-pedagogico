# Desafio do Conhecimento - Jogo de Tabuleiro Digital Educativo

Bem-vindo ao "Desafio do Conhecimento"! Um jogo de tabuleiro digital interativo e personalizável, projetado para tornar o aprendizado divertido e engajador para alunos. Avance pelo tabuleiro, responda a perguntas desafiadoras, enfrente casas especiais com surpresas e dispute o pódio dos maiores exploradores do saber!

## Visão Geral

Este jogo de tabuleiro permite que múltiplos jogadores (até 40) avancem em um circuito respondendo a perguntas de múltipla escolha ou verdadeiro/falso. O objetivo é alcançar o final do tabuleiro, acumulando pontos ao longo do caminho. O jogo inclui casas especiais com ações diversas para tornar a partida mais dinâmica e divertida.

![Gameplay Screenshot](https://jogo.wmstecnologia.com.br/assets/images/screenshot.png)

## Funcionalidades Principais

*   **Tabuleiro Dinâmico:** O número de casas é configurável, criando uma nova experiência a cada partida.
*   **Cadastro de Jogadores:** Até 40 jogadores podem participar, cada um com um avatar e cor distintos.
*   **Perguntas Personalizáveis:**
    *   As perguntas são carregadas de um arquivo `perguntas.json`, permitindo fácil adição e edição de conteúdo.
    *   Suporte a perguntas de múltipla escolha e verdadeiro/falso.
    *   Cada pergunta pode ter pontuação e tempo limite específicos.
    *   **Filtros Avançados:** As perguntas podem ser filtradas por:
        *   **Bimestre:** Selecione um ou mais bimestres.
        *   **Ano/Turma:** Selecione um ou mais anos/turmas.
        *   **Componente Curricular (Matéria):** Ex: Geografia, Arte, Ciências.
        *   **Nível de Dificuldade.**
*   **Casas Especiais:**
    *   Casas que acionam ações fixas ou aleatórias (avançar, voltar, perder/ganhar pontos, trocar de lugar, etc.).
    *   Carregadas de um arquivo `acoes_especiais.json`.
*   **Sistema de Pontuação:** Ganhe pontos por respostas corretas. A pontuação negativa pode ser habilitada ou desabilitada.
*   **Ranking em Tempo Real:** Acompanhe a classificação dos jogadores durante a partida.
*   **Timer para Jogadas:** Os jogadores têm um tempo limite para lançar o dado, adicionando dinamismo.
*   **Timer para Perguntas:** Cada pergunta tem seu próprio tempo para ser respondida.
*   **Pódio dos Campeões:** Ao final do jogo, os 3 melhores jogadores são celebrados em um pódio animado, seguido por uma tabela de classificação geral.
*   **Design Moderno e Atraente:** Interface com paleta de cores vibrante e fontes amigáveis, pensada para o público estudantil.
*   **Opções de Acessibilidade Visual:** Possibilidade de exibir todos os textos em caixa alta.
*   **Efeitos Sonoros:** Para uma experiência mais imersiva (requer arquivos de som na pasta `assets/sounds/`).
*   **Animações:** Movimento de peões, rolagem de dados e pódio animados.


## Estrutura de Pastas do Projeto

/
├── index.html                 # Arquivo principal da interface
├── data/
│   ├── perguntas.json         # Banco de dados de perguntas
│   └── acoes_especiais.json   # Banco de dados de ações especiais
└── assets/
    ├── css/
    │   └── style.css          # Estilos visuais do jogo
    ├── js/
    │   ├── player.js          # Classe Player
    │   ├── questions.js       # Lógica para carregar perguntas
    │   ├── audio.js           # Controle de áudio
    │   ├── animations.js      # Lógica de animações
    │   ├── ui.js              # Manipulação da interface do usuário
    │   ├── gameLogic.js       # Lógica principal do jogo
    │   └── main.js            # Script principal, inicialização e eventos
    ├── images/
    │   ├── logo-jogo.png      # Logo exibido na tela de splash
    │   ├── splash-bg.jpg      # Imagem de fundo da tela de splash (opcional)
    │   ├── favicon.ico
    │   ├── dice_1.png ... dice_6.png # Imagens das faces do dado
    │   └── avatars/             # Pasta para imagens de avatar dos jogadores
    │       └── avatar1.png
    │       └── ...
    ├── font/
    │   └── Nunito.ttf           # Arquivo da fonte Nunito (ou Nunito-VariableFont_wght.ttf)
    └── sounds/                  # Pasta para arquivos de som (opcional)
        └── dice_roll.mp3
        └── ...


## Tecnologias Utilizadas

*   HTML5
*   CSS3 (com Variáveis CSS, Flexbox, Grid)
*   JavaScript (ES6+)

## Como Jogar

1.  **Cadastro:** Na tela inicial, adicione os nomes dos jogadores. Um indicador de cor será atribuído a cada um.
2.  **Configuração:** Defina o número de casas desejado para o tabuleiro.
3.  **Início do Jogo:** Clique em "Iniciar Jogo!".
4.  **Turnos:**
    *   O jogador da vez clica em "Lançar Dado".
    *   O peão se move o número de casas indicado pelo dado.
    *   Se cair em uma casa de **pergunta**, o modal da pergunta aparecerá. Responda dentro do tempo limite.
        *   Acertar soma pontos.
        *   Errar resulta em uma pequena perda aleatória de pontos.
    *   Se cair em uma **casa especial**, uma ação específica será executada. Um modal descreverá a ação.
5.  **Fim do Jogo:** O jogo termina quando todos os jogadores alcançarem a casa "FIM" ou quando o botão "Encerrar Jogo" for pressionado. Um pódio com os vencedores será exibido.

## Como Configurar e Executar Localmente

1.  **Baixar ou Clonar o Repositório:**
    ```bash
    # Substitua pelo link do seu repositório
    git clone https://github.com/williansmagan/jogo-tabuleiro-pedagogico.git
    cd jogo-tabuleiro-pedagogico
    ```
    Ou baixe o arquivo ZIP do GitHub e extraia-o.

2.  **Servidor Web Local (Recomendado):**
    Devido às políticas de segurança do navegador (CORS) ao carregar arquivos locais (`file:///`), é **altamente recomendável** executar o jogo a partir de um servidor web local.
    *   **VS Code:** Instale a extensão "Live Server" de Ritwick Dey. Clique com o botão direito no arquivo `index.html` e selecione "Open with Live Server".
    *   **Python:** Navegue até a pasta do projeto no terminal e execute:
        *   Python 3: `python -m http.server`
        *   Python 2: `python -m SimpleHTTPServer`
        Acesse `http://localhost:8000` (ou a porta indicada) no seu navegador.
    *   **Node.js (com `serve`):**
        ```bash
        # Instale globalmente se ainda não tiver
        npm install -g serve  
        # Na pasta do projeto, execute:
        serve .
        ```
        Acesse a URL fornecida (geralmente `http://localhost:3000` ou `http://localhost:5000`).
    *   **XAMPP:** Instale a versão de acordo com seu sistema operacional. Copie a pasta baixada para a pasta "htdocs". Inicie os serviços do XAMPP e abra o navegador de internet do computador. Digite: `http://localhost/jogo-tabuleiro-pedagogico` para testar e jogar.
    *   

## Como Executar On-Line

Acesse a URL `https://jogo.wmstecnologia.com.br`.

## Personalizando as Perguntas

As perguntas do jogo são carregadas do arquivo `data/perguntas.json`. Você pode editar este arquivo ou criar novos para diferentes conteúdos.

**Formato de Cada Pergunta no JSON:**

```json
{
    "id": 1,
    "texto": "Qual a capital da França?",
    "opcoes": ["Paris", "Londres", "Berlim", "Madri"],
    "resposta_correta": "Paris",
    "pontos": 10,
    "tempo": 15,
    "categoria": "Geografia",
    "dificuldade": "Fácil",
    "ano_turma": ["6º Ano", "Todos"],
    "bimestre": "1º Bimestre"
},
{
    "id": 2,
    "tipo": "verdadeiro_falso",
    "texto": "A Muralha da China é visível do espaço a olho nu.",
    "opcoes": ["VERDADEIRO", "FALSO"],
    "resposta_correta": "FALSO",
    "tempo": 20,
    "pontos": 15,
    "categoria": "Geral",
    "dificuldade": "Fácil",
    "ano_turma": "8º Ano",
    "bimestre": "2º Bimestre"
}
```

**Campos:**
*   `id`: Identificador único para a pergunta (string).
*   `tipo`: `"multipla_escolha"` ou `"verdadeiro_falso"`.
*   `texto`: O texto da pergunta (string).
*   `opcoes`: Array de strings com as opções (obrigatório para `multipla_escolha`; para `verdadeiro_falso`, pode ser `["VERDADEIRO", "FALSO"]` ou similar).
*   `resposta_correta`: A string exata da resposta correta (deve corresponder a uma das `opcoes` para múltipla escolha, ou ao texto da opção correta para V/F).
*   `tempo`: Tempo em segundos para responder (número).
*   `pontos`: Pontos ganhos ao acertar (número).
*   `categoria`: Categoria da pergunta (componente currícular / disciplina) (string).
*   `dificuldade`: Nível da dificuldade da questão (string).
*   `ano_turma`: Informação individual ou array de ano/turma (entre colchetes) para filtragem na tela de configuração (array / string).
*   `bimestre`: Bimestre relacionado a questão (string).

**Observações:**
*   O arquivo `perguntas.json` deve ser um array `[]` válido de objetos de pergunta.
*   Valide seu JSON em um validador online (como [JSONLint](https://jsonlint.com/)) antes de usar.

## Estrutura do Projeto

```
.
├── index.html                # Arquivo principal do jogo
├── css/
│   └── style.css             # Estilos visuais
├── js/
│   ├── main.js               # Lógica principal de inicialização e eventos da UI
│   ├── gameLogic.js          # Regras do jogo, turnos, pontuação, lógica das casas
│   ├── ui.js                 # Funções para manipular a interface do usuário (DOM)
│   ├── player.js             # Classe para representar jogadores
│   ├── questions.js          # Lógica para carregar e gerenciar perguntas
│   ├── audio.js              # Funções para controle de áudio
│   └── animations.js         # Funções para animações visuais
├── data/
│   └── perguntas.json        # Arquivo com as perguntas e respostas
|   ├── acoes_especiais.json  # Arquivo com as configurações das casas especiais
└── assets/
    ├── images/               # Imagens (dados, peões, etc.)
    └── sounds/               # Arquivos de áudio para efeitos sonoros
```

## Como Contribuir

Contribuições são bem-vindas! Se você tem ideias para melhorias, encontrou bugs ou quer adicionar novas funcionalidades:

1.  Faça um Fork do repositório.
2.  Crie uma nova Branch (`git checkout -b minha-feature`).
3.  Faça commit das suas alterações (`git commit -m 'Adiciona nova feature'`).
4.  Faça Push para a Branch (`git push origin minha-feature`).
5.  Crie um novo Pull Request.

Por favor, tente manter o estilo de código existente e adicione comentários relevantes.

## Licença

Este projeto está licenciado sob a Licença MIT para uso educacional.

---

Desenvolvido para tornar o aprendizado mais divertido e engajador!
```
