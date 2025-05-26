// js/gameLogic.js

const game = {
    players: [],
    boardData: [],
    totalCasas: 30,
    currentPlayerIndex: 0,
    gameQuestions: [],
    usedQuestionIdsThisGame: new Set(),
    allSpecialActions: [],
    SPECIAL_ACTIONS: [],
    rollDiceTimer: null,
    displayIntervalId: null,
    rollDiceTimeoutDurationMs: 10000,
    gameOverManuallyTriggered: false,
    configPermitePontuacaoNegativa: true,

    async loadSpecialActions() {
        try {
            const timestamp = new Date().getTime(); // Cache busting
            const response = await fetch(`data/acoes_especiais.json?v=${timestamp}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} ao buscar acoes_especiais.json`);
            }
            this.allSpecialActions = await response.json();

            if (!Array.isArray(this.allSpecialActions)) {
                console.error("Erro: O arquivo acoes_especiais.json não contém um array JSON válido.");
                this.SPECIAL_ACTIONS = [];
                return [];
            }
            this.SPECIAL_ACTIONS = this.allSpecialActions.map(actionData => ({
                ...actionData,
                effect: this.getEffectFunction(actionData)
            }));
            return this.SPECIAL_ACTIONS;
        } catch (error) {
            console.error("Falha ao carregar/processar ações especiais:", error);
            this.SPECIAL_ACTIONS = [];
            throw error;
        }
    },

    getEffectFunction(actionData) {
        return (player, gameInstance, targetPlayerId) => {
            const targetPlayer = targetPlayerId ? gameInstance.players.find(p => String(p.id) === String(targetPlayerId)) : null;
            let message = actionData.feedback || actionData.text; // Usar actionData.text como fallback
            let value;
            let oldPos;
            const proceedCallback = () => gameInstance.checkGameOverOrNextTurn();

            switch (actionData.effectType) {
                case "moveRelative":
                    oldPos = player.position;
                    player.moveTo(player.position + actionData.value, gameInstance.totalCasas);
                    ui.updatePlayerPawn(player, oldPos);
                    if (actionData.feedback) { // O feedback original deve ter os placeholders
                        message = actionData.feedback.replace("%VALUE%", Math.abs(actionData.value))
                        .replace("%DIRECTION%", actionData.value > 0 ? "avançou" : "voltou");
                    } else { // Fallback se não houver feedback no JSON
                        message = `${player.name} ${actionData.value > 0 ? "avançou" : "voltou"} ${Math.abs(actionData.value)} casa(s).`;
                    }
                    ui.showSpecialActionModal("Movimento Especial!", message, [], proceedCallback, true);
                    break;
                case "returnToStart":
                    oldPos = player.position;
                    player.returnToStart();
                    ui.updatePlayerPawn(player, oldPos);
                    ui.showSpecialActionModal("Retorno ao Início!", message, [], proceedCallback, true);
                    break;
                case "resetPoints":
                    player.resetPoints();
                    ui.showSpecialActionModal("Pontos Resetados!", message, [], proceedCallback, true);
                    break;
                case "swapPosition":
                    if (targetPlayer && targetPlayer.id !== player.id) {
                        const tempPosPlayer = player.position;
                        const tempPosTarget = targetPlayer.position;
                        player.moveTo(tempPosTarget, gameInstance.totalCasas);
                        targetPlayer.moveTo(tempPosPlayer, gameInstance.totalCasas);
                        ui.updatePlayerPawn(player, tempPosPlayer);
                        ui.updatePlayerPawn(targetPlayer, tempPosTarget);
                        if (actionData.feedback) {
                            message = actionData.feedback.replace("%TARGET_NAME%", targetPlayer.name);
                        } else {
                            message = `Você trocou de posição com ${targetPlayer.name}.`;
                        }
                        ui.showSpecialActionModal("Troca de Posição!", message, [], proceedCallback, true);
                    } else {
                        ui.showSpecialActionModal("Ops!", "Não foi possível trocar de posição (alvo inválido ou é você mesmo).", [], proceedCallback, true);
                    }
                    break;
                case "moveTargetRelative":
                    if (targetPlayer) {
                        value = Math.floor(Math.random() * (actionData.max - actionData.min + 1)) + actionData.min;
                        const oldPosTargetMove = targetPlayer.position;
                        targetPlayer.moveTo(targetPlayer.position + value, gameInstance.totalCasas);
                        ui.updatePlayerPawn(targetPlayer, oldPosTargetMove);
                        if (actionData.feedback) { // O feedback original deve ter os placeholders
                            message = actionData.feedback.replace("%TARGET_NAME%", targetPlayer.name)
                            .replace("%VALUE%", Math.abs(value))
                            .replace("%DIRECTION%", value > 0 ? "avançar" : "voltar");
                        } else {
                            message = `${targetPlayer.name} ${value > 0 ? "avançou" : "voltou"} ${Math.abs(value)} casa(s).`;
                        }
                        ui.showSpecialActionModal("Ação Aplicada!", message, [], proceedCallback, true);
                    } else {
                        ui.showSpecialActionModal("Ops!", "Alvo inválido para mover.", [], proceedCallback, true);
                    }
                    break;
                case "swapScores":
                    if (targetPlayer && targetPlayer.id !== player.id) {
                        const tempScorePlayer = player.score;
                        player.score = targetPlayer.score;
                        targetPlayer.score = tempScorePlayer;
                        if (actionData.feedback) { // O feedback original deve ter os placeholders
                            message = actionData.feedback.replace(/%PLAYER_NAME%/g, player.name)
                            .replace(/%PLAYER_SCORE%/g, player.score)
                            .replace(/%TARGET_NAME%/g, targetPlayer.name)
                            .replace(/%TARGET_SCORE%/g, targetPlayer.score);
                        } else {
                            message = `Você trocou de pontos com ${targetPlayer.name}. Agora você tem ${player.score} e ${targetPlayer.name} tem ${targetPlayer.score}.`;
                        }
                        ui.showSpecialActionModal("Pontuações Trocadas!", message, [], proceedCallback, true);
                    } else {
                        ui.showSpecialActionModal("Ops!", "Não pode trocar pontos consigo mesmo ou alvo inválido.", [], proceedCallback, true);
                    }
                    break;
                case "swapScoresRandom":
                    const otherPlayersRandom = gameInstance.players.filter(p => p.id !== player.id && !p.isFinished);
                    if (otherPlayersRandom.length > 0) {
                        const randomTarget = otherPlayersRandom[Math.floor(Math.random() * otherPlayersRandom.length)];
                        const tempScorePlayer = player.score;
                        player.score = randomTarget.score;
                        randomTarget.score = tempScorePlayer;
                        if (actionData.feedback) { // O feedback original deve ter os placeholders
                            message = actionData.feedback.replace(/%PLAYER_NAME%/g, player.name)
                            .replace(/%PLAYER_SCORE%/g, player.score)
                            .replace(/%TARGET_NAME%/g, randomTarget.name)
                            .replace(/%TARGET_SCORE%/g, randomTarget.score);
                        } else {
                            message = `Você trocou de pontos aleatoriamente com ${randomTarget.name}. Agora você tem ${player.score} e ${randomTarget.name} tem ${randomTarget.score}.`;
                        }
                        ui.showSpecialActionModal("Troca Surpresa!", message, [], proceedCallback, true);
                    } else {
                        ui.showSpecialActionModal("Sem Sorte!", "Não há outros jogadores para a troca surpresa.", [], proceedCallback, true);
                    }
                    break;
                case "moveAllOthersRelative":
                    value = Math.floor(Math.random() * (actionData.max - actionData.min + 1)) + actionData.min;
                    let actualValueMoved = Math.abs(value);
                    let directionText = value > 0 ? "avançaram" : "voltaram";
                    let details = "";
                    gameInstance.players.forEach(p => {
                        if (p.id !== player.id && !p.isFinished) {
                            const oldPPos = p.position;
                            p.moveTo(p.position + value, gameInstance.totalCasas);
                            ui.updatePlayerPawn(p, oldPPos);
                            details += `${p.name} ${directionText} ${actualValueMoved} casa(s).<br>`;
                        }
                    });
                    if (actionData.feedback) {
                        message = actionData.feedback.replace("%VALUE%", actualValueMoved)
                        .replace("%DIRECTION%", directionText.slice(0,-2)); // "avançar" ou "voltar"
                        if(details) message += `<br><br>Detalhes:<br>${details}`;
                    } else {
                        message = `Todos os outros jogadores ${directionText} ${actualValueMoved} casa(s)!`  + (details ? `<br><br>Detalhes:<br>${details}` : "");
                    }
                    ui.showSpecialActionModal("Efeito Global!", message, [], proceedCallback, true);
                    break;
                case "resetPointsAndReturnToStart":
                    oldPos = player.position;
                    player.resetPoints();
                    player.returnToStart();
                    ui.updatePlayerPawn(player, oldPos);
                    ui.showSpecialActionModal("Grande Revés!", message, [], proceedCallback, true);
                    break;
                case "moveToEnd":
                    oldPos = player.position;
                    player.moveTo(gameInstance.totalCasas + 1, gameInstance.totalCasas);
                    ui.updatePlayerPawn(player, oldPos);
                    ui.showSpecialActionModal("Salto para o Fim!", message, [], proceedCallback, true);
                    break;
                case "addPoints":
                    player.addPoints(actionData.value);
                    if (actionData.feedback) {
                        message = actionData.feedback.replace("%VALUE%", actionData.value);
                    } else {
                        message = `Você ganhou ${actionData.value} pontos!`;
                    }
                    ui.showSpecialActionModal("Pontos Extras!", message, [], proceedCallback, true);
                    break;
                case "losePoints":
                    player.losePoints(actionData.value);
                    if (actionData.feedback) {
                        message = actionData.feedback.replace("%VALUE%", actionData.value);
                    } else {
                        message = `Você perdeu ${actionData.value} pontos!`;
                    }
                    ui.showSpecialActionModal("Perda de Pontos!", message, [], proceedCallback, true);
                    break;
                case "allOthersReturnToStart":
                    gameInstance.players.forEach(p => {
                        if (p.id !== player.id && !p.isFinished) {
                            const oldPositionOther = p.position;
                            p.returnToStart();
                            ui.updatePlayerPawn(p, oldPositionOther);
                        }
                    });
                    ui.showSpecialActionModal("Reviravolta no Jogo!", message, [], proceedCallback, true);
                    break;
                case "allOthersMoveToEnd":
                    gameInstance.players.forEach(p => {
                        if (p.id !== player.id && !p.isFinished) {
                            const oldPositionOther = p.position;
                            p.moveTo(gameInstance.totalCasas + 1, gameInstance.totalCasas);
                            ui.updatePlayerPawn(p, oldPositionOther);
                        }
                    });
                    ui.showSpecialActionModal("Surpresa Final!", message, [], proceedCallback, true);
                    break;
                case "skipTurn":
                    player.skipNextTurn = true;
                    ui.showSpecialActionModal("Azar!", message, [], proceedCallback, true);
                    break;
                case "allPlayersIncludingActiveToEnd":
                    gameInstance.players.forEach(p => {
                        if (!p.isFinished) {
                            const oldPositionP = p.position;
                            p.moveTo(gameInstance.totalCasas + 1, gameInstance.totalCasas);
                            ui.updatePlayerPawn(p, oldPositionP);
                        }
                    });
                    ui.showSpecialActionModal("Fim Abrupto!", message, [], proceedCallback, true);
                    break;
                case "allPlayersIncludingActiveToStart":
                    gameInstance.players.forEach(p => {
                        const oldPositionP = p.position;
                        p.returnToStart();
                        ui.updatePlayerPawn(p, oldPositionP);
                    });
                    ui.showSpecialActionModal("Recomeço Geral!", message, [], proceedCallback, true);
                    break;
                case "allPlayersIncludingActiveResetPoints":
                    gameInstance.players.forEach(p => p.resetPoints());
                    ui.showSpecialActionModal("Pontuação Zerada!", message, [], proceedCallback, true);
                    break;
                case "allOthersGainRandomPoints":
                    const minPts = actionData.minPoints || 5;
                    const maxPts = actionData.maxPoints || 25;
                    let feedbackDetalhado = "";
                    gameInstance.players.forEach(p => {
                        if (p.id !== player.id && !p.isFinished) {
                            const pontosGanhos = Math.floor(Math.random() * (maxPts - minPts + 1)) + minPts;
                            p.addPoints(pontosGanhos);
                            feedbackDetalhado += `${p.name} ganhou ${pontosGanhos} pontos!<br>`;
                        }
                    });
                    // Usa a mensagem genérica do JSON como título ou parte da mensagem
                    // e adiciona os detalhes se houver.
                    if (actionData.feedback) {
                        message = actionData.feedback + (feedbackDetalhado ? `<br><br>Detalhes:<br>${feedbackDetalhado}` : "");
                    } else {
                        message = "Distribuição de Riqueza! Outros jogadores foram presenteados com pontos extras!" + (feedbackDetalhado ? `<br><br>Detalhes:<br>${feedbackDetalhado}` : "");
                    }
                    ui.showSpecialActionModal("Distribuição de Pontos!", message, [], proceedCallback, true);
                    break;
                default:
                    console.warn(`Tipo de efeito desconhecido: ${actionData.effectType}`);
                    ui.showSpecialActionModal("Efeito Inesperado", `A ação "${actionData.text}" teve um efeito não reconhecido. O jogo continua.`, [], proceedCallback, true);
            }
            // O proceedCallback é chamado pelo ui.showSpecialActionModal após o usuário fechar o modal
        };
    },

    async setupGame(playerNamesArray, numTotalCasas, configEspeciais, configPerguntas,
                    categoriasFiltro, dificuldadeFiltro, rawQuestions,
                    permitePontuacaoNegativaConfig, tempoLancamentoDadoSeg,
                    anosTurmasFiltro, bimestresFiltro) {
        this.totalCasas = parseInt(numTotalCasas, 10);
        this.configPermitePontuacaoNegativa = permitePontuacaoNegativaConfig;
        this.rollDiceTimeoutDurationMs = tempoLancamentoDadoSeg * 1000;
        playerIdCounter = 0;

        this.players = playerNamesArray.map(name => new Player(name, this.configPermitePontuacaoNegativa));
        for (let i = this.players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.players[i], this.players[j]] = [this.players[j], this.players[i]];
        }

        if (!rawQuestions || rawQuestions.length === 0) {
            throw new Error("Perguntas brutas não fornecidas ou vazias para setupGame.");
        }

        let perguntasFiltradas = [...rawQuestions];
        // console.log("[GameLogic] Total de perguntas ANTES de todos os filtros:", perguntasFiltradas.length);
        // console.log("[GameLogic] Filtro de Bimestre Recebido em setupGame:", bimestresFiltro);

        if (categoriasFiltro && Array.isArray(categoriasFiltro) && !categoriasFiltro.includes('todos_categoria') && categoriasFiltro.length > 0) {
            perguntasFiltradas = perguntasFiltradas.filter(q => q.categoria && categoriasFiltro.includes(q.categoria));
        }
        // console.log("[GameLogic] Perguntas após filtro de Categoria:", perguntasFiltradas.length);

        if (dificuldadeFiltro && dificuldadeFiltro !== 'todas') {
            perguntasFiltradas = perguntasFiltradas.filter(q => q.dificuldade === dificuldadeFiltro);
        }
        // console.log("[GameLogic] Perguntas após filtro de Dificuldade:", perguntasFiltradas.length);

        if (anosTurmasFiltro && Array.isArray(anosTurmasFiltro) && !anosTurmasFiltro.includes('todos_ano-turma') && anosTurmasFiltro.length > 0) {
            perguntasFiltradas = perguntasFiltradas.filter(q => {
                if (!q.ano_turma) return false;
                const anosDaPergunta = Array.isArray(q.ano_turma) ? q.ano_turma : [q.ano_turma];
                return anosDaPergunta.some(at => anosTurmasFiltro.includes(String(at)));
            });
        }
        // console.log("[GameLogic] Perguntas após filtro de Ano/Turma:", perguntasFiltradas.length);

        if (bimestresFiltro && Array.isArray(bimestresFiltro) && !bimestresFiltro.includes('todos_bimestre') && bimestresFiltro.length > 0) {
            // console.log("[GameLogic] APLICANDO filtro de Bimestre com:", bimestresFiltro);
            const perguntasAntesDoFiltroBimestre = perguntasFiltradas.length;
            perguntasFiltradas = perguntasFiltradas.filter(q => {
                const match = q.bimestre && bimestresFiltro.includes(q.bimestre);
                return match;
            });
            // console.log(`[GameLogic] Filtro de Bimestre: ${perguntasAntesDoFiltroBimestre} -> ${perguntasFiltradas.length} perguntas.`);
        } else {
            // console.log("[GameLogic] NÃO aplicando filtro de Bimestre (ou 'todos_bimestre' selecionado).");
        }
        // console.log("[GameLogic] Perguntas APÓS filtro de Bimestre:", perguntasFiltradas.length);

        if (perguntasFiltradas.length === 0 && rawQuestions.length > 0) {
            console.warn("[GameLogic] Nenhuma pergunta corresponde a TODOS os filtros. Ativando fallback para TODAS as perguntas brutas.");
            this.gameQuestions = [...rawQuestions];
            if (this.gameQuestions.length === 0) {
                alert("Nenhuma pergunta disponível, mesmo após fallback. Verifique o arquivo de perguntas e os filtros.");
                throw new Error("Não foi possível obter perguntas válidas para o jogo.");
            }
            alert("Atenção: Nenhuma pergunta encontrada para os filtros selecionados. Usando todas as perguntas disponíveis.");
        } else {
            this.gameQuestions = perguntasFiltradas;
        }
        this.usedQuestionIdsThisGame.clear();

        if (this.SPECIAL_ACTIONS.length === 0) {
            await this.loadSpecialActions();
            if (this.SPECIAL_ACTIONS.length === 0) {
                throw new Error("Ações especiais falharam ao carregar em setupGame.");
            }
        }

        this.generateBoard(configEspeciais, configPerguntas);
        this.currentPlayerIndex = 0;
        ui.drawBoard(this.boardData, this.totalCasas);
        this.players.forEach(p => ui.updatePlayerPawn(p, -1));
        this.updateGameUI();

        const btnLancarDado = document.getElementById('btn-lancar-dado');
        if (btnLancarDado) btnLancarDado.disabled = false;

        ui.switchScreen('tela-jogo');
        console.log(`Jogo configurado com ${this.gameQuestions.length} perguntas. Filtros aplicados: Categorias=${categoriasFiltro.join(',')}, Dificuldade=${dificuldadeFiltro}, Anos/Turmas=${anosTurmasFiltro.join(',')}, Bimestres=${bimestresFiltro.join(',')}`);
                    },

                    generateBoard(configEspeciais, configPerguntas) {
                        this.boardData = [];
                        const numCasasJogaveis = this.totalCasas;

                        let numCasasEspeciaisTotal;
                        if (numCasasJogaveis <= 10) numCasasEspeciaisTotal = 0;
                        else if (typeof configEspeciais === 'string' && configEspeciais.includes('%')) {
                            numCasasEspeciaisTotal = Math.floor(numCasasJogaveis * (parseFloat(configEspeciais.replace('%', '')) / 100));
                        } else {
                            numCasasEspeciaisTotal = parseInt(configEspeciais, 10);
                            if (isNaN(numCasasEspeciaisTotal) || numCasasEspeciaisTotal < 0) numCasasEspeciaisTotal = Math.floor(numCasasJogaveis * 0.25);
                        }
                        numCasasEspeciaisTotal = Math.min(numCasasEspeciaisTotal, numCasasJogaveis - 2);

                        const fixedActions = this.SPECIAL_ACTIONS.filter(action => action.isFixed === true);
                        let numOutrasSpecialCasas = Math.max(0, numCasasEspeciaisTotal - fixedActions.length);

                        for (let i = 0; i < numCasasJogaveis; i++) this.boardData.push(null);

                        fixedActions.forEach(action => {
                            let placed = false;
                            for (let attempts = 0; attempts < numCasasJogaveis * 2 && !placed; attempts++) {
                                const randomIndex = Math.floor(Math.random() * numCasasJogaveis);
                                if (!this.boardData[randomIndex]) {
                                    this.boardData[randomIndex] = { type: 'especial_fixa', action: action, text: action.text };
                                    placed = true;
                                }
                            }
                            if (!placed) console.warn(`Não foi possível colocar a Ação Fixa: ${action.id}`);
                        });

                        let outrasSpecialPlacedCount = 0;
                        for (let attempts = 0; outrasSpecialPlacedCount < numOutrasSpecialCasas && attempts < numCasasJogaveis * 3; attempts++) {
                            const randomIndex = Math.floor(Math.random() * numCasasJogaveis);
                            if (!this.boardData[randomIndex]) {
                                this.boardData[randomIndex] = { type: 'especial_aleatoria_sorteio', text: "SORTEIE SUA AÇÃO!" };
                                outrasSpecialPlacedCount++;
                            }
                        }

                        let casasDePerguntaColocadas = 0;
                        const maxPerguntasDesejadas = configPerguntas && configPerguntas !== "" && !isNaN(parseInt(configPerguntas, 10))
                        ? parseInt(configPerguntas, 10)
                        : Infinity;
                        const maxPerguntasPossiveis = isNaN(maxPerguntasDesejadas) ? numCasasJogaveis : maxPerguntasDesejadas;

                        for (let i = 0; i < numCasasJogaveis; i++) {
                            if (!this.boardData[i]) {
                                if (this.gameQuestions.length > 0 && casasDePerguntaColocadas < maxPerguntasPossiveis) {
                                    this.boardData[i] = { type: 'pergunta', text: "PERGUNTA" };
                                    casasDePerguntaColocadas++;
                                } else {
                                    this.boardData[i] = { type: 'neutra', text: "Casa Neutra" };
                                }
                            }
                        }
                        // console.log("Tabuleiro gerado:", this.boardData);
                    },

                    getCurrentPlayer() {
                        return this.players[this.currentPlayerIndex];
                    },

                    getRandomQuestion() {
                        const availableQuestions = this.gameQuestions.filter(q => !this.usedQuestionIdsThisGame.has(q.id));

                        if (availableQuestions.length === 0) {
                            if (this.gameQuestions.length === 0) return null;
                            console.warn("Todas as perguntas disponíveis para esta partida foram usadas. Resetando e permitindo repetição.");
                            this.usedQuestionIdsThisGame.clear();
                            const randomIndex = Math.floor(Math.random() * this.gameQuestions.length);
                            const question = this.gameQuestions[randomIndex];
                            this.usedQuestionIdsThisGame.add(question.id);
                            return question;
                        }

                        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
                        const question = availableQuestions[randomIndex];
                        this.usedQuestionIdsThisGame.add(question.id);
                        return question;
                    },

                    clearRollDiceTimer() {
                        if (this.rollDiceTimer) clearTimeout(this.rollDiceTimer);
                        this.rollDiceTimer = null;
                        if (this.displayIntervalId) clearInterval(this.displayIntervalId);
                        this.displayIntervalId = null;

                        const timerBar = document.getElementById('roll-dice-timer-bar');
                        const timerBarContainer = document.querySelector('.roll-dice-timer-bar-container');
                        const timerTextDisplay = document.getElementById('roll-dice-timer-display');

                        if (timerBar) {
                            timerBar.style.width = '100%';
                            timerBar.style.backgroundColor = 'var(--cor-sucesso)';
                        }
                        if (timerBarContainer) timerBarContainer.style.visibility = 'hidden';
                        if (timerTextDisplay) {
                            timerTextDisplay.textContent = '';
                            timerTextDisplay.style.visibility = 'hidden';
                            timerTextDisplay.style.color = 'var(--cor-perigo)';
                        }
                    },

                    startRollDiceTimer() {
                        this.clearRollDiceTimer();
                        const player = this.getCurrentPlayer();
                        if (!player || player.isFinished) return;

                        let timeLeftInSeconds = this.rollDiceTimeoutDurationMs / 1000;
                        const totalTimeInSeconds = timeLeftInSeconds;

                        const timerBar = document.getElementById('roll-dice-timer-bar');
                        const timerBarContainer = document.querySelector('.roll-dice-timer-bar-container');
                        const timerTextDisplay = document.getElementById('roll-dice-timer-display');

                        if (timerBarContainer) timerBarContainer.style.visibility = 'visible';
                        if (timerBar) {
                            timerBar.style.width = '100%';
                            timerBar.style.backgroundColor = 'var(--cor-sucesso)';
                        }
                        if (timerTextDisplay) {
                            timerTextDisplay.textContent = `${timeLeftInSeconds}s`;
                            timerTextDisplay.style.visibility = 'visible';
                            timerTextDisplay.style.color = 'var(--cor-texto-secundario)';
                        }

                        this.displayIntervalId = setInterval(() => {
                            timeLeftInSeconds--;
                            if (timerTextDisplay) timerTextDisplay.textContent = `${Math.max(0, timeLeftInSeconds)}s`;

                            if (timerBar) {
                                const percentRemaining = totalTimeInSeconds > 0 ? (timeLeftInSeconds / totalTimeInSeconds) * 100 : 0;
                                timerBar.style.width = `${Math.max(0, percentRemaining)}%`;

                                if (timeLeftInSeconds <= 0) {
                                    timerBar.style.backgroundColor = 'var(--cor-perigo)';
                                    if (timerTextDisplay) timerTextDisplay.style.color = 'var(--cor-perigo)';
                                } else if (percentRemaining < 33) {
                                    timerBar.style.backgroundColor = 'var(--cor-perigo)';
                                    if (timerTextDisplay) timerTextDisplay.style.color = 'var(--cor-perigo)';
                                } else if (percentRemaining < 66) {
                                    timerBar.style.backgroundColor = 'var(--cor-aviso)';
                                    if (timerTextDisplay) timerTextDisplay.style.color = 'var(--cor-aviso)';
                                } else {
                                    timerBar.style.backgroundColor = 'var(--cor-sucesso)';
                                    if (timerTextDisplay) timerTextDisplay.style.color = 'var(--cor-texto-secundario)';
                                }
                            }

                            if (timeLeftInSeconds <= 0) {
                                clearInterval(this.displayIntervalId);
                                this.displayIntervalId = null;
                            }
                        }, 1000);

                        this.rollDiceTimer = setTimeout(() => {
                            this.clearRollDiceTimer();
                            const pontosPerdidos = Math.floor(Math.random() * 3) + 1;
                            player.losePoints(pontosPerdidos);
                            this.updateGameUI();
                            ui.showSpecialActionModal(
                                "Tempo Esgotado!",
                                `${player.name} não jogou a tempo e perdeu ${pontosPerdidos} ponto(s). Passando a vez.`,
                                                      [],
                                                      () => this.checkGameOverOrNextTurn(), true
                            );
                            const btnLancarDado = document.getElementById('btn-lancar-dado');
                            if (btnLancarDado) btnLancarDado.disabled = true;
                        }, this.rollDiceTimeoutDurationMs);
                    },

                    rollDice() {
                        this.clearRollDiceTimer();
                        const player = this.getCurrentPlayer();
                        if (!player || player.isFinished) {
                            this.nextTurn();
                            return;
                        }

                        const btnLancarDado = document.getElementById('btn-lancar-dado');
                        if(btnLancarDado) btnLancarDado.disabled = true;

                        const roll = Math.floor(Math.random() * 6) + 1;
                        if (typeof playSound === 'function') playSound('dice_roll');

                        if (typeof animations !== 'undefined' && typeof animations.animateDiceRoll === 'function') {
                            animations.animateDiceRoll(ui, roll, () => this.processMove(player, roll));
                        } else {
                            ui.showDiceResult(roll);
                            setTimeout(() => this.processMove(player, roll), 500);
                        }
                    },

                    processMove(player, steps) {
                        const oldPosition = player.position; // Pega a posição atual ANTES de mover
                        // A animação chama player.moveTo internamente OU player.moveTo é chamado após a animação
                        if (typeof animations !== 'undefined' && typeof animations.animatePlayerMove === 'function') {
                            animations.animatePlayerMove(player, steps, this.totalCasas, this, ui)
                            .then(() => {
                                // Após a animação, player.position já foi atualizado pela lógica de animação
                                // que chama player.moveTo.
                                // ui.updatePlayerPawn(player, oldPosition); // Atualiza o peão visualmente para a nova posição final
                                this.finalizeMoveActions(player);
                            });
                        } else {
                            player.moveTo(oldPosition + steps, this.totalCasas); // Movimento lógico direto
                            ui.updatePlayerPawn(player, oldPosition); // Atualiza o peão visualmente
                            this.finalizeMoveActions(player);
                        }
                    },

                    finalizeMoveActions(player) {
                        this.updateGameUI();
                        this.handleSquareLanding(player);
                    },

                    handleSquareLanding(player) {
                        this.clearRollDiceTimer();

                        // A checagem de player.isFinished deve ser a primeira e mais importante
                        if (player.isFinished) { // Se Player.moveTo marcou como finalizado
                            console.log(`${player.name} está na casa FIM (lógica). Posição: ${player.position}`);
                            if (this.players.every(p => p.isFinished) && !this.gameOverManuallyTriggered) {
                                this.endGame();
                            } else {
                                // Ainda há outros jogadores ou o jogo foi encerrado manualmente
                                this.checkGameOverOrNextTurn(); // Passa a vez para o próximo jogador ativo ou encerra se todos terminaram
                            }
                            return; // Importante: não processar mais nada se o jogador finalizou
                        }

                        if (player.position === 0) { // Chegou ao início (por alguma ação)
                            this.checkGameOverOrNextTurn();
                            return;
                        }

                        // Se chegou aqui, o jogador NÃO está finalizado e está em uma casa numerada (1 a totalCasas)
                        const casaData = this.boardData[player.position - 1]; // boardData é 0-indexed
                        if (!casaData) {
                            console.error(`Dados da casa ${player.position} não encontrados!`);
                            this.checkGameOverOrNextTurn();
                            return;
                        }

                        switch (casaData.type) {
                            case 'pergunta':
                                const question = this.getRandomQuestion();
                                if (question) {
                                    ui.showQuestionModal(question, (isCorrect) => {
                                        let feedbackTitle = isCorrect ? "Resposta Correta!" : "Resposta Incorreta!";
                                        let feedbackMessage;
                                        if (isCorrect) {
                                            player.addPoints(question.pontos);
                                            feedbackMessage = `${player.name} ganhou ${question.pontos} pontos!`;
                                        } else {
                                            const pontosPerdidos = Math.floor(Math.random() * (Math.floor(question.pontos / 3) || 1)) + 1;
                                            player.losePoints(pontosPerdidos);
                                            feedbackMessage = `${player.name} errou e perdeu ${pontosPerdidos} ponto(s).`;
                                        }
                                        this.updateGameUI();
                                        ui.showSpecialActionModal(feedbackTitle, feedbackMessage, [], () => this.checkGameOverOrNextTurn(), true);
                                    });
                                } else {
                                    ui.showSpecialActionModal("Sem Perguntas", "Nenhuma pergunta disponível no momento.", [], () => this.checkGameOverOrNextTurn(), true);
                                }
                                break;
                            case 'especial_fixa':
                            case 'especial_aleatoria_sorteio':
                                let actionToExecute = casaData.action; // Para 'especial_fixa'
                                // let modalTitle = "Casa Especial!"; // O título será definido no effect

                                if (casaData.type === 'especial_aleatoria_sorteio') {
                                    // modalTitle = "Sorteio de Ação!"; // O título será definido no effect
                                    const nonFixedActions = this.SPECIAL_ACTIONS.filter(act => act.isFixed !== true);
                                    if (nonFixedActions.length > 0) {
                                        actionToExecute = nonFixedActions[Math.floor(Math.random() * nonFixedActions.length)];
                                    } else {
                                        ui.showSpecialActionModal("Sem Sorteio", "Nenhuma ação especial de sorteio disponível.", [], () => this.checkGameOverOrNextTurn(), true);
                                        return;
                                    }
                                }

                                if (!actionToExecute || typeof actionToExecute.effect !== 'function') {
                                    this.checkGameOverOrNextTurn();
                                    return;
                                }

                                if (casaData.type === 'especial_aleatoria_sorteio') {
                                    ui.showDrawActionModal(() => {
                                        // O effect da ação é responsável por mostrar seu próprio modal e chamar proceedCallback
                                        actionToExecute.effect(player, this, null);
                                    });
                                } else { // 'especial_fixa'
                                    actionToExecute.effect(player, this, null);
                                }
                                break;
                            case 'neutra':
                            default:
                                this.checkGameOverOrNextTurn();
                                break;
                        }
                    },

                    nextTurn() {
                        if (this.gameOverManuallyTriggered) {
                            this.clearRollDiceTimer();
                            return;
                        }
                        this.clearRollDiceTimer();

                        if (this.players.every(p => p.isFinished)) {
                            if (!this.gameOverManuallyTriggered) this.endGame();
                            return;
                        }

                        let nextPlayerIdx = this.currentPlayerIndex;
                        let attempts = 0;
                        let playerSkippedAndNeedsNextTurn = false;

                        do {
                            nextPlayerIdx = (nextPlayerIdx + 1) % this.players.length;
                            attempts++;
                            const potentialNextPlayer = this.players[nextPlayerIdx];

                            if (!potentialNextPlayer.isFinished) {
                                if (potentialNextPlayer.skipNextTurn) {
                                    potentialNextPlayer.skipNextTurn = false;
                                    ui.showSpecialActionModal("Turno Pulado!", `${potentialNextPlayer.name} perdeu a vez nesta rodada.`, [], () => {
                                        // Este callback é chamado quando o modal de "Turno Pulado" é fechado.
                                        // Precisamos explicitamente chamar nextTurn para realmente passar para o próximo.
                                        playerSkippedAndNeedsNextTurn = true;
                                        this.checkGameOverOrNextTurn(); // Reavalia o estado do jogo
                                    }, true);
                                    return; // Sai do nextTurn atual; o fechamento do modal irá re-acionar checkGameOverOrNextTurn.
                                } else {
                                    this.currentPlayerIndex = nextPlayerIdx;
                                    this.updateGameUI();
                                    const btnLancarDado = document.getElementById('btn-lancar-dado');
                                    if (btnLancarDado) btnLancarDado.disabled = false;
                                    this.startRollDiceTimer();
                                    return; // Jogador válido encontrado e turno iniciado
                                }
                            }
                        } while (attempts < this.players.length * 2); // Garante que todos sejam checados (evita loop infinito)

                        // Se chegou aqui, pode ser que todos os jogadores restantes tenham finalizado
                        // ou algo inesperado ocorreu (como todos pulando o turno consecutivamente)
                        console.warn("Não foi possível determinar o próximo jogador ativo após várias tentativas no loop do-while.");
                        this.checkGameOverOrNextTurn(); // Força uma reavaliação do estado do jogo
                    },

                    checkGameOverOrNextTurn() {
                        if (this.gameOverManuallyTriggered) return;

                        if (this.players.every(p => p.isFinished)) {
                            if (!this.gameOverManuallyTriggered) this.endGame();
                        } else {
                            this.nextTurn();
                        }
                    },

                    updateGameUI() {
                        const currentPlayer = this.getCurrentPlayer();
                        if (currentPlayer) {
                            ui.updateRanking(this.players, currentPlayer.id);
                            ui.updateCurrentPlayerInfo(currentPlayer);
                        } else {
                            ui.updateRanking(this.players, null);
                            // ui.updateCurrentPlayerInfo(null); // ou similar para limpar
                        }
                    },

                    endGame() {
                        if (this.gameOverManuallyTriggered) return;
                        this.gameOverManuallyTriggered = true;
                        console.log("FIM DE JOGO!");
                        this.clearRollDiceTimer();
                        const btnLancarDado = document.getElementById('btn-lancar-dado');
                        if(btnLancarDado) btnLancarDado.disabled = true;
                        ui.displayPodium(this.players);
                        ui.switchScreen('tela-fim-jogo');
                    },

                    endGameManually() {
                        if (this.gameOverManuallyTriggered) return;
                        console.log("Jogo encerrado manualmente!");
                        this.gameOverManuallyTriggered = true;
                        this.clearRollDiceTimer();
                        const btnLancarDado = document.getElementById('btn-lancar-dado');
                        if (btnLancarDado) btnLancarDado.disabled = true;
                        ui.displayPodium(this.players);
                        ui.switchScreen('tela-fim-jogo');
                    },

                    resetGame() {
                        this.players = [];
                        this.boardData = [];
                        this.currentPlayerIndex = 0;
                        this.gameQuestions = [];
                        this.usedQuestionIdsThisGame.clear();
                        playerIdCounter = 0;
                        this.gameOverManuallyTriggered = false;
                        this.clearRollDiceTimer();
                        this.configPermitePontuacaoNegativa = true;
                        this.rollDiceTimeoutDurationMs = 10000;
                        ui.resetGameUI();
                    }
};
