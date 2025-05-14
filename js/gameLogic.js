// js/gameLogic.js
const game = {
    players: [],
    boardData: [], // Armazena dados para casas 1 a totalCasas
    totalCasas: 30, // Valor padrão, será configurado
    currentPlayerIndex: 0,
    gameQuestions: [], // Perguntas carregadas para este jogo
    usedQuestionIds: [],

    allSpecialActions: [], // Ações carregadas do JSON
    SPECIAL_ACTIONS: [],   // Ações processadas com funções de efeito

    rollDiceTimer: null, // Para armazenar o ID do setTimeout
    ROLL_DICE_TIMEOUT_DURATION: 10000, // 10 segundos em milissegundos

    // --- CARREGAMENTO E PROCESSAMENTO DE AÇÕES ESPECIAIS ---
    async loadSpecialActions() {
        try {
            const response = await fetch('data/acoes_especiais.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            this.allSpecialActions = await response.json();
            ////console.log("Ações Especiais do JSON carregadas:", this.allSpecialActions);

            // Mapear effectType para funções de efeito reais
            this.SPECIAL_ACTIONS = this.allSpecialActions.map(actionData => ({
                ...actionData, // Mantém id, text, needsPlayerSelection, isFixed, etc.
                effect: this.getEffectFunction(actionData)
            }));
            ////console.log("SPECIAL_ACTIONS processadas com funções de efeito:", this.SPECIAL_ACTIONS);
            return this.SPECIAL_ACTIONS;
        } catch (error) {
            ////console.error("Falha ao carregar/processar ações especiais:", error);
            alert("Erro crítico: Não foi possível carregar as ações especiais do jogo.");
            this.SPECIAL_ACTIONS = []; // Garante que está vazio se falhar
            return [];
        }
    },

    getEffectFunction(actionData) {
        return (player, gameInstance, targetPlayerId) => {
            ////console.log(`Executando efeito: ${actionData.effectType} para ${player.name}. Dados da ação:`, actionData);

            const targetPlayer = targetPlayerId ? gameInstance.players.find(p => p.id === targetPlayerId) : null;
            let message = actionData.feedback || "";
            let value; // Para ações que usam um valor aleatório ou fixo da actionData
            let oldPos;

            switch (actionData.effectType) {
                case "moveRelative":
                    const oldPosMove = player.position;
                    player.moveTo(player.position + actionData.value, gameInstance.totalCasas);
                    ui.updatePlayerPawn(player, oldPosMove);
                    // Não precisa de modal aqui, o movimento é o efeito.
                    break;
                case "returnToStart":
                    const oldPosStart = player.position;
                    player.returnToStart();
                    ui.updatePlayerPawn(player, oldPosStart);
                    break;
                case "resetPoints":
                    player.resetPoints();
                    // Poderia ter um modal "Você perdeu todos os seus pontos!"
                    break;
                case "swapPosition":
                    if (targetPlayer && targetPlayer.id !== player.id) {
                        const tempPosPlayer = player.position;
                        const tempPosTarget = targetPlayer.position;
                        player.moveTo(tempPosTarget, gameInstance.totalCasas);
                        targetPlayer.moveTo(tempPosPlayer, gameInstance.totalCasas);
                        ui.updatePlayerPawn(player, tempPosPlayer);
                        ui.updatePlayerPawn(targetPlayer, tempPosTarget);
                    } else {
                        ////console.warn("Troca de posição: Jogador alvo inválido ou é o próprio jogador.");
                    }
                    break;
                case "moveTargetRelative": // Usado por escolhe_voltar, escolhe_avancar
                    if (targetPlayer) {
                        value = Math.floor(Math.random() * (actionData.max - actionData.min + 1)) + actionData.min;
                        const oldPosTargetMove = targetPlayer.position;
                        targetPlayer.moveTo(targetPlayer.position + value, gameInstance.totalCasas);
                        ui.updatePlayerPawn(targetPlayer, oldPosTargetMove);
                        if (message) {
                            message = message.replace("%TARGET_NAME%", targetPlayer.name).replace("%VALUE%", Math.abs(value));
                            ui.showSpecialActionModal("AÇÃO APLICADA!", message, [], () => {});
                        }
                    }
                    break;
                case "moveAllOthersRelative": // Usado por todos_avancam, todos_voltam
                    value = Math.floor(Math.random() * (actionData.max - actionData.min + 1)) + actionData.min;
                    gameInstance.players.forEach(p => {
                        if (p.id !== player.id && !p.isFinished) {
                            const oldP = p.position;
                            p.moveTo(p.position + value, gameInstance.totalCasas);
                            ui.updatePlayerPawn(p, oldP);
                        }
                    });
                    if (message) {
                        message = message.replace("%VALUE%", Math.abs(value));
                        ui.showSpecialActionModal("EFEITO GLOBAL!", message, [], () => {});
                    }
                    break;
                case "swapScores": // Usado por troca_pontos_escolha
                    if (targetPlayer && targetPlayer.id !== player.id) {
                        // Guarda os nomes antes, pois eles não mudam
                        const nomeJogadorAtivo = player.name;
                        const nomeJogadorAlvo = targetPlayer.name;

                        // Guarda as pontuações ANTES da troca para referência, se necessário para logs
                        // const scoreOriginalJogadorAtivo = player.score;
                        // const scoreOriginalJogadorAlvo = targetPlayer.score;

                        // Realiza a troca de pontuações
                        const tempScorePlayer = player.score;
                        player.score = targetPlayer.score;
                        targetPlayer.score = tempScorePlayer;

                        // Constrói a mensagem de feedback final COM AS NOVAS PONTUAÇÕES e NOMES CORRETOS
                        let feedbackFinalMessage = actionData.feedback || ""; // Pega o template do JSON

                        feedbackFinalMessage = feedbackFinalMessage
                            .replace(/%PLAYER_NAME%/g, nomeJogadorAtivo) // Substitui todas as ocorrências de %PLAYER_NAME%
                            .replace(/%PLAYER_SCORE%/g, player.score)     // Pontuação ATUALIZADA do jogador ativo
                            .replace(/%TARGET_NAME%/g, nomeJogadorAlvo) // Substitui todas as ocorrências de %TARGET_NAME%
                            .replace(/%TARGET_SCORE%/g, targetPlayer.score); // Pontuação ATUALIZADA do jogador alvo

                        //console.log("Mensagem de feedback final para troca de pontos:", feedbackFinalMessage); // Para debug

                        ui.showSpecialActionModal(
                            "PONTUAÇÕES TROCADAS!", // Título do modal de feedback
                            feedbackFinalMessage,       // Mensagem construída
                            [],                         // Sem seleção de jogadores neste modal
                            () => {}                    // Callback simples para fechar
                        );
                    } else if (targetPlayer && targetPlayer.id === player.id) {
                         ui.showSpecialActionModal("Ops!", "Você não pode trocar pontos consigo mesmo.", [], () => {});
                    } else if (!targetPlayer && targetPlayerId) { // Checa se um ID foi fornecido mas o jogador não foi encontrado
                        //console.error(`Troca de pontos: Jogador alvo com ID '${targetPlayerId}' não encontrado.`);
                        ui.showSpecialActionModal("Erro na Troca", `Jogador alvo não encontrado. A troca não pôde ser realizada.`, [], () => {});
                    } else { // Caso genérico de falha, ex: nenhum targetPlayerId foi passado
                        //console.warn("Troca de pontos: Jogador alvo inválido ou não selecionado.");
                        ui.showSpecialActionModal("Erro na Troca", "Não foi possível realizar a troca de pontos (jogador alvo inválido ou não selecionado).", [], () => {});
                    }
                    break;
                case "swapScoresRandom":
                    const otherPlayers = gameInstance.players.filter(p => p.id !== player.id && !p.isFinished);
                    if (otherPlayers.length > 0) {
                        const randomTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];

                        const nomeJogadorAtivo = player.name;
                        const nomeJogadorAlvoAleatorio = randomTarget.name;

                        const tempScorePlayer = player.score;
                        player.score = randomTarget.score;
                        randomTarget.score = tempScorePlayer;

                        let feedbackFinalMessageRandom = actionData.feedback || "";
                        feedbackFinalMessageRandom = feedbackFinalMessageRandom
                            .replace(/%PLAYER_NAME%/g, nomeJogadorAtivo)
                            .replace(/%PLAYER_SCORE%/g, player.score)
                            .replace(/%TARGET_NAME%/g, nomeJogadorAlvoAleatorio)
                            .replace(/%TARGET_SCORE%/g, randomTarget.score);

                        //console.log("Mensagem de feedback final para troca aleatória de pontos:", feedbackFinalMessageRandom);

                        ui.showSpecialActionModal(
                            "TROCA SURPRESA!", // Título do modal
                            feedbackFinalMessageRandom,    // Mensagem construída
                            [],
                            () => {}
                        );
                    } else {
                        ui.showSpecialActionModal("Sem Sorte!", "Não há outros jogadores elegíveis para a troca surpresa.", [], () => {});
                    }
                    break;
                case "moveAllOthersRelative": // Usado por todos_avancam, todos_voltam
                    value = Math.floor(Math.random() * (actionData.max - actionData.min + 1)) + actionData.min;
                    gameInstance.players.forEach(p => {
                        if (p.id !== player.id && !p.isFinished) {
                            const oldP = p.position;
                            // player.moveTo já lida com valores positivos e negativos para 'value'
                            p.moveTo(p.position + value, gameInstance.totalCasas);
                            ui.updatePlayerPawn(p, oldP);
                        }
                    });
                    if (message) {
                        // Math.abs(value) garante que a mensagem mostre um número positivo de casas
                        message = message.replace("%VALUE%", Math.abs(value));
                        ui.showSpecialActionModal("EFEITO EM MASSA!", message, [], () => {});
                    }
                    break;
                case "resetPointsAndReturnToStart":
                    oldPos = player.position;
                    player.resetPoints();
                    player.returnToStart();
                    ui.updatePlayerPawn(player, oldPos);
                    break;
                case "moveToEnd":
                    oldPos = player.position;
                    player.moveTo(gameInstance.totalCasas + 1, gameInstance.totalCasas);
                    ui.updatePlayerPawn(player, oldPos);
                    break;
                case "addPoints":
                    player.addPoints(actionData.value);
                    break;
                case "losePoints":
                    player.losePoints(actionData.value);
                    break;
                case "allOthersReturnToStart": // NOVO
                    gameInstance.players.forEach(p => {
                        if (p.id !== player.id && !p.isFinished) { // Não afeta o jogador ativo nem quem já finalizou
                            const oldPositionOther = p.position;
                            p.returnToStart(); // Usa o método existente do Player
                            ui.updatePlayerPawn(p, oldPositionOther);
                        }
                    });
                    if (message) { // Exibe o feedback definido no JSON
                        ui.showSpecialActionModal("REVIRAVOLTA NO JOGO!", message, [], () => {});
                    }
                    break;

                case "allOthersMoveToEnd": // NOVO
                    gameInstance.players.forEach(p => {
                        if (p.id !== player.id && !p.isFinished) { // Não afeta o jogador ativo nem quem já finalizou (embora ir para o fim os finalize)
                            const oldPositionOther = p.position;
                            // Move para a posição lógica do FIM e marca como finalizado
                            p.moveTo(gameInstance.totalCasas + 1, gameInstance.totalCasas);
                            ui.updatePlayerPawn(p, oldPositionOther);
                        }
                    });
                    if (message) { // Exibe o feedback definido no JSON
                        ui.showSpecialActionModal("SURPRESA FINAL!", message, [], () => {});
                    }
                    break;
                case "skipTurn": // NOVO CASE
                    player.skipNextTurn = true;
                    if (message) { // Exibe o feedback definido no JSON
                        ui.showSpecialActionModal("AZAR!!", message, [], () => {});
                    }
                    break;
                    // --- NOVAS AÇÕES ---
                case "allPlayersIncludingActiveToEnd":
                    //console.log("Executando allPlayersIncludingActiveToEnd");
                    gameInstance.players.forEach(p => {
                        if (!p.isFinished) { // Só move quem ainda não chegou
                            const oldPositionP = p.position;
                            p.moveTo(gameInstance.totalCasas + 1, gameInstance.totalCasas); // Move para o fim e marca como finalizado
                            ui.updatePlayerPawn(p, oldPositionP);
                        }
                    });
                    if (message) {
                        // Mostra o feedback antes de chamar endGame,
                        // pois endGame muda a tela e o modal pode não ser visto.
                        ui.showSpecialActionModal("FIM ABRUPTO!", message, [], () => {
                            // O jogo vai terminar naturalmente porque checkGameOverOrNextTurn
                            // será chamado e verá que todos finalizaram.
                            // No entanto, para garantir o fim imediato, podemos chamar gameInstance.endGame()
                            // mas precisamos ter cuidado para não criar loops se endGame chamar nextTurn.
                            // A lógica atual de handleSquareLanding -> checkGameOverOrNextTurn deve cuidar disso.
                        });
                    }
                    // Não chamamos gameInstance.endGame() diretamente aqui.
                    // A alteração do estado dos jogadores para isFinished=true fará com que
                    // checkGameOverOrNextTurn chame endGame() corretamente.
                    break;
                case "allPlayersIncludingActiveToStart":
                    //console.log("Executando allPlayersIncludingActiveToStart");
                    gameInstance.players.forEach(p => {
                        // Mesmo que já esteja no início, resetar pode ser útil se houver
                        // alguma lógica de "primeira vez no início" no futuro.
                        // Também garante que isFinished seja falso, caso estivessem no fim.
                        const oldPositionP = p.position;
                        p.returnToStart(); // Método do Player que reseta posição e isFinished
                        ui.updatePlayerPawn(p, oldPositionP);
                    });
                    if (message) {
                        ui.showSpecialActionModal("RECOMEÇO GERAL!", message, [], () => {});
                    }
                    break;
                    // --- NOVAS AÇÕES ---
                case "allPlayersIncludingActiveResetPoints":
                    //console.log("Executando allPlayersIncludingActiveResetPoints");
                    gameInstance.players.forEach(p => {
                        p.resetPoints(); // Usa o método do Player para zerar os pontos
                    });
                    // A UI de ranking será atualizada pelo updateGameUI() chamado após o efeito.
                    if (message) {
                        ui.showSpecialActionModal("PONTUAÇÃO ZERADA!", message, [], () => {});
                    }
                    break;
                case "allOthersGainRandomPoints":
                    //console.log("Executando allOthersGainRandomPoints");
                    // Pega os valores min e max do actionData, com fallbacks se não definidos
                    const minPts = actionData.minPoints || 5;  // Fallback para 5 se não definido
                    const maxPts = actionData.maxPoints || 25; // Fallback para 25 se não definido
                    let feedbackDetalhado = ""; // Para construir uma mensagem mais específica

                    gameInstance.players.forEach(p => {
                        if (p.id !== player.id) { // Afeta todos, MENOS o jogador ativo
                            const pontosGanhos = Math.floor(Math.random() * (maxPts - minPts + 1)) + minPts;
                            p.addPoints(pontosGanhos);
                            //console.log(`${p.name} ganhou ${pontosGanhos} pontos. Total agora: ${p.score}`);
                            feedbackDetalhado += `${p.name} GANHOU ${pontosGanhos} PONTOS!<br>`; // Adiciona ao feedback
                        }
                    });

                    // A UI de ranking será atualizada pelo updateGameUI() chamado após o efeito.
                    if (message) { // Usa a mensagem genérica do JSON como título ou parte da mensagem
                        // Se houver feedbackDetalhado, usa-o. Senão, usa a mensagem padrão.
                        const finalMessage = feedbackDetalhado || message;
                        ui.showSpecialActionModal("DISTRIBUIÇÃO DE PONTOS!", finalMessage, [], () => {});
                    }
                    break;
                // Adicione outros case para 'effectType' que você definir em acoes_especiais.json
                default:
                    //console.warn(`Tipo de efeito desconhecido ou não implementado: ${actionData.effectType}`);
            }
        };
    },

    // --- CONFIGURAÇÃO E GERAÇÃO DO JOGO ---
    async setupGame(playerNames, numCasas, configCasasEspeciais, configCasasPerguntas) {
        //console.log("setupGame iniciado com:", playerNames, numCasas, configCasasEspeciais, configCasasPerguntas);
        this.totalCasas = parseInt(numCasas, 10);

        // 1. Criar os objetos Player
        let tempPlayers = playerNames.map(name => new Player(name));
        playerIdCounter = 0; // Resetar o contador de ID de jogador para consistência se o jogo for reiniciado

        // 2. EMBARALHAR A ORDEM DOS JOGADORES
        // Algoritmo de Fisher-Yates para embaralhar o array tempPlayers
        for (let i = tempPlayers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tempPlayers[i], tempPlayers[j]] = [tempPlayers[j], tempPlayers[i]];
        }
        this.players = tempPlayers; // Atribuir o array embaralhado a this.players
        //console.log("Ordem dos jogadores após embaralhar:", this.players.map(p => p.name));


        // 3. Carregar dados do jogo (perguntas e ações especiais)
        if (!allQuestions || allQuestions.length === 0) {
            alert("Erro: As perguntas não foram carregadas. O jogo não pode iniciar.");
            return;
        }
        this.gameQuestions = [...allQuestions];
        this.usedQuestionIds = [];

        if (this.SPECIAL_ACTIONS.length === 0) { // Ou this.allSpecialActions.length === 0 se você usa allSpecialActions para popular SPECIAL_ACTIONS
            await this.loadSpecialActions();
            if (this.SPECIAL_ACTIONS.length === 0) {
                alert("Erro crítico: Ações especiais não puderam ser carregadas.");
                return;
            }
        }

        // 4. Gerar o tabuleiro
        this.generateBoard(configCasasEspeciais, configCasasPerguntas);

        // 5. Definir o jogador inicial e atualizar UI
        this.currentPlayerIndex = 0; // O primeiro jogador do array embaralhado começa

        ui.drawBoard(this.boardData, this.totalCasas);
        this.players.forEach(p => ui.updatePlayerPawn(p, -1)); // -1 como oldPosition inicial
        this.updateGameUI(); // Atualiza ranking e info do jogador (agora o primeiro da ordem aleatória)

        const btnLancarDado = document.getElementById('btn-lancar-dado');
        if (btnLancarDado) btnLancarDado.disabled = false;

        //console.log("Jogo configurado e pronto. Jogador inicial:", this.getCurrentPlayer().name);
        ui.switchScreen('tela-jogo');
    },

    generateBoard(configCasasEspeciais, configCasasPerguntas) {
        ////console.log("------------------------------------");
        ////console.log("CHAMANDO generateBoard() com configs:", configCasasEspeciais, configCasasPerguntas);
        this.boardData = [];
        const numCasasJogaveis = this.totalCasas; // Casas numeradas de 1 a totalCasas

        let numCasasEspeciaisTotal;
        if (numCasasJogaveis <= 10) {
            numCasasEspeciaisTotal = 0;
            ////console.log("Modo especial: Tabuleiro com 10 casas ou menos, zero casas especiais forçadas.");
        } else if (typeof configCasasEspeciais === 'string' && configCasasEspeciais.includes('%')) {
            const percent = parseFloat(configCasasEspeciais.replace('%', '')) / 100;
            numCasasEspeciaisTotal = Math.floor(numCasasJogaveis * percent);
        } else {
            numCasasEspeciaisTotal = parseInt(configCasasEspeciais, 10);
            if (isNaN(numCasasEspeciaisTotal) || numCasasEspeciaisTotal < 0) {
                numCasasEspeciaisTotal = Math.floor(numCasasJogaveis * 0.3); // Fallback para 30%
                ////console.log("Configuração de casas especiais inválida, usando fallback de 30%.");
            }
        }
        // Garante que não tentamos colocar mais casas especiais do que casas jogáveis
        numCasasEspeciaisTotal = Math.min(numCasasEspeciaisTotal, numCasasJogaveis);


        const fixedActionsToPlace = numCasasEspeciaisTotal > 0 ? this.SPECIAL_ACTIONS.filter(action => action.isFixed === true) : [];
        const numFixedActions = fixedActionsToPlace.length;
        const numOutrasSpecialCasas = Math.max(0, numCasasEspeciaisTotal - numFixedActions);

        ////console.log(`Total de casas jogáveis: ${numCasasJogaveis}`);
        ////console.log(`Total de casas especiais configurado: ${numCasasEspeciaisTotal}`);
        ////console.log(`Número de ações fixas para colocar: ${numFixedActions}`);
        ////console.log(`Número de 'outras' casas especiais para colocar: ${numOutrasSpecialCasas}`);

        // Inicializa boardData com null para todas as casas jogáveis
        for (let i = 0; i < numCasasJogaveis; i++) {
            this.boardData.push(null);
        }

        let placedSpecialCount = 0;
        let attempts;
        const maxAttemptsPerAction = numCasasJogaveis * 2; // Aumentado para dar mais chances

        // 1. Posicionar as Ações Fixas
        if (numFixedActions > 0) //console.log("--- Iniciando posicionamento de Ações Fixas ---");
        for (const fixedAction of fixedActionsToPlace) {
            let placedFixedThisAction = false;
            attempts = 0;
            while (!placedFixedThisAction && attempts < maxAttemptsPerAction) {
                const randomIndex = Math.floor(Math.random() * numCasasJogaveis);
                if (!this.boardData[randomIndex]) {
                    this.boardData[randomIndex] = { type: 'especial_fixa', action: fixedAction, text: fixedAction.text };
                    placedFixedThisAction = true;
                    placedSpecialCount++;
                    ////console.log(`CASA ${randomIndex + 1}: Colocada Ação Fixa -> ID: ${fixedAction.id}`);
                }
                attempts++;
            }
            if (!placedFixedThisAction) console.warn(`AVISO: Não foi possível colocar a Ação Fixa: ${fixedAction.id}`);
        }

        // 2. Posicionar as Outras Ações Especiais Aleatórias
        /*
        if (numOutrasSpecialCasas > 0) console.log("--- Iniciando posicionamento de Outras Ações Especiais ---");
        const outrasSpecialActions = this.SPECIAL_ACTIONS.filter(action => action.isFixed !== true); // Pega todas não fixas
        let outrasSpecialPlacedCount = 0;
        attempts = 0;
        const globalMaxAttemptsForOthers = numCasasJogaveis * 3;

        while (outrasSpecialPlacedCount < numOutrasSpecialCasas && attempts < globalMaxAttemptsForOthers) {
            const randomIndex = Math.floor(Math.random() * numCasasJogaveis);
            if (!this.boardData[randomIndex]) {
                if (outrasSpecialActions.length > 0) {
                    const randomAction = outrasSpecialActions[Math.floor(Math.random() * outrasSpecialActions.length)];
                    this.boardData[randomIndex] = { type: 'especial_aleatoria', action: randomAction, text: randomAction.text };
                    outrasSpecialPlacedCount++;
                    placedSpecialCount++;
                    //console.log(`CASA ${randomIndex + 1}: Colocada Outra Ação Especial -> ID: ${randomAction.id}`);
                } else {
                    //console.warn("Não há mais 'outras ações especiais' disponíveis para colocar.");
                    break;
                }
            }
            attempts++;
        }
        if (outrasSpecialPlacedCount < numOutrasSpecialCasas) {
            //console.warn(`AVISO: Colocadas ${outrasSpecialPlacedCount} de ${numOutrasSpecialCasas} 'outras' ações especiais.`);
        }
        */

        // 2. Posicionar as Outras Ações Especiais Aleatórias (agora são "Casas de Sorteio")
        if (numOutrasSpecialCasas > 0) console.log("--- Iniciando posicionamento de Casas de Sorteio (Especiais Aleatórias) ---");
        // Não precisamos mais de 'outrasSpecialActions' aqui para pré-atribuir.
        let outrasSpecialPlacedCount = 0;
        attempts = 0;
        const globalMaxAttemptsForOthers = numCasasJogaveis * 3;

        while (outrasSpecialPlacedCount < numOutrasSpecialCasas && attempts < globalMaxAttemptsForOthers) {
            const randomIndex = Math.floor(Math.random() * numCasasJogaveis);
            if (!this.boardData[randomIndex]) {
                // Apenas marcamos o tipo. A ação será sorteada depois.
                this.boardData[randomIndex] = { type: 'especial_aleatoria_sorteio', text: "SORTEIE SUA AÇÃO:" }; // Novo tipo ou apenas um texto placeholder
                outrasSpecialPlacedCount++;
                placedSpecialCount++;
                //console.log(`CASA ${randomIndex + 1}: Colocada Casa de Sorteio (Especial Aleatória)`);
            }
            attempts++;
        }
        if (outrasSpecialPlacedCount < numOutrasSpecialCasas) {
            //console.warn(`AVISO: Colocadas ${outrasSpecialPlacedCount} de ${numOutrasSpecialCasas} 'casas de sorteio'.`);
        }


        // 3. Preencher o restante com perguntas
        //console.log("--- Iniciando preenchimento com Perguntas ---");
        let casasDePerguntaColocadas = 0;
        const maxPerguntasConfiguradas = configCasasPerguntas && configCasasPerguntas !== "" ? parseInt(configCasasPerguntas, 10) : Infinity;
        // Se configCasasPerguntas for NaN ou não definido, permite preencher o resto
        const maxPerguntas = isNaN(maxPerguntasConfiguradas) ? numCasasJogaveis : maxPerguntasConfiguradas;


        if (!this.gameQuestions || this.gameQuestions.length === 0) {
            //console.warn("Não há perguntas disponíveis. Casas restantes serão neutras.");
        }
        
        let questionIndices = this.gameQuestions.length > 0 ? Array.from(Array(this.gameQuestions.length).keys()) : [];
        if (questionIndices.length > 0) {
            for (let i = questionIndices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [questionIndices[i], questionIndices[j]] = [questionIndices[j], questionIndices[i]];
            }
        }
        let questionCursor = 0;

        for (let i = 0; i < numCasasJogaveis; i++) {
            if (!this.boardData[i]) { // Se a casa ainda está vazia
                if (this.gameQuestions.length > 0 && questionIndices.length > 0 && casasDePerguntaColocadas < maxPerguntas) {
                    const questionIndexInOriginalArray = questionIndices[questionCursor % questionIndices.length];
                    const question = this.gameQuestions[questionIndexInOriginalArray];
                    if (question && question.id) {
                        this.boardData[i] = { type: 'pergunta', questionId: question.id, question: question };
                        casasDePerguntaColocadas++;
                        questionCursor++; // Avança para a próxima pergunta única da lista embaralhada
                    } else {
                        //console.warn(`Problema ao obter pergunta válida para casa ${i+1}. Será neutra.`);
                        this.boardData[i] = { type: 'neutra', text: "Casa Neutra (erro pergunta)" };
                    }
                } else {
                    // Se acabaram as perguntas, ou limite atingido, ou não há perguntas
                    this.boardData[i] = { type: 'neutra', text: "Casa Neutra" };
                    // //console.log(`CASA ${i + 1}: Colocada Casa Neutra (sem mais perguntas/limite).`);
                }
            }
        }
        //console.log(`Total de ${casasDePerguntaColocadas} casas de pergunta colocadas.`);
        //console.log("--- Resumo Final do Tabuleiro (boardData) ---");
        this.boardData.forEach((casa, index) => {
            if (casa) {
                let logMessage = `Casa ${index + 1} (boardData[${index}]) (${casa.type}): `;
                if (casa.type.startsWith('especial')) {
                    // Adicionar verificação se casa.action existe
                    if (casa.action && casa.action.id) { // <<<<<<< CORREÇÃO AQUI
                        logMessage += `Ação ID: ${casa.action.id}`;
                    } else if (casa.type === 'especial_aleatoria_sorteio') {
                        logMessage += `(Ação a ser sorteada)`;
                    } else {
                        logMessage += `(Ação não definida ou tipo especial inesperado)`;
                    }
                } else if (casa.type === 'pergunta') {
                    logMessage += `Pergunta ID: ${casa.questionId}`;
                } else {
                    logMessage += casa.text;
                }
                //console.log(logMessage); // Descomente para ver o log
            } else {
                //console.error(`ERRO Inesperado: Casa ${index + 1} (boardData[${index}]) está null!`);
            }
        });
        //console.log(`Tamanho final do boardData: ${this.boardData.length} (deveria ser ${this.totalCasas})`);
        //console.log("------------------------------------");
    },

    // --- LÓGICA DE TURNO E JOGO ---
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    },

    clearRollDiceTimer() {
        if (this.rollDiceTimer) {
            clearTimeout(this.rollDiceTimer);
            this.rollDiceTimer = null;
            //console.log("Timer de lançamento de dado limpo.");
        }
        const timerDisplay = document.getElementById('roll-dice-timer-display');
        if (timerDisplay) timerDisplay.textContent = ''; // Limpa o display do timer
    },


    startRollDiceTimer() {
        this.clearRollDiceTimer(); // Limpa qualquer timer anterior
        const player = this.getCurrentPlayer();
        if (player.isFinished) return; // Não inicia timer para jogador finalizado

        //console.log(`Iniciando timer de ${this.ROLL_DICE_TIMEOUT_DURATION / 1000}s para ${player.name} lançar o dado.`);

        let timeLeft = this.ROLL_DICE_TIMEOUT_DURATION / 1000;
        const timerDisplay = document.getElementById('roll-dice-timer-display'); // Elemento opcional na UI

        if (timerDisplay) timerDisplay.textContent = `TEMPO RESTANTE: ${timeLeft}s`;

        // Atualiza display a cada segundo (opcional)
        const displayInterval = setInterval(() => {
            if (!this.rollDiceTimer) { // Se o timer principal foi cancelado
                clearInterval(displayInterval);
                if (timerDisplay) timerDisplay.textContent = '';
                return;
            }
            timeLeft--;
            if (timerDisplay) {
                timerDisplay.textContent = timeLeft > 0 ? `TEMPO RESTANTE: ${timeLeft}s` : "TEMPO ESGOTADO!";
            }
            if (timeLeft <= 0) clearInterval(displayInterval);
        }, 1000);


            this.rollDiceTimer = setTimeout(() => {
                //console.log(`Tempo ESGOTADO para ${player.name} lançar o dado.`);
                clearInterval(displayInterval); // Para o timer do display
                if (timerDisplay) timerDisplay.textContent = "TEMPO ESGOTADO!";

                const pontosPerdidos = Math.floor(Math.random() * 3) + 1; // Perde 1-3 pontos
                player.losePoints(pontosPerdidos);
                this.updateGameUI(); // Atualiza pontuação

                ui.showSpecialActionModal(
                    "TEMPO ESGOTADO!",
                    `${player.name} NÃO JOGOU A TEMPO E PERDEU ${pontosPerdidos} PONTO(S). PASSANDO A VEZ PARA O PRÓXIMO JOGADOR...`,
                                          [],
                                          () => {
                                              this.checkGameOverOrNextTurn();
                                          }
                );
                document.getElementById('btn-lancar-dado').disabled = true; // Garante que o botão seja desabilitado
            }, this.ROLL_DICE_TIMEOUT_DURATION);
    },


    rollDice() {
        // ... (código de rollDice como estava, chamando processMove)
        this.clearRollDiceTimer(); // Jogador clicou, limpa o timer
        const player = this.getCurrentPlayer();
        if (!player || player.isFinished) {
            this.nextTurn();
            return;
        }
        const btnLancarDado = document.getElementById('btn-lancar-dado');
        btnLancarDado.disabled = true;
        const roll = Math.floor(Math.random() * 6) + 1;
        if (typeof playSound === 'function') playSound('dice_roll');
        if (typeof animations !== 'undefined' && typeof animations.animateDiceRoll === 'function') {
            animations.animateDiceRoll(ui, roll, () => { this.processMove(player, roll); });
        } else {
            ui.showDiceResult(roll);
            setTimeout(() => { this.processMove(player, roll); }, 500);
        }
    },

    processMove(player, steps) {
        // ... (código de processMove como estava, chamando finalizeMoveActions)
        const oldPosition = player.position;
        if (typeof animations !== 'undefined' && typeof animations.animatePlayerMove === 'function') {
            animations.animatePlayerMove(player, steps, this.totalCasas, this, ui)
            .then(() => { this.finalizeMoveActions(player); });
        } else {
            player.moveTo(oldPosition + steps, this.totalCasas);
            ui.updatePlayerPawn(player, oldPosition);
            this.finalizeMoveActions(player); // Chamada direta sem updateGameUI aqui, pois finalizeMoveActions já faz
        }
    },

    finalizeMoveActions(player) {
        this.updateGameUI(); // Atualiza ranking e info do jogador atual (que acabou de jogar)
        this.handleSquareLanding(player); // Processa a casa onde o jogador parou
    },

    handleSquareLanding(player) {
         this.clearRollDiceTimer(); // Limpa o timer se o jogador caiu numa casa que abre modal
        // ... (código de handleSquareLanding como estava na última versão funcional)
        if (player.position === 0 || player.isFinished) {
            //console.log(`handleSquareLanding: Jogador ${player.name} na posição ${player.position}, isFinished: ${player.isFinished}. Próximo turno ou fim de jogo.`);
            if (player.isFinished && !this.gameOverManuallyTriggered && this.players.every(p => p.isFinished)) {
                 this.endGame();
            } else {
                 this.checkGameOverOrNextTurn();
            }
            return;
        }
        const casaDataArrayIndex = player.position - 1;
        const casaData = this.boardData[casaDataArrayIndex];
        //console.log(`handleSquareLanding: Jogador ${player.name} na casa numerada ${player.position}. Dados da casa (boardData[${casaDataArrayIndex}]):`, JSON.parse(JSON.stringify(casaData || {})));

        if (!casaData) {
            //console.warn(`Dados da casa ${player.position} não encontrados! Tratando como neutra.`);
            this.checkGameOverOrNextTurn();
            return;
        }

        if (casaData.type === 'pergunta') {
            //console.log(`Casa ${player.position} é uma PERGUNTA.`);
            const question = casaData.question;
            if (question) {
                ui.showQuestionModal(question, (isCorrect) => {
                    let feedbackTitle = "", feedbackMessage = "";
                    if (isCorrect) {
                        player.addPoints(question.pontos);
                        feedbackTitle = "RESPOSTA CORRETA!";
                        feedbackMessage = `${player.name} GANHOU ${question.pontos} PONTOS!`;
                    } else {
                        const pontosPerdidos = Math.floor(Math.random() * 3) + 1;
                        player.losePoints(pontosPerdidos);
                        feedbackTitle = "RESPOSTA INCORRETA!";
                        feedbackMessage = `${player.name} ERROU E PERDEU ${pontosPerdidos} PONTO(S).`;
                    }
                    this.updateGameUI();
                    ui.showSpecialActionModal(feedbackTitle, feedbackMessage, [], () => {
                        this.checkGameOverOrNextTurn();
                    });
                });
            } else {
                //console.warn("Pergunta não encontrada para a casa tipo 'pergunta'!");
                this.checkGameOverOrNextTurn();
            }
        } else if (casaData.type === 'especial_fixa') { // Trata fixas primeiro
            //console.log(`Casa ${player.position} é ESPECIAL FIXA. Ação: ${casaData.action ? casaData.action.id : 'N/A'}`);
            const action = casaData.action;
            if (!action || typeof action.effect !== 'function') { /*...*/ return; }
            const otherPlayers = this.players.filter(p => p.id !== player.id && !p.isFinished);
            const needsSelection = action.needsPlayerSelection === true && otherPlayers.length > 0;
            ui.showSpecialActionModal(
                "CASA ESPECIAL!", action.text,
                needsSelection ? otherPlayers : [],
                (selectedPlayerId) => {
                    action.effect(player, this, selectedPlayerId);
                    this.updateGameUI();
                    this.checkGameOverOrNextTurn();
                }
            );
        } else if (casaData.type === 'especial_aleatoria_sorteio') { // Depois as de sorteio
            //console.log(`Casa ${player.position} é uma CASA DE SORTEIO.`);
            ui.showDrawActionModal(() => {
                const nonFixedActions = this.SPECIAL_ACTIONS.filter(act => act.isFixed !== true);
                if (nonFixedActions.length > 0) {
                    const randomIndex = Math.floor(Math.random() * nonFixedActions.length);
                    const sorteoAction = nonFixedActions[randomIndex];
                    //console.log(`Ação sorteada: ${sorteoAction.id} - ${sorteoAction.text}`);
                    const otherPlayers = this.players.filter(p => p.id !== player.id && !p.isFinished);
                    const needsSelection = sorteoAction.needsPlayerSelection === true && otherPlayers.length > 0;
                    ui.showSpecialActionModal(
                        "AÇÃO REVELADA!", sorteoAction.text,
                        needsSelection ? otherPlayers : [],
                        (selectedPlayerId) => {
                            sorteoAction.effect(player, this, selectedPlayerId);
                            this.updateGameUI();
                            this.checkGameOverOrNextTurn();
                        }
                    );
                } else {
                    //console.warn("Não há ações não fixas para sortear.");
                    ui.showSpecialActionModal("Sem Sorteio", "Nenhuma ação especial disponível.", [], () => {
                        this.checkGameOverOrNextTurn();
                    });
                }
            });
        } else if (casaData.type === 'neutra') { // Depois as neutras
            //console.log(`Casa ${player.position} é NEUTRA. Próximo turno.`);
            this.checkGameOverOrNextTurn();
        } else { // Fallback para tipos desconhecidos ou outros tipos de 'especial' que não são 'fixa' nem 'sorteio'
            //console.warn(`Tipo de casa desconhecido ou não tratado especificamente: '${casaData.type}' na casa ${player.position}. Próximo turno.`);
            // Se você tiver um tipo 'especial_aleatoria' que NÃO é de sorteio, ele cairia aqui.
            // Se todas as 'especial_aleatoria' agora são 'especial_aleatoria_sorteio', este else pode ser só para erros.
            this.checkGameOverOrNextTurn();
        }
    },

    nextTurn() {
        if (this.gameOverManuallyTriggered) {
            //console.log("nextTurn: Jogo já encerrado.");
            this.clearRollDiceTimer(); // Limpa timer mesmo se jogo acabou
            return;
        }
        this.clearRollDiceTimer(); // Limpa timer do jogador anterior

        if (this.players.every(p => p.isFinished)) {
            if (!this.gameOverManuallyTriggered) this.endGame();
            return;
        }

        let nextPlayerIndex = this.currentPlayerIndex;
        let attempts = 0;
        let foundNextActivePlayer = false;

        do {
            nextPlayerIndex = (nextPlayerIndex + 1) % this.players.length;
            attempts++;

            if (!this.players[nextPlayerIndex].isFinished && !this.players[nextPlayerIndex].skipNextTurn) {
                foundNextActivePlayer = true;
                break;
            }
            // Se o jogador vai pular o turno, reseta a flag para a próxima rodada dele
            if (this.players[nextPlayerIndex].skipNextTurn) {
                //console.log(`${this.players[nextPlayerIndex].name} ia pular o turno, resetando flag.`);
                // Mostra um modal informando que o jogador pulou o turno
                const skippedPlayer = this.players[nextPlayerIndex];
                // Este modal pode ser problemático se nextTurn for chamado em sequência rápida.
                // Melhor mostrar o modal antes de chamar nextTurn quando skip é detectado.
                // Vamos simplificar por agora: resetar a flag e continuar procurando.
                skippedPlayer.skipNextTurn = false;
            }

        } while (attempts <= this.players.length * 2); // *2 para garantir que todos sejam checados mesmo com skips

        this.currentPlayerIndex = nextPlayerIndex;
        const nextPlayer = this.getCurrentPlayer();

        if (!foundNextActivePlayer && this.players.every(p => p.isFinished || p.skipNextTurn)) {
            // Se não encontrou ninguém e todos os restantes ou finalizaram ou pulariam
            // Isso pode levar a um impasse se todos pularem. Precisamos de uma lógica melhor aqui.
            // Por agora, se todos os não finalizados estão pulando, pode ser que o jogo trave.
            // Uma solução é, após uma rodada de skips, forçar o próximo.
            // Mas a lógica acima de resetar skipNextTurn já tenta mitigar isso.
            // Se todos os jogadores ativos tiverem skipNextTurn = true, o jogo pode ficar preso.
            // Vamos assumir que isso não acontece frequentemente.
            // Se, após todos os skips, o jogador encontrado ainda está finalizado, então todos finalizaram.
            if (nextPlayer.isFinished && this.players.every(p => p.isFinished) && !this.gameOverManuallyTriggered) {
                this.endGame();
                return;
            }
        }

        // Se o jogador encontrado após o loop ainda for pular (improvável com o reset acima, mas segurança)
        // OU se ele estiver finalizado (o que significa que todos os jogadores elegíveis finalizaram)
        if (nextPlayer.skipNextTurn || nextPlayer.isFinished) {
            if (nextPlayer.skipNextTurn) { // Se o jogador encontrado ainda for pular
                //console.log(`${nextPlayer.name} está pulando este turno.`);
                ui.showSpecialActionModal("JOGADA PULADA!", `${nextPlayer.name} PERDEU A VEZ NESTA RODADA!`, [], () => {
                    nextPlayer.skipNextTurn = false; // Reseta a flag
                    this.checkGameOverOrNextTurn(); // Tenta passar para o próximo
                });
                return; // Impede o timer de iniciar para este jogador
            }
            // Se chegou aqui e nextPlayer.isFinished, a lógica de 'every' no início ou o loop deveriam ter pego.
            // Mas por segurança:
            if (this.players.every(p => p.isFinished) && !this.gameOverManuallyTriggered) {
                this.endGame();
            }
            return;
        }



        this.updateGameUI(); // Atualiza para o novo jogador

        const btnLancarDado = document.getElementById('btn-lancar-dado');
        if (btnLancarDado) {
            btnLancarDado.disabled = nextPlayer.isFinished;
        }

        if (!nextPlayer.isFinished && !nextPlayer.skipNextTurn) { // Não inicia timer se for pular turno
            this.startRollDiceTimer(); // Inicia timer para o novo jogador
        } else if (nextPlayer.skipNextTurn) {
            //console.log(`${nextPlayer.name} vai pular este turno.`);
            // Lógica para lidar com skipNextTurn (ver item 3)
        }
    },


    gameOverManuallyTriggered: false,

    checkGameOverOrNextTurn() {
        // ... (código de checkGameOverOrNextTurn como estava na última versão funcional)
        if (this.gameOverManuallyTriggered) return;
        if (this.players.every(p => p.isFinished)) {
            if (!this.gameOverManuallyTriggered) this.endGame();
        } else {
            this.nextTurn();
        }
    },

    updateGameUI() {
        // ... (código de updateGameUI como estava na última versão funcional)
        const currentPlayerForInfo = this.getCurrentPlayer();
        if (currentPlayerForInfo) {
            ui.updateRanking(this.players, currentPlayerForInfo.id);
            ui.updateCurrentPlayerInfo(currentPlayerForInfo);
        } else {
            ui.updateRanking(this.players, null);
        }
    },

    endGame() {
        // ... (código de endGame como estava na última versão funcional)
        if (this.gameOverManuallyTriggered) return;
        this.gameOverManuallyTriggered = true;
        //console.log("FIM DE JOGO!");
        const btnLancarDado = document.getElementById('btn-lancar-dado');
        if (btnLancarDado) btnLancarDado.disabled = true;
        ui.displayPodium(this.players);
        ui.switchScreen('tela-fim-jogo');
    },

    // NOVA FUNÇÃO PARA ENCERRAMENTO MANUAL
    endGameManually() {
        if (this.gameOverManuallyTriggered) {
            console.log("Jogo já está sendo encerrado ou já terminou.");
            return;
        }
        this.gameOverManuallyTriggered = true; // Marca que o jogo foi encerrado

        console.log("JOGO ENCERRADO MANUALMENTE!");

        // Desabilitar interações principais do jogo
        const btnLancarDado = document.getElementById('btn-lancar-dado');
        if (btnLancarDado) btnLancarDado.disabled = true;

        // Não é necessário marcar todos os jogadores como 'isFinished' aqui,
        // pois o ranking será baseado nos pontos atuais.
        // A função ui.displayPodium usará os scores atuais.

        ui.displayPodium(this.players); // Mostra o pódio com os scores atuais
        ui.switchScreen('tela-fim-jogo'); // Muda para a tela de fim de jogo
    },

    resetGame() {
        // ... (código de resetGame como estava na última versão funcional)
        this.players = [];
        this.boardData = [];
        this.currentPlayerIndex = 0;
        this.gameQuestions = [];
        this.usedQuestionIds = [];
        playerIdCounter = 0;
        this.gameOverManuallyTriggered = false;
        if (ui.tabuleiroContainer) ui.tabuleiroContainer.innerHTML = '';
        if (ui.rankingUl) ui.rankingUl.innerHTML = '';
        if (ui.podiumElements && ui.removeConfetti) { // Verifica se removeConfetti existe
            ui.removeConfetti();
            // ... (reset do pódio visual)
        }
        const btnEncerrarManual = document.getElementById('btn-encerrar-jogo-manual');
        if (btnEncerrarManual) btnEncerrarManual.style.display = 'inline-block'; // Ou 'block'
    }
};
