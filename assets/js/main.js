// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores de Elementos da UI ---
    const telaSplash = document.getElementById('tela-splash');
    const loadingStatus = document.getElementById('loading-status');
    const btnIniciarCadastroSplash = document.getElementById('btn-iniciar-cadastro');

    const btnAddJogador = document.getElementById('btn-add-jogador');
    const inputNomeJogador = document.getElementById('nome-jogador');
    const jogadoresUl = document.getElementById('jogadores-ul');
    const btnIrConfiguracao = document.getElementById('btn-ir-configuracao');

    const inputNumCasas = document.getElementById('num-casas');
    const inputNumCasasEspeciais = document.getElementById('num-casas-especiais');
    const inputNumCasasPerguntas = document.getElementById('num-casas-perguntas');

    // MODIFICADO/NOVO: Containers de Checkbox para filtros
    const checkboxContainerCategoria = document.getElementById('checkbox-container-categoria');
    const checkboxContainerAnoTurma = document.getElementById('checkbox-container-ano-turma'); // NOVO
    const checkboxContainerBimestre = document.getElementById('checkbox-container-bimestre'); // NOVO

    const selectDificuldadePergunta = document.getElementById('select-dificuldade-pergunta');
    const btnIniciarJogo = document.getElementById('btn-iniciar-jogo');

    const btnLancarDado = document.getElementById('btn-lancar-dado');
    const btnEncerrarJogoManual = document.getElementById('btn-encerrar-jogo-manual');
    const btnJogarNovamente = document.getElementById('btn-jogar-novamente');

    let tempPlayerNames = [];
    const MAX_PLAYERS = 40;
    let firstInteractionDone = false;
    let gameDataLoaded = false;
    let allRawQuestions = [];

    const chkCaixaAlta = document.getElementById('chk-caixa-alta');
    const chkPontuacaoNegativa = document.getElementById('chk-pontuacao-negativa');
    const inputTempoLancamentoDado = document.getElementById('tempo-lancamento-dado');

    function atualizarModoCaixaAlta(ativar) {
        if (ativar) {
            document.body.classList.add('texto-caixa-alta');
        } else {
            document.body.classList.remove('texto-caixa-alta');
        }
        localStorage.setItem('preferenciaCaixaAlta', ativar);
    }

    function exibirTelaCadastroInicial() {
        jogadoresUl.innerHTML = '';
        if (tempPlayerNames.length > 0) {
            tempPlayerNames.forEach((nome, index) => {
                const li = document.createElement('li');
                const playerColor = (typeof PLAYER_COLORS !== 'undefined' && PLAYER_COLORS.length > 0)
                ? PLAYER_COLORS[index % PLAYER_COLORS.length]
                : '#ccc';

                const colorIndicator = document.createElement('span');
                colorIndicator.className = 'player-color-indicator';
                colorIndicator.style.backgroundColor = playerColor;
                li.appendChild(colorIndicator);

                const nameSpan = document.createElement('span');
                nameSpan.className = 'player-name';
                nameSpan.textContent = nome;
                li.appendChild(nameSpan);

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'player-actions';

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Excluir';
                deleteButton.className = 'btn-delete-player';
                deleteButton.addEventListener('click', () => handleDeletePlayer(index));
                actionsDiv.appendChild(deleteButton);

                li.appendChild(actionsDiv);
                jogadoresUl.appendChild(li);
            });
            btnIrConfiguracao.disabled = false;
        } else {
            btnIrConfiguracao.disabled = true;
        }
        inputNomeJogador.focus();
    }

    function simularCarregamento() {
        let progresso = 0;
        const intervalo = setInterval(() => {
            progresso += 20;
            if (loadingStatus) {
                // loadingStatus.textContent = `Carregando... ${progresso}%`; // Opcional
            }
            if (progresso >= 100) {
                clearInterval(intervalo);
                if (loadingStatus) loadingStatus.textContent = "Preparando o universo do saber...";

                carregarDadosDoJogo().then(() => {
                    if (loadingStatus) loadingStatus.textContent = "Tudo pronto! Clique abaixo para começar sua aventura.";
                    const loaderElement = telaSplash.querySelector('.loader');
                    if (loaderElement) loaderElement.style.display = 'none';
                    if (btnIniciarCadastroSplash) btnIniciarCadastroSplash.style.display = 'inline-block';

                    if (btnIniciarCadastroSplash) {
                        btnIniciarCadastroSplash.onclick = () => {
                            handleFirstInteraction();
                            ui.switchScreen('tela-cadastro');
                            exibirTelaCadastroInicial();
                        };
                    }
                }).catch(error => {
                    console.error("Falha ao carregar dados do jogo na splash:", error);
                    if (loadingStatus) loadingStatus.textContent = "Erro ao carregar. Tente recarregar a página.";
                });
            }
        }, 300); // Reduzido tempo de simulação
    }

    function handleDeletePlayer(index) {
        if (confirm(`Tem certeza que deseja excluir o explorador "${tempPlayerNames[index]}"?`)) {
            tempPlayerNames.splice(index, 1);
            exibirTelaCadastroInicial();
        }
    }

    /**
     * Popula um container de checkboxes com itens e uma opção "Todos".
     * @param {HTMLElement} container - O elemento DOM que conterá os checkboxes.
     * @param {Set<string>} itemsSet - Um Set com os valores únicos para os checkboxes.
     * @param {string} groupName - Nome do grupo para IDs e classes (ex: 'categoria', 'ano-turma', 'bimestre').
     * @param {string} labelForAll - Texto para a opção "Todos" (ex: 'Todas as Categorias').
     */
    function popularCheckboxGroup(container, itemsSet, groupName, labelForAll) {
        if (!container) {
            console.error(`Container para checkboxes do grupo "${groupName}" não encontrado.`);
            return;
        }
        container.innerHTML = ''; // Limpa o container

        const itemsArray = Array.from(itemsSet).sort(); // Ordena os itens

        // Opção "Todos"
        const todasDiv = document.createElement('div');
        todasDiv.className = 'checkbox-item';
        const todasInput = document.createElement('input');
        todasInput.type = 'checkbox';
        todasInput.value = `todos_${groupName}`; // Valor único para "todos"
        todasInput.id = `chk-${groupName}-todos`;
        todasInput.checked = true; // "Todos" começa marcado
        const todasLabelForInput = document.createElement('label');
        todasLabelForInput.htmlFor = todasInput.id;
        todasLabelForInput.textContent = labelForAll;
        todasDiv.appendChild(todasInput);
        todasDiv.appendChild(todasLabelForInput);
        container.appendChild(todasDiv);

        // Checkboxes individuais
        itemsArray.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'checkbox-item';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.value = item;
            input.className = `${groupName}-checkbox`; // Classe para selecionar os individuais
            input.id = `chk-${groupName}-${index}`;
            input.disabled = true; // Começam desabilitados porque "Todos" está marcado
            const labelForInput = document.createElement('label');
            labelForInput.htmlFor = input.id;
            labelForInput.textContent = item;
            itemDiv.appendChild(input);
            itemDiv.appendChild(labelForInput);
            container.appendChild(itemDiv);
        });

        // Lógica para o checkbox "Todos"
        const checkboxTodos = todasInput;
        const outrosCheckboxes = container.querySelectorAll(`.${groupName}-checkbox`);

        checkboxTodos.addEventListener('change', function() {
            outrosCheckboxes.forEach(cb => {
                cb.checked = false;
                cb.disabled = this.checked;
            });
        });

        outrosCheckboxes.forEach(cb => {
            cb.addEventListener('change', function() {
                if (this.checked) {
                    checkboxTodos.checked = false;
                }
                // Se nenhum individual estiver marcado, marcar "Todos"? (Opcional, pode ser confuso)
                // const algumMarcado = Array.from(outrosCheckboxes).some(individualCb => individualCb.checked);
                // if (!algumMarcado) checkboxTodos.checked = true;
            });
        });
    }


    function popularFiltrosDePerguntas(questions) {
        if (!questions || questions.length === 0) {
            console.warn("Nenhuma pergunta fornecida para popular filtros.");
            // Limpar todos os containers de filtro
            [checkboxContainerCategoria, checkboxContainerAnoTurma, checkboxContainerBimestre].forEach(container => {
                if (container) container.innerHTML = '<p>Nenhum item disponível.</p>';
            });
                if (selectDificuldadePergunta) selectDificuldadePergunta.innerHTML = '<option value="todas">Nenhum nível</option>';
                return;
        }
        console.log("[Main.js] Primeira pergunta recebida em popularFiltros:", questions[0]); // DEBUG
        // Verifique se questions[0].bimestre existe e tem valor.

        const categoriasUnicas = new Set(questions.map(q => q.categoria).filter(Boolean));
        const dificuldadesUnicas = new Set(questions.map(q => q.dificuldade).filter(Boolean));
        const bimestresUnicos = new Set(questions.map(q => q.bimestre).filter(Boolean)); // NOVO

        const anosTurmasUnicosSet = new Set();
        questions.forEach(q => {
            if (q.ano_turma) {
                if (Array.isArray(q.ano_turma)) {
                    q.ano_turma.forEach(at => { if (at && String(at).trim()) anosTurmasUnicosSet.add(String(at).trim()); });
                } else if (String(q.ano_turma).trim()) {
                    anosTurmasUnicosSet.add(String(q.ano_turma).trim());
                }
            }
        });

        // Popular Categorias (Componentes)
        popularCheckboxGroup(checkboxContainerCategoria, categoriasUnicas, 'categoria', 'Todos os Componentes');

        // Popular Anos/Turmas (MODIFICADO para checkboxes)
        popularCheckboxGroup(checkboxContainerAnoTurma, anosTurmasUnicosSet, 'ano-turma', 'Todos os Anos/Turmas');

        // Popular Bimestres (NOVO)

        console.log("[Main.js] Bimestres Únicos encontrados para popular checkboxes:", bimestresUnicos); // DEBUG
        popularCheckboxGroup(checkboxContainerBimestre, bimestresUnicos, 'bimestre', 'Todos os Bimestres');


        // Popular select de Dificuldade (mantido como select)
        if (selectDificuldadePergunta) {
            selectDificuldadePergunta.innerHTML = '<option value="todas">Todos os Níveis</option>';
            dificuldadesUnicas.forEach(dif => {
                const option = document.createElement('option');
                option.value = dif;
                option.textContent = dif;
                selectDificuldadePergunta.appendChild(option);
            });
        } else {
            console.error("ERRO: Elemento 'select-dificuldade-pergunta' não encontrado.");
        }
    }

    async function carregarDadosDoJogo() {
        try {
            const [loadedQs, loadedActions] = await Promise.all([
                loadQuestions(),
                                                                game.loadSpecialActions()
            ]);

            if (loadedQs && loadedQs.length > 0 && loadedActions && loadedActions.length > 0) {
                allRawQuestions = loadedQs;
                gameDataLoaded = true;
                popularFiltrosDePerguntas(allRawQuestions);
                console.log("Dados do jogo (perguntas e ações) carregados com sucesso.");
            } else {
                // Mensagens de erro mais específicas já são tratadas dentro das funções de load
                gameDataLoaded = false;
            }
        } catch (error) {
            console.error("Erro crítico durante o carregamento dos dados do jogo:", error);
            alert("Falha crítica ao carregar dados do jogo. Verifique o console (F12) para detalhes e os arquivos JSON.");
            gameDataLoaded = false;
        }
    }

    function handleFirstInteraction() {
        if (!firstInteractionDone) {
            console.log("Primeira interação do usuário detectada.");
            if (typeof preloadSounds === 'function' && typeof SOUNDS_TO_PRELOAD !== 'undefined') {
                preloadSounds(SOUNDS_TO_PRELOAD);
            }
            if (typeof audioContext !== 'undefined' && audioContext && audioContext.state === 'suspended') {
                audioContext.resume().catch(e => console.error("Erro ao resumir AudioContext:", e));
            }
            firstInteractionDone = true;
            // Remover listeners após a primeira interação para não executar múltiplas vezes
            document.body.removeEventListener('click', handleFirstInteraction, true);
            document.body.removeEventListener('keydown', handleFirstInteraction, true);
        }
    }
    // Adicionar listeners para a primeira interação de forma passiva
    document.body.addEventListener('click', handleFirstInteraction, { once: true, capture: true });
    document.body.addEventListener('keydown', handleFirstInteraction, { once: true, capture: true });


    btnAddJogador.addEventListener('click', () => {
        // handleFirstInteraction(); // Já será chamado pelo listener global
        const nome = inputNomeJogador.value.trim();
        if (nome && tempPlayerNames.length < MAX_PLAYERS) {
            const nomeExistente = tempPlayerNames.some(playerName => playerName.toLowerCase() === nome.toLowerCase());
            if (nomeExistente) {
                alert("Este nome de explorador já foi adicionado. Por favor, escolha outro.");
            } else {
                tempPlayerNames.push(nome);
                exibirTelaCadastroInicial();
                inputNomeJogador.value = '';
            }
        } else if (tempPlayerNames.length >= MAX_PLAYERS) {
            alert(`Máximo de ${MAX_PLAYERS} exploradores atingido!`);
        } else if (!nome) {
            alert("Favor inserir um nome para o explorador.");
        }
        inputNomeJogador.focus();
    });

    inputNomeJogador.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            btnAddJogador.click();
        }
    });

    btnIrConfiguracao.addEventListener('click', () => {
        // handleFirstInteraction(); // Já será chamado pelo listener global
        if (tempPlayerNames.length > 0) {
            if (gameDataLoaded) {
                ui.switchScreen('tela-configuracao');
            } else {
                alert("Os dados do jogo ainda estão carregando ou falharam ao carregar. Por favor, aguarde ou recarregue a página.");
            }
        } else {
            alert("Adicione ao menos um explorador para continuar.");
        }
    });

    if (chkCaixaAlta) {
        chkCaixaAlta.addEventListener('change', function() {
            atualizarModoCaixaAlta(this.checked);
        });
    }

    /**
     * Coleta os valores selecionados de um grupo de checkboxes.
     * @param {HTMLElement} container - O container dos checkboxes.
     * @param {string} groupName - O nome do grupo (usado na classe dos checkboxes e no ID do "Todos").
     * @returns {Array<string>} Um array com os valores selecionados, ou um array com o valor "todos" se for o caso.
     */
    function getSelectedCheckboxValues(container, groupName) {
        const selecionados = [];
        if (!container) return ['todos']; // Fallback

        const checkboxTodos = container.querySelector(`#chk-${groupName}-todos`);
        if (checkboxTodos && checkboxTodos.checked) {
            return [`todos_${groupName}`]; // Retorna o valor especial "todos"
        }

        const checkboxesIndividuais = container.querySelectorAll(`input[type="checkbox"].${groupName}-checkbox:checked`);
        checkboxesIndividuais.forEach(cb => selecionados.push(cb.value));

        if (selecionados.length === 0 && checkboxTodos) { // Se nada selecionado e "todos" existe, implica "todos"
            checkboxTodos.checked = true; // Garante que "todos" fique marcado
            const outrosCheckboxes = container.querySelectorAll(`.${groupName}-checkbox`);
            outrosCheckboxes.forEach(cb => cb.disabled = true);
            return [`todos_${groupName}`];
        }
        return selecionados;
    }


    btnIniciarJogo.addEventListener('click', async () => {
        // handleFirstInteraction(); // Já será chamado pelo listener global
        if (!gameDataLoaded) {
            alert("Os dados do jogo não foram carregados. Tente recarregar a página ou verifique o console (F12).");
            return;
        }
        if (allRawQuestions.length === 0) {
            alert("Nenhuma pergunta foi carregada. O jogo não pode iniciar sem perguntas. Verifique o arquivo 'perguntas.json'.");
            return;
        }

        const numCasasValue = parseInt(inputNumCasas.value, 10);
        const configCasasEspeciaisValue = inputNumCasasEspeciais.value.trim();
        const configCasasPerguntasValue = inputNumCasasPerguntas.value.trim();

        // Coletar valores dos filtros de checkbox
        const categoriasSelecionadas = getSelectedCheckboxValues(checkboxContainerCategoria, 'categoria');
        const anosTurmasSelecionados = getSelectedCheckboxValues(checkboxContainerAnoTurma, 'ano-turma');
        const bimestresSelecionados = getSelectedCheckboxValues(checkboxContainerBimestre, 'bimestre');

        const dificuldadeSelecionadaValue = selectDificuldadePergunta ? selectDificuldadePergunta.value : 'todas';
        const permitePontuacaoNegativa = chkPontuacaoNegativa.checked;
        const tempoLancamentoDadoSegundos = parseInt(inputTempoLancamentoDado.value, 10);

        if (numCasasValue >= 10 && numCasasValue <= 100) {
            if (isNaN(tempoLancamentoDadoSegundos) || tempoLancamentoDadoSegundos < 5 || tempoLancamentoDadoSegundos > 60) {
                alert("O tempo para lançamento do dado deve ser um número entre 5 e 60 segundos.");
                inputTempoLancamentoDado.focus();
                return;
            }

            // Validação se algum filtro obrigatório não retornou nada (e não era pra ser "todos")
            if (categoriasSelecionadas.length === 0 && !categoriasSelecionadas.includes('todos_categoria')) {
                alert("Por favor, selecione ao menos um Componente Curricular ou marque 'Todos os Componentes'."); return;
            }
            if (anosTurmasSelecionados.length === 0 && !anosTurmasSelecionados.includes('todos_ano-turma')) {
                alert("Por favor, selecione ao menos um Ano/Turma ou marque 'Todos os Anos/Turmas'."); return;
            }
            if (bimestresSelecionados.length === 0 && !bimestresSelecionados.includes('todos_bimestre')) {
                console.error("[Main.js] Validação falhou: Nenhum bimestre selecionado e 'todos_bimestre' não está na lista."); // DEBUG
                alert("Por favor, selecione ao menos um Bimestre ou marque 'Todos os Bimestres'."); return;
            }


            btnIniciarJogo.disabled = true;
            try {
                await game.setupGame(
                    tempPlayerNames,
                    numCasasValue,
                    configCasasEspeciaisValue,
                    configCasasPerguntasValue,
                    categoriasSelecionadas,
                    dificuldadeSelecionadaValue,
                    allRawQuestions,
                    permitePontuacaoNegativa,
                    tempoLancamentoDadoSegundos,
                    anosTurmasSelecionados, // Passar o array
                    bimestresSelecionados  // Passar o array
                );
            } catch (error) {
                console.error("Erro detalhado durante a configuração do jogo:", error);
                alert(`Ocorreu um erro ao iniciar o jogo: ${error.message}. Verifique o console (F12) para mais detalhes.`);
            } finally {
                btnIniciarJogo.disabled = false;
            }
        } else {
            alert("Número de casas do tabuleiro inválido. Deve ser entre 10 e 100.");
        }
    });

    if (btnLancarDado) {
        btnLancarDado.addEventListener('click', () => {
            // handleFirstInteraction(); // Já será chamado pelo listener global
            game.rollDice();
        });
    }

    btnJogarNovamente.addEventListener('click', () => {
        // handleFirstInteraction(); // Já será chamado pelo listener global
        game.resetGame();
        ui.switchScreen('tela-cadastro');
        exibirTelaCadastroInicial(); // Mostra jogadores anteriores se houver
        // Repopular filtros pode ser necessário se `allRawQuestions` ainda estiver disponível
        if(allRawQuestions.length > 0) {
            popularFiltrosDePerguntas(allRawQuestions);
        } else {
            console.warn("Tentando jogar novamente, mas as perguntas brutas não estão carregadas. Os filtros podem não ser populados.");
            // Poderia tentar recarregar os dados aqui se `gameDataLoaded` for false.
        }
    });

    if (btnEncerrarJogoManual) {
        btnEncerrarJogoManual.addEventListener('click', () => {
            if (confirm("Deseja realmente encerrar a expedição atual?")) {
                if (game && typeof game.endGameManually === 'function') {
                    game.endGameManually();
                }
            }
        });
    }

    // --- Inicialização do Aplicativo ---
    if (telaSplash.classList.contains('ativa')) {
        simularCarregamento();
    }

    const preferenciaSalva = localStorage.getItem('preferenciaCaixaAlta');
    if (preferenciaSalva !== null) {
        const ativar = preferenciaSalva === 'true';
        if(chkCaixaAlta) chkCaixaAlta.checked = ativar;
        atualizarModoCaixaAlta(ativar);
    }
});
