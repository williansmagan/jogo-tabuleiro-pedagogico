# Jogo de Tabuleiro Educativo Digital

Bem-vindo ao Jogo de Tabuleiro Educativo Digital! Este é um projeto open-source criado para auxiliar professores e alunos do 6º ano (ou outras séries, com adaptação das perguntas) a revisar conteúdos de forma lúdica e interativa. O jogo é um circuito digital que roda diretamente no navegador.

## Visão Geral

Este jogo de tabuleiro permite que múltiplos jogadores (até 40) avancem em um circuito respondendo a perguntas de múltipla escolha ou verdadeiro/falso. O objetivo é alcançar o final do tabuleiro, acumulando pontos ao longo do caminho. O jogo inclui casas especiais com ações diversas para tornar a partida mais dinâmica e divertida.

![Gameplay Screenshot](https://jogo.wmstecnologia.com.br/assets/images/screenshot.png)

## Funcionalidades

*   **Cadastro de Jogadores:** Permite cadastrar até 40 jogadores, cada um identificado por uma cor.
*   **Configuração do Tabuleiro:** O número de casas no tabuleiro pode ser configurado antes de iniciar o jogo.
*   **Perguntas Personalizáveis:** As perguntas (múltipla escolha e V/F) são carregadas de um arquivo JSON externo (`data/perguntas.json`), permitindo fácil personalização do conteúdo para diferentes matérias ou tópicos.
    *   Cada pergunta pode ter um tempo limite para resposta e uma pontuação específica.
*   **Casas Especiais:** Aproximadamente 30% (ou outro valor definido no momento da configuração do jogo) do tabuleiro é composto por casas com ações especiais, como:
    *   Avançar ou voltar casas.
    *   Retornar ao início.
    *   Perder pontos.
    *   Trocar de lugar ou pontos com outros jogadores (escolha do jogador ou aleatório).
    *   Efeitos que afetam todos os jogadores.
*   **Layout do Tabuleiro em Zigue-zague:** As casas são dispostas em um formato de serpentina para uma progressão mais natural.
*   **Ranking Dinâmico:** O ranking dos jogadores é atualizado em tempo real com base na pontuação.
*   **Pódio Animado:** Ao final do jogo (quando todos os jogadores chegam ao fim ou o jogo é encerrado manualmente), um pódio animado exibe os três melhores colocados.
*   **Encerramento Manual:** Um botão permite que o jogo seja encerrado a qualquer momento, exibindo o pódio com as pontuações atuais.
*   **Efeitos Sonoros:** Efeitos sonoros para diversas ações do jogo (rolar dado, mover peão, acerto/erro, etc.).
*   **Ajuste de Pontos por Erro:** Perda aleatória de 1 a 3 pontos ao errar uma pergunta.

## Tecnologias Utilizadas

*   HTML5
*   CSS3
*   JavaScript (Vanilla JS)

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
  "id": "q1", 
  "tipo": "multipla_escolha", 
  "texto": "QUAL A FORMA SIMPLIFICADA DA FRAÇÃO 4/24?", 
  "opcoes": ["12/2", "2/12", "1/6", "6/1"], 
  "resposta_correta": "1/6", 
  "tempo": 45, 
  "pontos": 20 
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
