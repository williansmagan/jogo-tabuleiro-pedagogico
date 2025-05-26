// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores de Elementos da UI ---
    const telaSplash = document.getElementById('tela-splash');
    const loadingStatus = document.getElementById('loading-status');
    
    // Simulação de carregamento para o botão "Começar Aventura"
    const btnIniciarCadastro = document.getElementById('btn-iniciar-cadastro');
    setTimeout(() => {
        document.querySelector('#tela-splash .loader-container').style.display = 'none';
        btnIniciarCadastro.style.display = 'block'; // Torna o botão visível
    }, 2000); // Simula 2 segundos de carregamento

    btnIniciarCadastro.addEventListener('click', () => {
        mostrarTela('tela-cadastro'); // Ou a próxima tela
    });

    const btnAddJogador = document.getElementById('btn-add-jogador');
    const inputNomeJogador = document.getElementById('nome-jogador');
    const jogadoresUl = document.getElementById('jogadores-ul');
    const btnIrConfiguracao = document.getElementById('btn-ir-configuracao');

    const inputNumCasas = document.getElementById('num-casas');
    const inputNumCasasEspeciais = document.getElementById('num-casas-especiais');
    const inputNumCasasPerguntas = document.getElementById('num-casas-perguntas');

    const checkboxContainerComponente = document.getElementById('checkbox-container-componente');
    const checkboxContainerConteudo = document.getElementById('checkbox-container-conteudo');
    const checkboxContainerAnoTurma = document.getElementById('checkbox-container-ano-turma');
    const checkboxContainerBimestre = document.getElementById('checkbox-container-bimestre');

    const selectDificuldadePergunta = document.getElementById('select-dificuldade-pergunta');
    const btnIniciarJogo = document.getElementById('btn-iniciar-jogo');

    const btnLancarDado = document.getElementById('btn-lancar-dado');
    const btnEncerrarJogoManual = document.getElementById('btn-encerrar-jogo-manual');
    const btnJogarNovamente = document.getElementById('btn-jogar-novamente');

    // Seletores para os novos inputs de pontuação (se forem fixos)
    const inputPontosFacil = document.getElementById('pontos-facil');
    const inputPontosMedio = document.getElementById('pontos-medio');
    const inputPontosDificil = document.getElementById('pontos-dificil');

    // --- Variáveis de Estado ---
    let tempPlayerNames = []; // Ajuste para tempPlayersData se estiver usando avatares
    const MAX_PLAYERS = 40;
    let firstInteractionDone = false;
    let gameDataLoaded = false;
    let allRawQuestions = [];

    const chkCaixaAlta = document.getElementById('chk-caixa-alta');
    const chkPontuacaoNegativa = document.getElementById('chk-pontuacao-negativa');
    const inputTempoLancamentoDado = document.getElementById('tempo-lancamento-dado');

    // Exibe a tela de splash
    mostrarTela('tela-splash');

    // Função para mostrar uma tela específica
    function mostrarTela(idTelaAlvo) {
        const todasAsTelas = document.querySelectorAll('body > div[id^="tela-"]'); // Seleciona divs que são telas
        const htmlEl = document.documentElement;
        const bodyEl = document.body;

        todasAsTelas.forEach(tela => {
            if (tela.id === idTelaAlvo) {
                tela.classList.add('ativa');
                if (idTelaAlvo === 'tela-splash') {
                    htmlEl.classList.add('splash-ativo');
                    bodyEl.classList.add('splash-ativo');
                } else {
                    // Garante que se não for splash, as classes são removidas
                    htmlEl.classList.remove('splash-ativo');
                    bodyEl.classList.remove('splash-ativo');
                }
            } else {
                tela.classList.remove('ativa');
            }
        });
    }


    // Quando for esconder a tela de splash e mostrar a próxima tela (ex: cadastro)
    function esconderTelaSplash() {
        document.documentElement.classList.remove('splash-ativo');
        document.body.classList.remove('splash-ativo');
        // seu código para esconder #tela-splash (remover classe 'ativa')
        document.getElementById('tela-splash').classList.remove('ativa');
        // mostrar próxima tela
        // document.getElementById('tela-cadastro').classList.add('ativa');
    }


    // --- Funções Auxiliares ---
    function atualizarModoCaixaAlta(ativar) {
        document.body.classList.toggle('texto-caixa-alta', ativar);
        localStorage.setItem('preferenciaCaixaAlta', ativar);
    }

    function exibirTelaCadastroInicial() {
        jogadoresUl.innerHTML = '';
        // Se estiver usando tempPlayersData com avatares, ajuste esta lógica
        // Por enquanto, usando tempPlayerNames
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
        inputNomeJogador.value = '';
        inputNomeJogador.focus();
    }


    function simularCarregamento() {
        let progresso = 0;
        const intervalo = setInterval(() => {
            progresso += 20;
            if (progresso >= 100) {
                clearInterval(intervalo);
                if (loadingStatus) loadingStatus.textContent = "Preparando o universo do saber...";
                carregarDadosDoJogo().then(() => {
                    if (loadingStatus) loadingStatus.textContent = "Tudo pronto! Clique abaixo para começar sua aventura.";
                    const loaderElement = telaSplash.querySelector('.loader');
                    if (loaderElement) loaderElement.style.display = 'none';
                    if (btnIniciarCadastro) btnIniciarCadastro.style.display = 'inline-block';
                    if (btnIniciarCadastro) { // Adicionado if para segurança
                        btnIniciarCadastro.onclick = () => {
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
        }, 300);
    }

    function handleDeletePlayer(index) {
        const playerNameToDelete = tempPlayerNames[index]; // Ajustar se usar tempPlayersData
        if (confirm(`Tem certeza que deseja excluir o explorador "${playerNameToDelete}"?`)) {
            tempPlayerNames.splice(index, 1); // Ajustar se usar tempPlayersData
            exibirTelaCadastroInicial();
        }
    }

    function popularCheckboxGroup(container, itemsSet, groupName, labelForAll) {
        if (!container) {
            console.error(`[popularCheckboxGroup] Container para grupo "${groupName}" não encontrado.`);
            return;
        }
        container.innerHTML = '';
        const itemsArray = Array.from(itemsSet).sort();

        const todasDiv = document.createElement('div');
        todasDiv.className = 'checkbox-item';
        const todasInput = document.createElement('input');
        todasInput.type = 'checkbox';
        todasInput.value = `todos_${groupName}`;
        todasInput.id = `chk-${groupName}-todos`;
        todasInput.checked = true;
        const todasLabel = document.createElement('label');
        todasLabel.htmlFor = todasInput.id;
        todasLabel.textContent = labelForAll;
        todasDiv.appendChild(todasInput);
        todasDiv.appendChild(todasLabel);
        container.appendChild(todasDiv);

        itemsArray.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'checkbox-item';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.value = item;
            input.className = `${groupName}-checkbox`;
            input.id = `chk-${groupName}-${index}`;
            input.disabled = true;
            const label = document.createElement('label');
            label.htmlFor = input.id;
            label.textContent = item;
            itemDiv.appendChild(input);
            itemDiv.appendChild(label);
            container.appendChild(itemDiv);
        });

        const checkboxTodos = todasInput;
        const outrosCheckboxes = Array.from(container.querySelectorAll(`.${groupName}-checkbox`));

        checkboxTodos.addEventListener('change', function() {
            // console.log(`[${groupName}] Checkbox 'Todos' mudou. Checked: ${this.checked}`);
            outrosCheckboxes.forEach(cb => {
                cb.checked = false;
                cb.disabled = this.checked;
            });
        });

        outrosCheckboxes.forEach(cb => {
            cb.addEventListener('change', function() {
                // console.log(`[${groupName}] Checkbox individual '${this.value}' mudou. Checked: ${this.checked}`);
                if (this.checked) {
                    checkboxTodos.checked = false;
                    outrosCheckboxes.forEach(oCb => oCb.disabled = false);
                } else {
                    const algumOutroMarcado = outrosCheckboxes.some(individualCb => individualCb.checked);
                    if (!algumOutroMarcado) {
                        checkboxTodos.checked = true;
                        outrosCheckboxes.forEach(oCb => {
                            oCb.checked = false;
                            oCb.disabled = true;
                        });
                        // console.log(`[${groupName}] Nenhum individual marcado, 'Todos' re-selecionado.`);
                    }
                }
            });
        });
    }

    function atualizarFiltroDeConteudo() {
        // console.log("[atualizarFiltroDeConteudo] Iniciando atualização.");
        if (!allRawQuestions || allRawQuestions.length === 0) {
            popularCheckboxGroup(checkboxContainerConteudo, new Set(), 'conteudo', 'Todos os Conteúdos/Tópicos');
            return;
        }

        const componentesSelecionados = getSelectedCheckboxValues(checkboxContainerComponente, 'componente');
        const anosTurmasSelecionados = getSelectedCheckboxValues(checkboxContainerAnoTurma, 'ano-turma');
        const bimestresSelecionados = getSelectedCheckboxValues(checkboxContainerBimestre, 'bimestre');
        // console.log(`[atualizarFiltroDeConteudo] Filtros: Comp=${componentesSelecionados}, Ano=${anosTurmasSelecionados}, Bim=${bimestresSelecionados}`);

        let perguntasRelevantes = [...allRawQuestions];
        if (!componentesSelecionados.includes('todos_componente') && componentesSelecionados.length > 0) {
            perguntasRelevantes = perguntasRelevantes.filter(q => q.componente_curricular && componentesSelecionados.includes(q.componente_curricular));
        }
        if (!anosTurmasSelecionados.includes('todos_ano-turma') && anosTurmasSelecionados.length > 0) {
            perguntasRelevantes = perguntasRelevantes.filter(q => {
                if (!q.ano_turma) return false;
                const anosDaPergunta = Array.isArray(q.ano_turma) ? q.ano_turma : [q.ano_turma];
                return anosDaPergunta.some(at => anosTurmasSelecionados.includes(String(at)));
            });
        }
        if (!bimestresSelecionados.includes('todos_bimestre') && bimestresSelecionados.length > 0) {
            perguntasRelevantes = perguntasRelevantes.filter(q => q.bimestre && bimestresSelecionados.includes(q.bimestre));
        }

        const conteudosUnicosFiltrados = new Set(perguntasRelevantes.map(q => q.categoria).filter(Boolean));
        // console.log("[atualizarFiltroDeConteudo] Conteúdos para repopular:", conteudosUnicosFiltrados);
        popularCheckboxGroup(checkboxContainerConteudo, conteudosUnicosFiltrados, 'conteudo', 'Todos os Conteúdos/Tópicos');
    }

    function popularFiltrosDePerguntas(questions) {
        if (!questions || questions.length === 0) { /* ... fallback ... */ return; }
        // console.log("[Main.js] Primeira pergunta em popularFiltrosDePerguntas:", questions[0]);

        const componentesUnicos = new Set(questions.map(q => q.componente_curricular).filter(Boolean));
        const dificuldadesUnicas = new Set(questions.map(q => q.dificuldade).filter(Boolean));
        const bimestresUnicos = new Set(questions.map(q => q.bimestre).filter(Boolean));
        const anosTurmasUnicosSet = new Set();
        questions.forEach(q => {
            if (q.ano_turma) {
                if (Array.isArray(q.ano_turma)) q.ano_turma.forEach(at => { if (at && String(at).trim()) anosTurmasUnicosSet.add(String(at).trim()); });
                else if (String(q.ano_turma).trim()) anosTurmasUnicosSet.add(String(q.ano_turma).trim());
            }
        });

        const addChangeListenerToContainer = (container, groupName) => { // Adicionado groupName para log
            if (container) {
                container.addEventListener('change', (event) => {
                    if (event.target.type === 'checkbox') {
                        // console.log(`Filtro no container '${groupName}' mudou. Disparando atualização de conteúdo.`);
                        atualizarFiltroDeConteudo();
                    }
                });
            }
        };

        popularCheckboxGroup(checkboxContainerComponente, componentesUnicos, 'componente', 'Todos os Componentes');
        addChangeListenerToContainer(checkboxContainerComponente, 'componente');

        popularCheckboxGroup(checkboxContainerAnoTurma, anosTurmasUnicosSet, 'ano-turma', 'Todos os Anos/Turmas');
        addChangeListenerToContainer(checkboxContainerAnoTurma, 'ano-turma');

        popularCheckboxGroup(checkboxContainerBimestre, bimestresUnicos, 'bimestre', 'Todos os Bimestres');
        addChangeListenerToContainer(checkboxContainerBimestre, 'bimestre');

        atualizarFiltroDeConteudo();

        if (selectDificuldadePergunta) {
            selectDificuldadePergunta.innerHTML = '<option value="todas">Todos os Níveis</option>';
            dificuldadesUnicas.forEach(dif => {
                const option = document.createElement('option'); option.value = dif; option.textContent = dif;
                selectDificuldadePergunta.appendChild(option);
            });
            // selectDificuldadePergunta.addEventListener('change', atualizarFiltroDeConteudo); // Descomente se dificuldade deve filtrar conteúdo
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
                gameDataLoaded = false;
                console.error("Falha ao carregar dados do jogo: Perguntas ou Ações não carregadas.");
            }
        } catch (error) {
            console.error("Erro crítico durante o carregamento dos dados do jogo:", error);
            gameDataLoaded = false;
            throw error;
        }
    }

    function handleFirstInteraction() {
        if (!firstInteractionDone) {
            console.log("Primeira interação do usuário detectada.");
            if (typeof preloadSounds === 'function' && typeof SOUNDS_TO_PRELOAD !== 'undefined') {
                preloadSounds(SOUNDS_TO_PRELOAD);
            }
            // if (typeof audioContext !== 'undefined' && audioContext && audioContext.state === 'suspended') {
            //     audioContext.resume().catch(e => console.error("Erro ao resumir AudioContext:", e));
            // } // Descomente se estiver usando AudioContext
            firstInteractionDone = true;
            document.body.removeEventListener('click', handleFirstInteraction, true);
            document.body.removeEventListener('keydown', handleFirstInteraction, true);
        }
    }
    document.body.addEventListener('click', handleFirstInteraction, { once: true, capture: true });
    document.body.addEventListener('keydown', handleFirstInteraction, { once: true, capture: true });

    // --- Event Listeners Principais ---
    btnAddJogador.addEventListener('click', () => {
        const nome = inputNomeJogador.value.trim();
        if (nome && tempPlayerNames.length < MAX_PLAYERS) { // Ajustar para tempPlayersData se usar avatares
            const nomeExistente = tempPlayerNames.some(playerName => playerName.toLowerCase() === nome.toLowerCase()); // Ajustar
            if (nomeExistente) {
                alert("Este nome de explorador já foi adicionado.");
            } else {
                tempPlayerNames.push(nome); // Ajustar
                exibirTelaCadastroInicial();
            }
        } else if (!nome) {
            alert("Favor inserir um nome para o explorador.");
            inputNomeJogador.focus();
        } else {
             alert(`Máximo de ${MAX_PLAYERS} exploradores atingido!`);
        }
    });

    inputNomeJogador.addEventListener('keypress', (e) => { if (e.key === 'Enter') btnAddJogador.click(); });

    // LÓGICA COMPLETA PARA btnIrConfiguracao
    btnIrConfiguracao.addEventListener('click', () => {
        console.log("[btnIrConfiguracao] Click detectado.");
        // handleFirstInteraction(); // Já deve ter ocorrido

        // Ajuste aqui para tempPlayersData se você estiver usando o array de objetos para avatares
        const playersExist = Array.isArray(tempPlayerNames) ? tempPlayerNames.length > 0 : false;

        if (playersExist) {
            console.log("[btnIrConfiguracao] Jogadores existem.");
            if (gameDataLoaded) {
                console.log("[btnIrConfiguracao] Dados do jogo carregados. Mudando para tela-configuracao.");
                ui.switchScreen('tela-configuracao');
            } else {
                console.log("[btnIrConfiguracao] Dados do jogo NÃO carregados.");
                alert("Os dados do jogo ainda estão carregando ou falharam ao carregar. Por favor, aguarde ou recarregue a página.");
            }
        } else {
            console.log("[btnIrConfiguracao] Nenhum jogador adicionado.");
            alert("Adicione ao menos um explorador para continuar.");
        }
    });

    if (chkCaixaAlta) chkCaixaAlta.addEventListener('change', function() { atualizarModoCaixaAlta(this.checked); });

    function getSelectedCheckboxValues(container, groupName) {
        const selecionados = [];
        if (!container) {
            // console.warn(`[getSelectedCheckboxValues] Container para "${groupName}" não encontrado. Assumindo 'todos'.`);
            return [`todos_${groupName}`];
        }
        const checkboxTodos = container.querySelector(`#chk-${groupName}-todos`);
        if (checkboxTodos && checkboxTodos.checked) {
            return [`todos_${groupName}`];
        }
        const checkboxesIndividuais = container.querySelectorAll(`input[type="checkbox"].${groupName}-checkbox:checked`);
        checkboxesIndividuais.forEach(cb => selecionados.push(cb.value));

        if (selecionados.length === 0 && checkboxTodos && !checkboxTodos.checked) {
            return []; // Nada selecionado explicitamente
        }
        if (selecionados.length === 0 && checkboxTodos) { // Se "Todos" existe e nada foi selecionado, volta para "Todos"
            checkboxTodos.checked = true;
            const outrosCheckboxes = container.querySelectorAll(`.${groupName}-checkbox`);
            outrosCheckboxes.forEach(cb => { cb.checked = false; cb.disabled = true; });
            return [`todos_${groupName}`];
        }
        return selecionados;
    }

    btnIniciarJogo.addEventListener('click', async () => {
        if (!gameDataLoaded) { alert("Dados do jogo não carregados."); return; }
        if (allRawQuestions.length === 0) { alert("Nenhuma pergunta carregada."); return; }

        const numCasasValue = parseInt(inputNumCasas.value, 10);
        const configCasasEspeciaisValue = inputNumCasasEspeciais.value.trim();
        const configCasasPerguntasValue = inputNumCasasPerguntas.value.trim();

        const componentesSelecionados = getSelectedCheckboxValues(checkboxContainerComponente, 'componente');
        const conteudosSelecionados = getSelectedCheckboxValues(checkboxContainerConteudo, 'conteudo');
        const anosTurmasSelecionados = getSelectedCheckboxValues(checkboxContainerAnoTurma, 'ano-turma');
        const bimestresSelecionados = getSelectedCheckboxValues(checkboxContainerBimestre, 'bimestre');

        const dificuldadeSelecionadaValue = selectDificuldadePergunta ? selectDificuldadePergunta.value : 'todas';
        const permitePontuacaoNegativa = chkPontuacaoNegativa.checked;
        const tempoLancamentoDadoSegundos = parseInt(inputTempoLancamentoDado.value, 10);

        // NOVO: Coletar configurações de pontuação
        const pontuacaoPorDificuldade = {
            // As chaves aqui (ex: 'Fácil') DEVEM CORRESPONDER EXATAMENTE
            // aos valores de 'dificuldade' no seu perguntas.json
            'Fácil': parseInt(inputPontosFacil.value, 10) || 10, // Fallback para 10 se inválido
            'Médio': parseInt(inputPontosMedio.value, 10) || 15, // Fallback para 15
            'Difícil': parseInt(inputPontosDificil.value, 10) || 20, // Fallback para 20
            // Adicione outros níveis se necessário
        };
        console.log("[Main.js] Configuração de Pontuação por Dificuldade:", pontuacaoPorDificuldade);

        if (numCasasValue < 10 || numCasasValue > 100) { alert("Número de casas inválido."); return; }
        if (isNaN(tempoLancamentoDadoSegundos) || tempoLancamentoDadoSegundos < 5 || tempoLancamentoDadoSegundos > 60) {
            alert("Tempo para dado inválido."); inputTempoLancamentoDado.focus(); return;
        }

        if (componentesSelecionados.length === 0) { alert("Selecione Componente(s)."); return; }
        if (conteudosSelecionados.length === 0) { alert("Selecione Conteúdo(s)."); return; }
        if (anosTurmasSelecionados.length === 0) { alert("Selecione Ano(s)/Turma(s)."); return; }
        if (bimestresSelecionados.length === 0) { alert("Selecione Bimestre(s)."); return; }

        btnIniciarJogo.disabled = true;
        try {
            await game.setupGame(
                tempPlayerNames, // ou tempPlayersData
                numCasasValue,
                configCasasEspeciaisValue,
                configCasasPerguntasValue,
                componentesSelecionados,
                conteudosSelecionados,
                dificuldadeSelecionadaValue,
                allRawQuestions,
                permitePontuacaoNegativa,
                tempoLancamentoDadoSegundos,
                anosTurmasSelecionados,
                bimestresSelecionados,
                pontuacaoPorDificuldade // NOVO PARÂMETRO
            );
        } catch (error) {
            console.error("Erro detalhado durante a configuração do jogo:", error);
            alert(`Ocorreu um erro ao iniciar o jogo: ${error.message}. Verifique o console.`);
        } finally {
            btnIniciarJogo.disabled = false;
        }
    });

    if (btnLancarDado) btnLancarDado.addEventListener('click', () => game.rollDice());
    if (btnJogarNovamente) btnJogarNovamente.addEventListener('click', () => {
        game.resetGame();
        ui.switchScreen('tela-cadastro');
        exibirTelaCadastroInicial();
        if (allRawQuestions.length > 0) popularFiltrosDePerguntas(allRawQuestions);
        else console.warn("Dados de perguntas não disponíveis para repopular filtros em Novo Jogo.");
    });
    if (btnEncerrarJogoManual) btnEncerrarJogoManual.addEventListener('click', () => {
        if (confirm("Deseja realmente encerrar a expedição atual?")) {
            if (game && typeof game.endGameManually === 'function') game.endGameManually();
        }
    });

    // --- Inicialização ---
    if (telaSplash.classList.contains('ativa')) {
        simularCarregamento();
    }
    const preferenciaSalva = localStorage.getItem('preferenciaCaixaAlta');
    if (preferenciaSalva !== null) {
        const ativar = preferenciaSalva === 'true';
        if (chkCaixaAlta) chkCaixaAlta.checked = ativar;
        atualizarModoCaixaAlta(ativar);
    }


});