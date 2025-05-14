// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Elementos da UI
    const btnAddJogador = document.getElementById('btn-add-jogador');
    const inputNomeJogador = document.getElementById('nome-jogador');
    const jogadoresUl = document.getElementById('jogadores-ul');
    const btnIrConfiguracao = document.getElementById('btn-ir-configuracao');

    const inputNumCasas = document.getElementById('num-casas');
    const inputNumCasasEspeciais = document.getElementById('num-casas-especiais');
    const inputNumCasasPerguntas = document.getElementById('num-casas-perguntas');
    const btnIniciarJogo = document.getElementById('btn-iniciar-jogo');

    const btnLancarDado = document.getElementById('btn-lancar-dado');
    const btnJogarNovamente = document.getElementById('btn-jogar-novamente');

    const btnEncerrarJogoManual = document.getElementById('btn-encerrar-jogo-manual'); // << NOVO BOTÃO

    let tempPlayerNames = []; // Array para manter os nomes dos jogadores entre as partidas
    const MAX_PLAYERS = 40; // Limite de jogadores

    let firstInteractionDone = false; // Flag para controle de primeira interação (áudio)
    let gameDataLoaded = false; // Flag para indicar se os dados do jogo (perguntas/ações) foram carregados

    // --- FUNÇÕES AUXILIARES ---
    function exibirTelaCadastro() {
        ui.switchScreen('tela-cadastro');
        // Repopular a lista de jogadores se já existirem nomes
        jogadoresUl.innerHTML = ''; // Limpa lista antiga
        if (tempPlayerNames.length > 0) {
            tempPlayerNames.forEach(nome => {
                const li = document.createElement('li');
                const colorIndex = jogadoresUl.children.length;
                const playerColor = (typeof PLAYER_COLORS !== 'undefined' && PLAYER_COLORS.length > 0)
                    ? PLAYER_COLORS[colorIndex % PLAYER_COLORS.length]
                    : '#ccc';

                const colorIndicator = document.createElement('span');
                colorIndicator.className = 'player-color-indicator';
                colorIndicator.style.backgroundColor = playerColor;
                li.appendChild(colorIndicator);
                li.appendChild(document.createTextNode(nome));
                jogadoresUl.appendChild(li);
            });
            btnIrConfiguracao.disabled = false;
        } else {
            btnIrConfiguracao.disabled = true;
        }
    }

    async function carregarDadosDoJogo() {
        try {
            // `loadQuestions` é global (de questions.js)
            // `game.loadSpecialActions` é um método do objeto game
            const [loadedQs, loadedActions] = await Promise.all([
                loadQuestions(),
                game.loadSpecialActions()
            ]);

            if (loadedQs && loadedQs.length > 0 && loadedActions && loadedActions.length > 0) {
                ////console.log("Perguntas e Ações Especiais carregadas com sucesso no main.js");
                gameDataLoaded = true;
            } else {
                let errorMsg = "Erro ao carregar dados do jogo. ";
                if (!loadedQs || loadedQs.length === 0) errorMsg += "Perguntas não carregadas. ";
                if (!loadedActions || loadedActions.length === 0) errorMsg += "Ações especiais não carregadas. ";
                alert(errorMsg + "O jogo pode não funcionar corretamente.");
                gameDataLoaded = false; // Garante que está false se algo falhar
            }
        } catch (error) {
            alert("Falha crítica ao carregar dados do jogo. Verifique o //console e os arquivos JSON.");
            ////console.error("Erro em carregarDadosDoJogo:", error);
            gameDataLoaded = false;
        }
    }


    function handleFirstInteraction() {
        if (!firstInteractionDone) {
            ////console.log("Primeira interação do usuário detectada.");
            // Tenta pré-carregar sons (se a função e a lista existirem em audio.js)
            if (typeof preloadSounds === 'function' && typeof SOUNDS_TO_PRELOAD !== 'undefined') {
                preloadSounds(SOUNDS_TO_PRELOAD);
            }
            // Resumir o AudioContext se ele foi suspenso (importante se audio.js usa AudioContext)
            if (typeof audioContext !== 'undefined' && audioContext && audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    //console.log("AudioContext resumido após interação.");
                }).catch(e => console.error("Erro ao resumir AudioContext:", e));
            }
            firstInteractionDone = true;
            // Remove os listeners para não executar múltiplas vezes
            document.body.removeEventListener('click', handleFirstInteraction, true);
            document.body.removeEventListener('keydown', handleFirstInteraction, true);
            ////console.log("Manipulador de primeira interação removido.");
        }
    }

    // --- EVENT LISTENERS ---
    btnAddJogador.addEventListener('click', () => {
        handleFirstInteraction(); // Garante que a primeira interação habilite o áudio
        const nome = inputNomeJogador.value.trim();
        if (nome && tempPlayerNames.length < MAX_PLAYERS) {
            tempPlayerNames.push(nome);
            exibirTelaCadastro(); // Atualiza a lista na UI
            inputNomeJogador.value = '';
        } else if (tempPlayerNames.length >= MAX_PLAYERS) {
            alert(`MÁXIMO DE ${MAX_PLAYERS} JOGADORES ATINGIDO!`);
        } else if (!nome) {
            alert("FAVOR INSERIR UM NOME PARA O JOGADOR.");
        }
    });

    btnIrConfiguracao.addEventListener('click', () => {
        handleFirstInteraction();
        if (tempPlayerNames.length > 0) {
            if (gameDataLoaded) {
                ui.switchScreen('tela-configuracao');
            } else {
                alert("Os dados do jogo ainda estão carregando ou falharam ao carregar. Por favor, aguarde ou recarregue a página.");
            }
        } else {
            alert("ADICIONE AO MENOS UM JOGADOR.");
        }
    });

    btnIniciarJogo.addEventListener('click', async () => { // Tornar async para `await game.setupGame`
        handleFirstInteraction();
        if (!gameDataLoaded) {
            alert("Os dados do jogo não foram carregados. Tente recarregar a página.");
            return;
        }

        const numCasas = parseInt(inputNumCasas.value, 10);
        const configCasasEspeciais = inputNumCasasEspeciais.value.trim();
        const configCasasPerguntas = inputNumCasasPerguntas.value.trim();

        if (numCasas >= 10 && numCasas <= 100) {
            // Desabilitar botões para evitar múltiplos cliques enquanto configura
            btnIniciarJogo.disabled = true;
            try {
                // game.setupGame agora é async por causa do loadSpecialActions interno se necessário
                await game.setupGame(tempPlayerNames, numCasas, configCasasEspeciais, configCasasPerguntas);
                // A função setupGame agora chama ui.switchScreen('tela-jogo')
            } catch (error) {
                console.error("Erro durante a configuração do jogo:", error);
                alert("Ocorreu um erro ao iniciar o jogo. Verifique o //console.");
            } finally {
                btnIniciarJogo.disabled = false; // Reabilitar o botão
            }
        } else {
            alert("Número de casas do tabuleiro inválido. Deve ser entre 10 e 100.");
        }
    });

    btnLancarDado.addEventListener('click', () => {
        handleFirstInteraction(); // Caso o primeiro clique seja aqui
        // A lógica de desabilitar o dado já está em game.rollDice e animations.js
        game.rollDice();
    });

    btnJogarNovamente.addEventListener('click', () => {
        handleFirstInteraction();
        game.resetGame();
        // tempPlayerNames é mantido para a próxima partida
        exibirTelaCadastro(); // Volta para a tela de cadastro e repopula a lista se houver nomes
    });

    // NOVO EVENT LISTENER
    if (btnEncerrarJogoManual) { // Verifica se o botão existe
        btnEncerrarJogoManual.addEventListener('click', () => {
            // Adicionar uma confirmação para evitar cliques acidentais
            if (confirm("TEM CERTEZA QUE DESEJA ENCERRAR O JOGO?")) {
                if (game && typeof game.endGameManually === 'function') {
                    game.endGameManually();
                } else {
                    console.error("Função game.endGameManually() não encontrada.");
                }
            }
        });
    }

    // --- INICIALIZAÇÃO ---

    // Adiciona listeners para a primeira interação para habilitar áudio/pré-carregamento
    document.body.addEventListener('click', handleFirstInteraction, true); // true para fase de captura
    document.body.addEventListener('keydown', handleFirstInteraction, true); // true para fase de captura

    // Carregar os dados do jogo (perguntas e ações especiais) assim que o DOM estiver pronto
    carregarDadosDoJogo().then(() => {
        // Após os dados serem carregados (ou falharem), exibe a tela de cadastro
        exibirTelaCadastro();
    });
});
