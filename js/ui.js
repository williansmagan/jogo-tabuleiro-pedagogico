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
    perguntaTempo: document.getElementById('pergunta-tempo'),
    feedbackResposta: document.getElementById('feedback-resposta'),

    modalAcaoEspecial: document.getElementById('modal-acao-especial'),
    acaoEspecialTitulo: document.getElementById('acao-especial-titulo'),
    acaoEspecialDescricao: document.getElementById('acao-especial-descricao'),
    acaoEspecialOpcoesJogador: document.getElementById('acao-especial-opcoes-jogador'),
    btnConfirmarAcaoEspecial: document.getElementById('btn-confirmar-acao-especial'),

    modalSorteio: document.getElementById('modal-sorteio-acao'), // Adicione este ID ao seu HTML
    btnSortearAcao: document.getElementById('btn-sortear-acao-confirmar'), // Adicione este ID ao seu HTML


    showDrawActionModal(onDrawCallback) {
        // Você pode criar um novo modal no HTML ou reconfigurar um existente.
        // Vamos assumir um novo modal simples para clareza:
        // <div id="modal-sorteio-acao" class="modal escondido">
        //     <div class="modal-conteudo">
        //         <h3>Casa da Sorte!</h3>
        //         <p>Clique no botão para revelar sua sorte ou revés!</p>
        //         <button id="btn-sortear-acao-confirmar">Sortear Ação!</button>
        //     </div>
        // </div>

        // Se os elementos não foram pegos no início, pegue-os aqui (mas melhor no topo do objeto ui)
        if (!this.modalSorteio) this.modalSorteio = document.getElementById('modal-sorteio-acao');
        if (!this.btnSortearAcao) this.btnSortearAcao = document.getElementById('btn-sortear-acao-confirmar');

        if (!this.modalSorteio || !this.btnSortearAcao) {
            console.error("Elementos do modal de sorteio não encontrados no DOM!");
            // Executa o callback imediatamente para não travar o jogo, mas sem sorteio real
            if (onDrawCallback) onDrawCallback();
            return;
        }
        
        this.btnSortearAcao.onclick = () => {
            this.modalSorteio.classList.add('escondido');
            if (onDrawCallback) {
                onDrawCallback(); // Chama o callback que fará o sorteio e mostrará o próximo modal
            }
        };
        this.modalSorteio.classList.remove('escondido');
        if (typeof playSound === 'function') playSound('special_action', 0.5); // Som ao cair na casa de sorteio
    },
    
    // Manter podiumElements para que animations.js possa usá-los
    podiumElements: {
        lugar1: document.getElementById('lugar-1'),
        lugar2: document.getElementById('lugar-2'),
        lugar3: document.getElementById('lugar-3'),
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
        document.getElementById(screenId).classList.add('ativa');
    },

    updatePlayerList(players) {
        const ul = document.getElementById('jogadores-ul');
        ul.innerHTML = '';
        players.forEach((player, index) => { // Usar index para cor consistente se Player.color não existir
            const li = document.createElement('li');
            const colorIndicator = document.createElement('span');
            colorIndicator.className = 'player-color-indicator';
            // Se Player tem uma propriedade 'color', use-a. Senão, use PLAYER_COLORS.
            colorIndicator.style.backgroundColor = player.color || (typeof PLAYER_COLORS !== 'undefined' ? PLAYER_COLORS[index % PLAYER_COLORS.length] : '#ccc');
            li.appendChild(colorIndicator);
            li.appendChild(document.createTextNode(player.name));
            ul.appendChild(li);
        });
    },

    drawBoard(boardData, totalCasas) {
        this.tabuleiroContainer.innerHTML = ''; // Limpa tabuleiro anterior

        // --- Cálculo do número de colunas (COLS) ---
        // Mantenha ou ajuste sua lógica preferida para COLS
        // Exemplo:
        const desiredCellSize = 75; // Ajuste conforme o tamanho da casa desejado
        const containerWidth = this.tabuleiroContainer.offsetWidth > 0 ? this.tabuleiroContainer.offsetWidth : 600; // Fallback se não visível
        let COLS = Math.floor(containerWidth / (desiredCellSize + 5)); // +5 para o gap
        COLS = Math.max(3, Math.min(COLS, 10)); // Mínimo 3, Máximo 10 colunas
        if (totalCasas > 0 && totalCasas < COLS) {
            COLS = totalCasas;
        }
        this.tabuleiroContainer.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
        //console.log(`Tabuleiro desenhado com ${COLS} colunas.`);

        // --- Geração das casas em ordem de serpentina ---
        const casasParaRenderizar = []; // Array temporário para armazenar os elementos das casas

        // Criar elemento para INÍCIO
        const inicioDiv = document.createElement('div');
        inicioDiv.classList.add('casa-tabuleiro', 'inicio');
        inicioDiv.dataset.casaId = 0;
        const inicioNumero = document.createElement('span');
        inicioNumero.className = 'casa-numero';
        inicioNumero.textContent = 'INÍCIO';
        inicioDiv.appendChild(inicioNumero);
        const inicioPeoesContainer = document.createElement('div');
        inicioPeoesContainer.className = 'casa-peoes-container';
        inicioPeoesContainer.id = `peoes-casa-0`;
        inicioDiv.appendChild(inicioPeoesContainer);
        casasParaRenderizar.push(inicioDiv); // Adiciona ao array

        // Criar elementos para as casas numeradas (1 a totalCasas)
        for (let i = 1; i <= totalCasas; i++) {
            const casaDiv = document.createElement('div');
            casaDiv.classList.add('casa-tabuleiro');
            casaDiv.dataset.casaId = i;

            const numeroCasa = document.createElement('span');
            numeroCasa.className = 'casa-numero';
            numeroCasa.textContent = i;
            casaDiv.appendChild(numeroCasa);

            const peoesContainer = document.createElement('div');
            peoesContainer.className = 'casa-peoes-container';
            peoesContainer.id = `peoes-casa-${i}`;
            casaDiv.appendChild(peoesContainer);

            // Aplicar classes de tipo de casa (pergunta, especial, etc.)
            const casaInfo = boardData[i - 1]; // boardData é 0-indexed para casas 1 em diante
            if (casaInfo) {
                if (casaInfo.type === 'pergunta') casaDiv.classList.add('pergunta');
                else if (casaInfo.type === 'especial_fixa') casaDiv.classList.add('especial', 'fixa');
                else if (casaInfo.type === 'especial_aleatoria') casaDiv.classList.add('especial', 'aleatoria');
                else if (casaInfo.type && casaInfo.type.startsWith('especial')) casaDiv.classList.add('especial');
            }
            casasParaRenderizar.push(casaDiv); // Adiciona ao array
        }

        // Criar elemento para FIM
        // Nota: A lógica de 'FIM' como uma casa separada precisa ser consistente.
        // Se 'totalCasas' já é a última casa numerada antes do 'FIM', então FIM é totalCasas + 1.
        const fimIdLogico = totalCasas + 1; // ID lógico para a casa FIM
        const fimDiv = document.createElement('div');
        fimDiv.classList.add('casa-tabuleiro', 'fim');
        fimDiv.dataset.casaId = fimIdLogico;
        const fimNumero = document.createElement('span');
        fimNumero.className = 'casa-numero';
        fimNumero.textContent = 'FIM';
        fimDiv.appendChild(fimNumero);
        const fimPeoesContainer = document.createElement('div');
        fimPeoesContainer.className = 'casa-peoes-container';
        fimPeoesContainer.id = `peoes-casa-${fimIdLogico}`;
        fimDiv.appendChild(fimPeoesContainer);
        casasParaRenderizar.push(fimDiv); // Adiciona ao array

        /*

        // --- Adicionar casas ao DOM na ordem de serpentina ---
        // O número total de "slots" no grid, incluindo INÍCIO e FIM
        const totalSlots = casasParaRenderizar.length;
        let casaIndex = 0; // Índice para pegar do array casasParaRenderizar

        for (let linha = 0; casaIndex < totalSlots; linha++) {
            const elementosDaLinha = [];
            for (let col = 0; col < COLS && casaIndex < totalSlots; col++) {
                elementosDaLinha.push(casasParaRenderizar[casaIndex++]);
            }

            if (linha % 2 !== 0) { // Se a linha for par (0-indexed, então linha 1, 3, 5...)
                elementosDaLinha.reverse(); // Inverte a ordem dos elementos para esta linha
            }

            elementosDaLinha.forEach(el => this.tabuleiroContainer.appendChild(el));
        }
        // Se o número total de slots não preencher a última linha completamente,
        // o CSS Grid cuidará de alinhar os itens restantes.
        */

        // --- Adicionar casas ao DOM na ordem de serpentina ---
        // O número total de "slots" no grid, incluindo INÍCIO e FIM
        const totalSlots = casasParaRenderizar.length;
        let casaIndex = 0; // Índice para pegar do array casasParaRenderizar
        const NUM_LINHAS_TOTAIS = Math.ceil(totalSlots / COLS); // Calcula o número total de linhas que serão criadas

        for (let linha = 0; casaIndex < totalSlots; linha++) {
            const elementosDaLinha = [];
            let casasNestaLinha = 0; // Contador para casas realmente adicionadas a esta linha
            for (let col = 0; col < COLS && casaIndex < totalSlots; col++) {
                elementosDaLinha.push(casasParaRenderizar[casaIndex++]);
                casasNestaLinha++;
            }

            // Condição para inverter:
            // 1. A linha é ímpar (linha % 2 !== 0)
            // 2. E (Não é a última linha OU (é a última linha E está completa))
            const ehUltimaLinha = (linha === NUM_LINHAS_TOTAIS - 1);
            const linhaEstaCompleta = (casasNestaLinha === COLS);

            if (linha % 2 !== 0) { // Se for uma linha que normalmente seria invertida
                if (!ehUltimaLinha || linhaEstaCompleta) { // Só inverte se não for a última linha OU se for a última E estiver completa
                    elementosDaLinha.reverse();
                }
                // Se for a última linha E NÃO estiver completa, não faz o reverse.
                // Isso mantém a ordem da esquerda para a direita para linhas incompletas invertidas.
            }

            elementosDaLinha.forEach(el => this.tabuleiroContainer.appendChild(el));
        }
    },

    // Função base para mover peão, usada por animations.js ou diretamente
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
            if (typeof playSound === 'function') playSound('pawn_move', 0.3, true); // true para interromper
        }
    },

    // Função para atualizar a posição do peão instantaneamente
    updatePlayerPawn(player, oldPosition) {
        // Remove peão da posição antiga (se existir o elemento e estiver no DOM)
        if (player.pawnElement && player.pawnElement.parentElement) {
            player.pawnElement.parentElement.removeChild(player.pawnElement);
        }

        // Determinar o ID do container de peões da casa atual do jogador
        let targetPeonContainerId;
        if (player.position === 0) { // INICIO
            targetPeonContainerId = `peoes-casa-0`;
        } else if (player.isFinished) { // FIM (posição lógica é totalCasas + 1)
            targetPeonContainerId = `peoes-casa-${game.totalCasas + 1}`;
        } else { // Casas numeradas (1 a totalCasas)
            targetPeonContainerId = `peoes-casa-${player.position}`;
        }


        // Adiciona peão na nova posição lógica do jogador
        const casaAtualContainer = document.getElementById(`peoes-casa-${player.position}`);
        if (casaAtualContainer) {
            if (!player.pawnElement) { // Cria o elemento do peão se não existir
                player.pawnElement = document.createElement('div');
                player.pawnElement.classList.add('peao');
                player.pawnElement.style.backgroundColor = player.color;
                player.pawnElement.title = player.name;
                player.pawnElement.textContent = player.name.substring(0, 1).toUpperCase();
            }
            casaAtualContainer.appendChild(player.pawnElement);
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
            li.appendChild(document.createTextNode(`${player.name}: ${player.score} PONTOS ${player.isFinished ? '(CHEGOU AO FIM)' : ''}`));
            this.rankingUl.appendChild(li);
        });
    },

    updateCurrentPlayerInfo(player) {
        this.jogadorAtualNome.textContent = player.name;
        this.jogadorAtualPontos.textContent = player.score;
    },

    showDiceResult(result) {
        this.resultadoDado.textContent = result;
        this.imgDado.src = `assets/images/dice_${result}.png`;
        // O som do dado será chamado por gameLogic ou animations
    },

    showQuestionModal(question, onAnswerCallback) {
        this.perguntaTexto.textContent = question.texto;
        this.perguntaOpcoes.innerHTML = '';
        this.feedbackResposta.textContent = '';
        this.feedbackResposta.className = ''; // Limpa classes de feedback anterior
        let timeLeft = question.tempo;
        this.perguntaTempo.textContent = timeLeft;

        let answerProcessed = false; // Flag para garantir que a resposta seja processada apenas uma vez
        let timerInterval; // Mover a declaração do timerInterval para cá

        const processAnswer = (isCorrectArg) => {
            if (answerProcessed) return; // Se já processou, não faz nada
            answerProcessed = true;

            clearInterval(timerInterval); // Para o timer

            // Desabilita todos os botões de opção
            this.perguntaOpcoes.querySelectorAll('button').forEach(btn => {
                btn.disabled = true;
                // Opcional: adicionar uma classe para indicar visualmente que foram desabilitados
                // btn.classList.add('disabled-option');
            });

            //this.feedbackResposta.textContent = isCorrectArg ? "Correto!" : `Incorreto. A resposta era: ${question.resposta_correta}`;
            this.feedbackResposta.textContent = isCorrectArg ? "CORRETO!" : `INCORRETO!`;
            this.feedbackResposta.className = isCorrectArg ? 'correto' : 'incorreto';

            if (typeof playSound === 'function') {
                playSound(isCorrectArg ? 'question_correct' : 'question_incorrect');
            }

            setTimeout(() => {
                this.hideQuestionModal();
                onAnswerCallback(isCorrectArg); // Chama o callback para gameLogic processar pontos, etc.
            }, 2000); // Delay para ver o feedback
        };

        timerInterval = setInterval(() => {
            if (answerProcessed) { // Se a resposta já foi processada por um clique, limpa o timer
                clearInterval(timerInterval);
                return;
            }
            timeLeft--;
            this.perguntaTempo.textContent = timeLeft;
            if (timeLeft <= 0) {
                // clearInterval(timerInterval); // Já será feito em processAnswer
                this.feedbackResposta.textContent = "TEMPO ESGOTADO!"; // Feedback visual do tempo esgotado
                this.feedbackResposta.className = 'incorreto';
                if (typeof playSound === 'function') playSound('question_incorrect'); // Som de erro para tempo esgotado
                processAnswer(false); // Considera tempo esgotado como resposta errada
            }
        }, 1000);

        question.opcoes.forEach(opcao => {
            const btn = document.createElement('button');
            btn.textContent = opcao;
            btn.onclick = () => {
                if (answerProcessed) return; // Segurança extra, embora a desabilitação deva prevenir

                const isCorrect = (opcao === question.resposta_correta);
                processAnswer(isCorrect);
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
        this.acaoEspecialDescricao.textContent = description;
        this.acaoEspecialOpcoesJogador.innerHTML = '';

        this.btnConfirmarAcaoEspecial.style.display = showConfirmButton ? 'inline-block' : 'none';

        if (playersForSelection && playersForSelection.length > 0) {
            const select = document.createElement('select');
            select.id = 'select-jogador-acao';
            playersForSelection.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = p.name;
                select.appendChild(option);
            });
            this.acaoEspecialOpcoesJogador.appendChild(select);
            this.btnConfirmarAcaoEspecial.textContent = "CONFIRMAR ESCOLHA";
        } else {
            this.btnConfirmarAcaoEspecial.textContent = "OK";
        }

        this.btnConfirmarAcaoEspecial.onclick = () => {
            this.hideSpecialActionModal();
            if (callback) {
                let selectedPlayerId = null;
                if (playersForSelection && playersForSelection.length > 0) {
                    selectedPlayerId = document.getElementById('select-jogador-acao').value;
                }
                callback(selectedPlayerId);
            }
        };
        // Tocar som para casa especial, se for o caso
        if (title === "CASA ESPECIAL!" && typeof playSound === 'function') {
            playSound('special_action');
        }
        this.modalAcaoEspecial.classList.remove('escondido');
    },

    hideSpecialActionModal() {
        this.modalAcaoEspecial.classList.add('escondido');
    },

    displayPodium(players) {
        const rankingContainer = document.getElementById('ranking-completo-container');
        if (rankingContainer) {
            rankingContainer.classList.remove('visible'); // Garante que está oculto inicialmente
        }

        let maxPodiumAnimationTime = 0; // Tempo em ms para a animação do pódio terminar

        if (typeof animations !== 'undefined' && typeof animations.animatePodium === 'function') {
            // Se animations.animatePodium for uma Promise ou tiver um callback de conclusão, usar isso.
            // Esta é a abordagem IDEAL. Se não, teremos que estimar.
            // Exemplo se for uma Promise:
            // animations.animatePodium(players, this.podiumElements, this).then(() => {
            //     if (rankingContainer) rankingContainer.classList.add('visible');
            // });
            // Por agora, vamos estimar o tempo se não houver Promise/callback:
            animations.animatePodium(players, this.podiumElements, this);

            // Estimativa grosseira. Ajuste este valor com base na duração real da sua animations.animatePodium
            const sortedForAnim = [...players].sort((a, b) => b.score - a.score);
            const top3ForAnim = sortedForAnim.slice(0, 3);
            if (top3ForAnim.length > 0) {
                // Supondo que sua animação escalonada seja parecida com a alternativa
                maxPodiumAnimationTime = ((top3ForAnim.length -1) * 500) + 500; // Tempo até o último setTimeout disparar
                maxPodiumAnimationTime += 1500; // Duração da animação interna mais longa (ex: barra 1s + fade 0.5s)
            } else {
                maxPodiumAnimationTime = 500;
            }

        } else {
            //console.warn("animations.animatePodium não encontrada. Exibindo pódio sem animação.");
            const sortedByScore = [...players].sort((a, b) => b.score - a.score);
            const top3 = sortedByScore.slice(0, 3);

            this.removeConfetti();
            const podiumData = [
                { elLugar: this.podiumElements.lugar1, elNome: this.podiumElements.nome1, elPontos: this.podiumElements.pontos1, elBarra: this.podiumElements.barra1, elTextoBarra: this.podiumElements.textoBarra1, height: 200, color: 'gold', text: '1º'},
                { elLugar: this.podiumElements.lugar2, elNome: this.podiumElements.nome2, elPontos: this.podiumElements.pontos2, elBarra: this.podiumElements.barra2, elTextoBarra: this.podiumElements.textoBarra2, height: 150, color: 'silver', text: '2º'},
                { elLugar: this.podiumElements.lugar3, elNome: this.podiumElements.nome3, elPontos: this.podiumElements.pontos3, elBarra: this.podiumElements.barra3, elTextoBarra: this.podiumElements.textoBarra3, height: 100, color: '#CD7F32', text: '3º'}
            ];
            // Reset visual do pódio
            podiumData.forEach(p => {
                p.elLugar.classList.remove('visible');
                p.elBarra.style.height = '0px';
                p.elBarra.classList.remove('animated');
                p.elNome.textContent = '-';
                p.elPontos.textContent = '- PONTOS';
                if(p.elTextoBarra) p.elTextoBarra.textContent = '';
            });

                if (top3.length > 0) {
                    top3.forEach((player, index) => {
                        if (podiumData[index]) {
                            const pd = podiumData[index];
                            // O delay para este item do pódio começar a animar
                            const currentItemDelayStart = ((index * 500) + 500);
                            // A animação do .lugar (opacity/transform) tem 0.5s de delay + 0.5s de duração = 1s
                            // A animação da .barra-podium (height) tem 1s de duração.
                            // Então, a animação deste item termina em: currentItemDelayStart + 1000ms
                            const currentItemAnimationEnd = currentItemDelayStart + 1000;

                            if (currentItemAnimationEnd > maxPodiumAnimationTime) {
                                maxPodiumAnimationTime = currentItemAnimationEnd;
                            }

                            setTimeout(() => {
                                pd.elLugar.classList.add('visible');
                                pd.elNome.textContent = player.name;
                                pd.elPontos.textContent = `${player.score} PONTOS`;
                                pd.elBarra.style.height = `${pd.height}px`;
                                pd.elBarra.style.backgroundColor = pd.color;
                                if (pd.elTextoBarra) pd.elTextoBarra.textContent = pd.text;
                                pd.elBarra.classList.add('animated');

                                // Identifica o primeiro lugar para o confetti (assumindo que top3[0] é o 1º lugar)
                                // Se a ordem no array top3 for [1º, 2º, 3º], então index 0 é o primeiro.
                                // Se a ordem no HTML é 2º, 1º, 3º e podiumData reflete isso, precisa ajustar
                                // No seu HTML, o 1º lugar está no meio. `podiumData` está [1º, 2º, 3º].
                                // `top3` é [jogador1, jogador2, jogador3] ordenado por score.
                                // Então, `top3[0]` é o vencedor. `podiumData[0]` é o elemento do 1º lugar.
                                if (player === top3[0]) { // Verifica se é o jogador com maior pontuação
                                    this.triggerConfetti(this.podiumElements.barra1); // Dispara no elemento do 1º lugar
                                    if (typeof playSound === 'function') playSound('podium_win');
                                } else {
                                    if (typeof playSound === 'function') playSound('podium_place');
                                }
                            }, currentItemDelayStart);
                        }
                    });
                } else {
                    maxPodiumAnimationTime = 200; // Um pequeno delay se não houver pódio
                }
        }

        // --- Lógica para o Ranking Completo (A PARTIR DO 4º LUGAR) ---
        const corpoTabela = document.getElementById('corpo-tabela-ranking-completo');
        corpoTabela.innerHTML = '';

        const todosJogadoresOrdenados = [...players].sort((a, b) => b.score - a.score);
        const jogadoresParaTabela = todosJogadoresOrdenados.slice(3);

        if (jogadoresParaTabela.length > 0) {
            jogadoresParaTabela.forEach((player, relativeIndex) => {
                const tr = corpoTabela.insertRow();
                const tdPos = tr.insertCell();
                const tdNome = tr.insertCell();
                const tdPontos = tr.insertCell();

                tdPos.textContent = `${3 + relativeIndex + 1}º`;
                tdNome.innerHTML = `<span class="player-color-indicator" style="background-color: ${player.color}; display: inline-block; vertical-align: middle;"></span> ${player.name}`;
                tdPontos.textContent = player.score;
            });
        } else {
            const tr = corpoTabela.insertRow();
            const td = tr.insertCell();
            td.colSpan = 3;
            td.textContent = "Não há outros jogadores classificados.";
            td.style.textAlign = "center";
        }

        // Animar a tabela de ranking após a animação do pódio
        // Adicionar um pequeno buffer ao tempo máximo da animação do pódio
        const delayParaTabelaAparecer = maxPodiumAnimationTime + 200; // Adiciona 200ms de buffer

        setTimeout(() => {
            if (rankingContainer) {
                rankingContainer.classList.add('visible');
                // Opcional: tocar um som quando a tabela aparecer
                // if (typeof playSound === 'function') playSound('swoosh_sound', 0.4);
            }
        }, delayParaTabelaAparecer);
    },

    triggerConfetti() { // Removido parâmetro targetElement para simplificar, posiciona no centro
        this.removeConfetti();
        const podiumDiv = document.getElementById('podium');
        if (!podiumDiv) return;

        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        podiumDiv.appendChild(confettiContainer); // Adiciona ao pódio

        const colors = ['gold', 'yellow', '#FFD700', '#FFFACD', 'orange', 'white'];
        for (let i = 0; i < 150; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%'; // Posição horizontal aleatória
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 8 + 5; // Tamanho entre 5px e 13px
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            confetti.style.animationDelay = Math.random() * 0.8 + 's'; // Atraso aleatório para um efeito mais natural
            confetti.style.animationDuration = (Math.random() * 2 + 2.5) + 's'; // Duração variada da queda
            confettiContainer.appendChild(confetti);
        }
    },

    removeConfetti() {
        const existingConfetti = document.querySelector('.confetti-container');
        if (existingConfetti) {
            existingConfetti.remove();
        }
    }
};
