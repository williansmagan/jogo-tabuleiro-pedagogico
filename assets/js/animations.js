// js/animations.js

const animations = {
    animatePlayerMove(player, steps, totalCasas, gameLogicInstance, uiInstance) {
        const startPosition = player.position; // Posição lógica inicial do jogador
        let currentStep = 0;
        let visualPosition = startPosition; // Posição visual durante a animação

        const btnLancarDado = document.getElementById('btn-lancar-dado');
        if (btnLancarDado) btnLancarDado.disabled = true;

        return new Promise((resolve) => {
            const moveInterval = setInterval(() => {
                if (currentStep < steps) {
                    const oldVisualForStep = visualPosition;
                    visualPosition++;

                    // A posição visual não deve exceder a última casa numerada durante os passos intermediários
                    // A lógica de ir para o FIM é tratada após todos os steps.
                    if (visualPosition > totalCasas && (startPosition + currentStep + 1) <= totalCasas ) { // Correção aqui
                        visualPosition = totalCasas;
                    }
                    // Se o movimento real for para o FIM, a visualPosition pode ir até totalCasas + 1
                    else if ( (startPosition + currentStep + 1) > totalCasas && visualPosition > totalCasas + 1) {
                        visualPosition = totalCasas + 1;
                    }


                    uiInstance.movePawnStep(player, visualPosition, oldVisualForStep);
                    currentStep++;
                } else {
                    clearInterval(moveInterval);
                    // Movimento lógico final APÓS a animação ter mostrado os passos
                    player.moveTo(startPosition + steps, totalCasas); // Atualiza player.position e player.isFinished

                    // AGORA, atualiza o peão visual para a posição final LÓGICA do jogador
                    // oldPosition aqui é a startPosition original, ANTES do movimento lógico final.
                    // Precisamos garantir que o peão seja desenhado na player.position CORRETA.
                    uiInstance.updatePlayerPawn(player, startPosition); // Passa a posição ANTES do movimento lógico

                    uiInstance.updateRanking(gameLogicInstance.players, gameLogicInstance.getCurrentPlayer().id);
                    resolve();
                }
            }, 250);
        });
    },

    animatePodium(players, podiumElements, uiInstance) {
        const sortedByScore = [...players].sort((a, b) => b.score - a.score);
        const top3 = sortedByScore.slice(0, 3);

        const podiumConfig = [ // Ordem no HTML é 2º, 1º, 3º. podiumElements reflete isso.
        // Mas aqui vamos mapear pelo ranking: 1º, 2º, 3º
        { elLugar: podiumElements.lugar1, elAvatar: podiumElements.avatar1, elBarra: podiumElements.barra1, elNome: podiumElements.nome1, elPontos: podiumElements.pontos1, elTextoBarra: podiumElements.textoBarra1, height: 220, text: '1º', delay: 0.5 }, // Campeão
        { elLugar: podiumElements.lugar2, elAvatar: podiumElements.avatar2, elBarra: podiumElements.barra2, elNome: podiumElements.nome2, elPontos: podiumElements.pontos2, elTextoBarra: podiumElements.textoBarra2, height: 170, text: '2º', delay: 0 },    // Vice
        { elLugar: podiumElements.lugar3, elAvatar: podiumElements.avatar3, elBarra: podiumElements.barra3, elNome: podiumElements.nome3, elPontos: podiumElements.pontos3, elTextoBarra: podiumElements.textoBarra3, height: 120, text: '3º', delay: 0.2 }  // Terceiro
        ];

        podiumConfig.forEach(p => {
            p.elLugar.classList.remove('visible');
            p.elBarra.style.height = '0px';
            p.elBarra.classList.remove('animated');
            // A cor da barra é definida no CSS, não precisa resetar aqui.
            if(p.elAvatar) p.elAvatar.style.backgroundColor = 'var(--cor-borda)';
            p.elNome.textContent = '-';
            p.elPontos.textContent = '- pts';
            if (p.elTextoBarra) p.elTextoBarra.textContent = '';
        });
            uiInstance.removeConfetti();

            top3.forEach((player, index) => {
                if (podiumConfig[index]) {
                    const pd = podiumConfig[index];
                    setTimeout(() => {
                        // pd.elBarra.style.backgroundColor = pd.color; // Cor já está no CSS
                        pd.elBarra.style.height = `${pd.height}px`;
                        if (pd.elTextoBarra) pd.elTextoBarra.textContent = pd.text;
                        pd.elBarra.classList.add('animated');

                        setTimeout(() => {
                            if (pd.elAvatar) pd.elAvatar.style.backgroundColor = player.color;
                            pd.elNome.textContent = player.name;
                            pd.elPontos.textContent = `${player.score} pts`;
                            pd.elLugar.classList.add('visible');

                            if (index === 0) { // Campeão
                                uiInstance.triggerConfetti(); // Confetti no centro
                                if (typeof playSound === 'function') playSound('podium_win');
                            } else {
                                if (typeof playSound === 'function') playSound('podium_place');
                            }
                        }, 1000);
                    }, pd.delay * 1000);
                }
            });
    },

    animateDiceRoll(uiInstance, finalRoll, callback) {
        let rolls = 0;
        const maxRolls = 12; // Um pouco mais de "piscadas"
        const intervalTime = 70;
        const rollInterval = setInterval(() => {
            const randomFace = Math.floor(Math.random() * 6) + 1;
            uiInstance.imgDado.src = `assets/images/dice_${randomFace}.png`;
            uiInstance.imgDado.style.transform = `rotate(${Math.random() * 30 - 15}deg) scale(1.1)`;
            rolls++;
            if (rolls >= maxRolls) {
                clearInterval(rollInterval);
                uiInstance.showDiceResult(finalRoll);
                uiInstance.imgDado.style.transform = 'rotate(0deg) scale(1)';
                if (callback) callback();
            }
        }, intervalTime);
    }
};
