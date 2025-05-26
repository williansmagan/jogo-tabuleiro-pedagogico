// js/ui.js
const ui = {
    tabuleiroContainer: document.getElementById('tabuleiro-container'),
    rankingUl: document.getElementById('ranking-ul'),
    jogadorAtualNome: document.getElementById('nome-jogador-atual'),
    jogadorAtualPontos: document.getElementById('pontos-jogador-atual'),
    resultadoDado: document.getElementById('resultado-dado'),
    imgDado: document.getElementById('img-dado'),
    modalPergunta: document.getElementById('modal-pergunta'),
    perguntaTexto: document.getElementById('pergunta-texto'),
    perguntaOpcoes: document.getElementById('pergunta-opcoes'),
    perguntaTempoBarra: document.getElementById('pergunta-tempo-barra'),
    feedbackResposta: document.getElementById('feedback-resposta'),
    modalAcaoEspecial: document.getElementById('modal-acao-especial'),
    acaoEspecialTitulo: document.getElementById('acao-especial-titulo'),
    acaoEspecialDescricao: document.getElementById('acao-especial-descricao'),
    acaoEspecialOpcoesJogador: document.getElementById('acao-especial-opcoes-jogador'),
    btnConfirmarAcaoEspecial: document.getElementById('btn-confirmar-acao-especial'),
    modalSorteio: document.getElementById('modal-sorteio-acao'),
    btnSortearAcao: document.getElementById('btn-sortear-acao-confirmar'),

    perguntaCategoriaDisplay: document.getElementById('pergunta-categoria-display'),
    perguntaDificuldadeDisplay: document.getElementById('pergunta-dificuldade-display'),
    perguntaAnoTurmaDisplay: document.getElementById('pergunta-ano-turma-display'),
    perguntaBimestreDisplay: document.getElementById('pergunta-bimestre-display'),
    perguntaComponenteDisplay: document.getElementById('pergunta-componente-display'), // NOVO

    podiumElements: {
        lugar1: document.getElementById('lugar-1'),
        lugar2: document.getElementById('lugar-2'),
        lugar3: document.getElementById('lugar-3'),
        avatar1: document.querySelector('#lugar-1 .player-avatar-podium'),
        avatar2: document.querySelector('#lugar-2 .player-avatar-podium'),
        avatar3: document.querySelector('#lugar-3 .player-avatar-podium'),
        barra1: document.querySelector('#lugar-1 .barra-podium'),
        barra2: document.querySelector('#lugar-2 .barra-podium'),
        barra3: document.querySelector('#lugar-3 .barra-podium'),
        nome1: document.querySelector('#lugar-1 .nome-podium'),
        pontos1: document.querySelector('#lugar-1 .pontos-podium'),
        nome2: document.querySelector('#lugar-2 .nome-podium'),
        pontos2: document.querySelector('#lugar-2 .pontos-podium'),
        nome3: document.querySelector('#lugar-3 .nome-podium'),
        pontos3: document.querySelector('#lugar-3 .pontos-podium'),
        textoBarra1: document.querySelector('#lugar-1 .barra-podium span'),
        textoBarra2: document.querySelector('#lugar-2 .barra-podium span'),
        textoBarra3: document.querySelector('#lugar-3 .barra-podium span'),
    },

    switchScreen(screenId) {
        document.querySelectorAll('.tela').forEach(tela => tela.classList.remove('ativa'));
        const telaAtiva = document.getElementById(screenId);
        if (telaAtiva) {
            telaAtiva.classList.add('ativa');
        } else {
            console.error(`Tela com ID "${screenId}" não encontrada.`);
        }
    },

    showDrawActionModal(onDrawCallback) {
        if (!this.modalSorteio || !this.btnSortearAcao) {
            console.error("Elementos do modal de sorteio não encontrados!");
            if (onDrawCallback) onDrawCallback();
            return;
        }
        this.btnSortearAcao.onclick = () => {
            this.modalSorteio.classList.add('escondido');
            if (onDrawCallback) onDrawCallback();
        };
            this.modalSorteio.classList.remove('escondido');
            if (typeof playSound === 'function') playSound('special_action', 0.5);
    },

    drawBoard(boardData, totalCasas) {
        this.tabuleiroContainer.innerHTML = '';
        // CORREÇÃO: Declarar casasParaRenderizar no início da função
        const casasParaRenderizar = [];

        const containerWidth = this.tabuleiroContainer.offsetWidth > 0 ? this.tabuleiroContainer.offsetWidth : 600;
        let COLS = Math.floor(containerWidth / (80 + 8));
        COLS = Math.max(3, Math.min(COLS, Math.min(totalCasas + 2, 12)));

        this.tabuleiroContainer.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;

        const inicioDiv = this.createCasaElement(0, 'INÍCIO', ['inicio']);
        casasParaRenderizar.push(inicioDiv);

        for (let i = 1; i <= totalCasas; i++) {
            const casaInfo = boardData[i - 1];
            const classes = [];
            if (casaInfo) {
                if (casaInfo.type === 'pergunta') classes.push('pergunta');
                else if (casaInfo.type === 'especial_fixa') classes.push('especial', 'fixa');
                else if (casaInfo.type === 'especial_aleatoria_sorteio') classes.push('especial', 'aleatoria');
                else if (casaInfo.type && casaInfo.type.startsWith('especial')) classes.push('especial');
            }
            casasParaRenderizar.push(this.createCasaElement(i, i.toString(), classes));
        }

        const fimIdLogicoParaDOM = totalCasas + 1;
        const fimDiv = this.createCasaElement(fimIdLogicoParaDOM, 'FIM', ['fim']);
        casasParaRenderizar.push(fimDiv); // Esta linha estava comentada na sua versão anterior, descomentei.

        const totalSlots = casasParaRenderizar.length;
        let casaIndex = 0;
        const NUM_LINHAS_TOTAIS = Math.ceil(totalSlots / COLS);

        for (let linha = 0; casaIndex < totalSlots; linha++) {
            const elementosDaLinha = [];
            let casasNestaLinha = 0;
            for (let col = 0; col < COLS && casaIndex < totalSlots; col++) {
                elementosDaLinha.push(casasParaRenderizar[casaIndex++]);
                casasNestaLinha++;
            }
            const ehUltimaLinha = (linha === NUM_LINHAS_TOTAIS - 1);
            const linhaEstaCompleta = (casasNestaLinha === COLS);
            if (linha % 2 !== 0 && (!ehUltimaLinha || linhaEstaCompleta)) {
                elementosDaLinha.reverse();
            }
            elementosDaLinha.forEach(el => this.tabuleiroContainer.appendChild(el));
        }
    },

    createCasaElement(id, textoNumero, classesArray = []) {
        const casaDiv = document.createElement('div');
        casaDiv.classList.add('casa-tabuleiro', ...classesArray);
        casaDiv.dataset.casaId = id;

        const numeroSpan = document.createElement('span');
        numeroSpan.className = 'casa-numero';
        numeroSpan.textContent = textoNumero;
        casaDiv.appendChild(numeroSpan);

        const peoesContainer = document.createElement('div');
        peoesContainer.className = 'casa-peoes-container';
        peoesContainer.id = `peoes-casa-${id}`;
        casaDiv.appendChild(peoesContainer);
        return casaDiv;
    },

    movePawnStep(player, targetCasaId, oldCasaId) {
        if (!player.pawnElement) {
            player.pawnElement = document.createElement('div');
            player.pawnElement.classList.add('peao');
            player.pawnElement.style.backgroundColor = player.color;
            player.pawnElement.title = player.name;
            player.pawnElement.textContent = player.name.substring(0, 1).toUpperCase();
        }
        const oldCasaContainer = document.getElementById(`peoes-casa-${oldCasaId}`);
        if (oldCasaContainer && player.pawnElement.parentElement === oldCasaContainer) {
            oldCasaContainer.removeChild(player.pawnElement);
        }
        const targetCasaContainer = document.getElementById(`peoes-casa-${targetCasaId}`);
        if (targetCasaContainer) {
            targetCasaContainer.appendChild(player.pawnElement);
            if (typeof playSound === 'function') playSound('pawn_move', 0.3, true);
        }
    },

    updatePlayerPawn(player, oldPositionIgnored = null) {
        if (player.pawnElement && player.pawnElement.parentElement) {
            player.pawnElement.parentElement.removeChild(player.pawnElement);
        }

        let targetPeonContainerId;

        if (player.isFinished) {
            const posicaoLogicaFim = (typeof game !== 'undefined' && game.totalCasas)
            ? game.totalCasas + 1
            : player.position;
            targetPeonContainerId = `peoes-casa-${posicaoLogicaFim}`;
        } else if (player.position === 0) {
            targetPeonContainerId = `peoes-casa-0`;
        } else {
            targetPeonContainerId = `peoes-casa-${player.position}`;
        }

        const casaAtualContainer = document.getElementById(targetPeonContainerId);
        if (casaAtualContainer) {
            if (!player.pawnElement) {
                player.pawnElement = document.createElement('div');
                player.pawnElement.classList.add('peao');
                player.pawnElement.style.backgroundColor = player.color;
                player.pawnElement.title = player.name;
                player.pawnElement.textContent = player.name.substring(0, 1).toUpperCase();
            }
            casaAtualContainer.appendChild(player.pawnElement);
        } else {
            console.warn(`[UI] Container de peões NÃO encontrado para ID: ${targetPeonContainerId} (Jogador: ${player.name}, Posição Lógica Atual: ${player.position}, Finalizado: ${player.isFinished})`);
        }
    },

    updateRanking(players, currentPlayerId) {
        this.rankingUl.innerHTML = '';
        const sortedPlayers = [...players].sort((a, b) => {
            if (a.isFinished && !b.isFinished) return -1;
            if (!a.isFinished && b.isFinished) return 1;
            return b.score - a.score;
        });
        sortedPlayers.forEach(player => {
            const li = document.createElement('li');
            if (player.id === currentPlayerId) {
                li.classList.add('jogador-ativo-ranking');
            }
            const colorIndicator = document.createElement('span');
            colorIndicator.className = 'player-color-indicator';
            colorIndicator.style.backgroundColor = player.color;
            li.appendChild(colorIndicator);

            const nameSpan = document.createElement('span');
            nameSpan.className = 'player-name-ranking';
            nameSpan.textContent = `${player.name}: ${player.score} pts ${player.isFinished ? '(Finalizou Expedição!)' : ''}`;
            li.appendChild(nameSpan);

            this.rankingUl.appendChild(li);
        });
    },

    updateCurrentPlayerInfo(player) {
        this.jogadorAtualNome.textContent = player.name;
        this.jogadorAtualPontos.textContent = player.score;
    },

    showDiceResult(result) {
        this.resultadoDado.textContent = result;
        this.imgDado.src = `assets/images/dice/dice_${result}.png`;
    },

    showQuestionModal(question, onAnswerCallback) {
        if (this.perguntaComponenteDisplay) { // NOVO
            this.perguntaComponenteDisplay.textContent = `Componente: ${question.componente_curricular || 'N/D'}`;
        }
        if (this.perguntaBimestreDisplay) {
            this.perguntaBimestreDisplay.textContent = `Bimestre: ${question.bimestre || 'N/D'}`;
        }
        if (this.perguntaCategoriaDisplay) {
            this.perguntaCategoriaDisplay.textContent = `Conteúdo: ${question.categoria || 'N/D'}`;
        }
        if (this.perguntaDificuldadeDisplay) {
            this.perguntaDificuldadeDisplay.textContent = `Dificuldade: ${question.dificuldade || 'N/D'}`;
        }
        if (this.perguntaAnoTurmaDisplay) {
            const anoTurmaTexto = Array.isArray(question.ano_turma) ? question.ano_turma.join(', ') : question.ano_turma;
            this.perguntaAnoTurmaDisplay.textContent = `Ano/Turma: ${anoTurmaTexto || 'N/D'}`;
        }

        this.perguntaTexto.textContent = question.texto;
        this.perguntaOpcoes.innerHTML = '';
        this.feedbackResposta.textContent = '';
        this.feedbackResposta.className = '';

        const totalTime = question.tempo;
        let timeLeft = totalTime;

        if (this.perguntaTempoBarra) {
            this.perguntaTempoBarra.style.width = '100%';
            this.perguntaTempoBarra.style.backgroundColor = 'var(--cor-sucesso)';
        }

        let answerProcessed = false;
        let timerInterval;

        const processAnswer = (isCorrectArg, respostaDada = null) => {
            if (answerProcessed) return;
            answerProcessed = true;
            clearInterval(timerInterval);

            this.perguntaOpcoes.querySelectorAll('button').forEach(btn => {
                btn.disabled = true;
                if (btn.textContent === respostaDada) {
                    if (isCorrectArg) {
                        btn.style.backgroundColor = 'var(--cor-sucesso)';
                        btn.style.borderColor = 'var(--cor-sucesso)';
                    } else {
                        btn.style.backgroundColor = 'var(--cor-perigo)';
                        btn.style.borderColor = 'var(--cor-perigo)';
                    }
                }
            });

            if (isCorrectArg) {
                this.feedbackResposta.textContent = "Correto!";
                this.feedbackResposta.className = 'correto';
            } else if (timeLeft <= 0) {
                this.feedbackResposta.textContent = `Tempo esgotado!`;
                this.feedbackResposta.className = 'incorreto';
            } else {
                this.feedbackResposta.textContent = `Incorreto!`;
                this.feedbackResposta.className = 'incorreto';
            }

            if (typeof playSound === 'function') {
                playSound(isCorrectArg ? 'question_correct' : 'question_incorrect');
            }

            setTimeout(() => {
                this.hideQuestionModal();
                onAnswerCallback(isCorrectArg);
            }, 2000);
        };

        timerInterval = setInterval(() => {
            if (answerProcessed) {
                clearInterval(timerInterval);
                return;
            }
            timeLeft--;
            if (this.perguntaTempoBarra) {
                const percentRemaining = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
                this.perguntaTempoBarra.style.width = `${Math.max(0, percentRemaining)}%`;
                if (timeLeft <= 0) this.perguntaTempoBarra.style.backgroundColor = 'var(--cor-perigo)';
                else if (percentRemaining < 33) this.perguntaTempoBarra.style.backgroundColor = 'var(--cor-perigo)';
                else if (percentRemaining < 66) this.perguntaTempoBarra.style.backgroundColor = 'var(--cor-aviso)';
                else this.perguntaTempoBarra.style.backgroundColor = 'var(--cor-sucesso)';
            }
            if (timeLeft <= 0) {
                processAnswer(false);
            }
        }, 1000);

        question.opcoes.forEach(opcao => {
            const btn = document.createElement('button');
            btn.textContent = opcao;
            btn.onclick = () => {
                if (answerProcessed) return;
                const isCorrect = (opcao === question.resposta_correta);
                processAnswer(isCorrect, opcao);
            };
            this.perguntaOpcoes.appendChild(btn);
        });
        this.modalPergunta.classList.remove('escondido');
    },

    hideQuestionModal() {
        this.modalPergunta.classList.add('escondido');
    },

    showSpecialActionModal(title, description, playersForSelection = [], callback, showConfirmButton = true) {
        this.acaoEspecialTitulo.textContent = title;
        this.acaoEspecialDescricao.innerHTML = description;
        this.acaoEspecialOpcoesJogador.innerHTML = '';

        this.btnConfirmarAcaoEspecial.style.display = showConfirmButton ? 'inline-block' : 'none';

        if (playersForSelection && playersForSelection.length > 0) {
            const selectLabel = document.createElement('label');
            selectLabel.htmlFor = 'select-jogador-acao';
            selectLabel.textContent = "Escolha um explorador alvo:";
            selectLabel.style.display = 'block';
            selectLabel.style.marginBottom = '8px';
            selectLabel.style.fontWeight = '600';
            this.acaoEspecialOpcoesJogador.appendChild(selectLabel);

            const select = document.createElement('select');
            select.id = 'select-jogador-acao';
            playersForSelection.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = p.name;
                select.appendChild(option);
            });
            this.acaoEspecialOpcoesJogador.appendChild(select);
            this.btnConfirmarAcaoEspecial.textContent = "Confirmar Alvo";
        } else {
            this.btnConfirmarAcaoEspecial.textContent = "Entendido!";
        }

        this.btnConfirmarAcaoEspecial.onclick = () => {
            this.hideSpecialActionModal();
            if (callback) {
                let selectedPlayerId = null;
                const selectElement = document.getElementById('select-jogador-acao');
                if (selectElement) {
                    selectedPlayerId = selectElement.value;
                }
                callback(selectedPlayerId);
            }
        };
        this.modalAcaoEspecial.classList.remove('escondido');
    },

    hideSpecialActionModal() {
        this.modalAcaoEspecial.classList.add('escondido');
    },

    displayPodium(players) {
        const rankingContainer = document.getElementById('ranking-completo-container');
        if (rankingContainer) rankingContainer.classList.remove('visible');

        let maxPodiumAnimationTime = 0;

        [this.podiumElements.avatar1, this.podiumElements.avatar2, this.podiumElements.avatar3].forEach(avatar => {
            if (avatar) avatar.style.backgroundColor = 'var(--cor-borda)';
        });

            const sortedByScore = [...players].sort((a, b) => b.score - a.score);
            const top3Players = sortedByScore.slice(0, 3);

            if (typeof animations !== 'undefined' && typeof animations.animatePodium === 'function') {
                if (this.podiumElements.avatar1 && top3Players[0]) this.podiumElements.avatar1.style.backgroundColor = top3Players[0].color;
                if (this.podiumElements.avatar2 && top3Players[1]) this.podiumElements.avatar2.style.backgroundColor = top3Players[1].color;
                if (this.podiumElements.avatar3 && top3Players[2]) this.podiumElements.avatar3.style.backgroundColor = top3Players[2].color;

                animations.animatePodium(players, this.podiumElements, this);
                if (top3Players.length > 0) {
                    maxPodiumAnimationTime = ((top3Players.length -1) * 500) + 500 + 1500;
                } else {
                    maxPodiumAnimationTime = 500;
                }
            } else {
                // Fallback (ajustei o nome da var para evitar conflito de escopo se estivesse dentro de um if)
                // const podiumDataConfigFallback = [...players].sort((a, b) => b.score - a.score); // Não é necessário, já temos sortedByScore
                // const top3PlayersFallback = sortedByScore.slice(0, 3); // Já temos top3Players
                const podiumElementsMap = [ // Mapeia índice do top3 para os elementos corretos do pódio
                { elLugar: this.podiumElements.lugar1, elAvatar: this.podiumElements.avatar1, elNome: this.podiumElements.nome1, elPontos: this.podiumElements.pontos1, elBarra: this.podiumElements.barra1, elTextoBarra: this.podiumElements.textoBarra1, height: 200, text: '1º'},
                { elLugar: this.podiumElements.lugar2, elAvatar: this.podiumElements.avatar2, elNome: this.podiumElements.nome2, elPontos: this.podiumElements.pontos2, elBarra: this.podiumElements.barra2, elTextoBarra: this.podiumElements.textoBarra2, height: 150, text: '2º'},
                { elLugar: this.podiumElements.lugar3, elAvatar: this.podiumElements.avatar3, elNome: this.podiumElements.nome3, elPontos: this.podiumElements.pontos3, elBarra: this.podiumElements.barra3, elTextoBarra: this.podiumElements.textoBarra3, height: 100, text: '3º'}
                ];

                podiumElementsMap.forEach(p => {
                    if(p.elLugar) p.elLugar.classList.remove('visible');
                    if(p.elBarra) p.elBarra.style.height = '0px';
                    if(p.elNome) p.elNome.textContent = '-';
                    if(p.elPontos) p.elPontos.textContent = '- pts';
                    if(p.elTextoBarra) p.elTextoBarra.textContent = '';
                    if(p.elAvatar) p.elAvatar.style.backgroundColor = 'var(--cor-borda)';
                });

                    if (top3Players.length > 0) {
                        top3Players.forEach((player, index) => {
                            if (podiumElementsMap[index]) { // Usa o mapa para pegar os elementos corretos
                                const pd = podiumElementsMap[index];
                                setTimeout(() => {
                                    if(pd.elLugar) pd.elLugar.classList.add('visible');
                                    if(pd.elAvatar) pd.elAvatar.style.backgroundColor = player.color;
                                    if(pd.elNome) pd.elNome.textContent = player.name;
                                    if(pd.elPontos) pd.elPontos.textContent = `${player.score} pts`;
                                    if(pd.elBarra) pd.elBarra.style.height = `${pd.height}px`;
                                    if (pd.elTextoBarra) pd.elTextoBarra.textContent = pd.text;
                                    if(pd.elBarra) pd.elBarra.classList.add('animated');

                                    if (index === 0) { this.triggerConfetti(); if (typeof playSound === 'function') playSound('podium_win');}
                                    else { if (typeof playSound === 'function') playSound('podium_place');}
                                }, ((index * 500) + 500));
                            }
                        });
                        maxPodiumAnimationTime = ((top3Players.length -1) * 500) + 500 + 1000;
                    } else { maxPodiumAnimationTime = 200; }
            }

            const corpoTabela = document.getElementById('corpo-tabela-ranking-completo');
            corpoTabela.innerHTML = '';
            const podiumPlayerIds = new Set(top3Players.map(p => p.id));
            const jogadoresParaTabela = sortedByScore.filter(player => !podiumPlayerIds.has(player.id));

            if (jogadoresParaTabela.length > 0) {
                jogadoresParaTabela.forEach((player, indexNaTabela) => {
                    const tr = corpoTabela.insertRow();
                    const tdPos = tr.insertCell();
                    const tdNome = tr.insertCell();
                    const tdPontos = tr.insertCell();
                    tdPos.textContent = `${indexNaTabela + top3Players.length + 1}º`;
                    tdNome.innerHTML = `<span class="player-color-indicator" style="background-color: ${player.color};"></span> ${player.name}`;
                    tdPontos.textContent = player.score;
                });
            } else {
                if (players.length <= 3 && players.length > 0) {
                    const tr = corpoTabela.insertRow();
                    const td = tr.insertCell();
                    td.colSpan = 3;
                    td.textContent = "Todos os exploradores estão no pódio!";
                    td.style.textAlign = "center";
                } else if (players.length === 0) {
                    const tr = corpoTabela.insertRow();
                    const td = tr.insertCell();
                    td.colSpan = 3;
                    td.textContent = "Nenhum explorador participou desta expedição.";
                    td.style.textAlign = "center";
                }
            }

            const delayParaTabelaAparecer = maxPodiumAnimationTime + 200;
            setTimeout(() => {
                if (rankingContainer) rankingContainer.classList.add('visible');
            }, delayParaTabelaAparecer);
    },

    triggerConfetti() {
        this.removeConfetti();
        const podiumDiv = document.getElementById('podium');
        if (!podiumDiv) return;

        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        podiumDiv.appendChild(confettiContainer);

        const colors = ['gold', '#FFD700', '#FFDF00', 'silver', '#C0C0C0', '#CD7F32', '#B87333', 'white'];
        for (let i = 0; i < 200; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 10 + 6;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            confetti.style.opacity = Math.random() * 0.5 + 0.5;
            confetti.style.animationDelay = Math.random() * 1 + 's';
            confetti.style.animationDuration = (Math.random() * 2.5 + 3) + 's';
            confettiContainer.appendChild(confetti);
        }
    },

    removeConfetti() {
        const existingConfetti = document.querySelector('.confetti-container');
        if (existingConfetti) existingConfetti.remove();
    },

    resetGameUI() {
        if (this.tabuleiroContainer) this.tabuleiroContainer.innerHTML = '';
        if (this.rankingUl) this.rankingUl.innerHTML = '';
        if (this.jogadorAtualNome) this.jogadorAtualNome.textContent = '-';
        if (this.jogadorAtualPontos) this.jogadorAtualPontos.textContent = '0';
        if (this.resultadoDado) this.resultadoDado.textContent = '-';
        if (this.imgDado) this.imgDado.src = 'assets/images/dice/dice_placeholder.png';

        this.removeConfetti();
        const podiumElementsArray = [
            this.podiumElements.nome1, this.podiumElements.nome2, this.podiumElements.nome3,
            this.podiumElements.pontos1, this.podiumElements.pontos2, this.podiumElements.pontos3
        ];
        podiumElementsArray.forEach(el => { if(el) el.textContent = '-'; });

        const barrasPodium = [this.podiumElements.barra1, this.podiumElements.barra2, this.podiumElements.barra3];
        barrasPodium.forEach(barra => { if(barra) barra.style.height = '0px'; });

        const lugaresPodium = [this.podiumElements.lugar1, this.podiumElements.lugar2, this.podiumElements.lugar3];
        lugaresPodium.forEach(lugar => { if(lugar) lugar.classList.remove('visible'); });

        [this.podiumElements.avatar1, this.podiumElements.avatar2, this.podiumElements.avatar3].forEach(avatar => {
            if (avatar) avatar.style.backgroundColor = 'var(--cor-borda)';
        });

            const rankingCompleto = document.getElementById('ranking-completo-container');
            if(rankingCompleto) rankingCompleto.classList.remove('visible');
            const corpoTabela = document.getElementById('corpo-tabela-ranking-completo');
        if(corpoTabela) corpoTabela.innerHTML = '';

        [this.modalPergunta, this.modalAcaoEspecial, this.modalSorteio].forEach(modal => {
            if (modal) modal.classList.add('escondido');
        });
    }
};
