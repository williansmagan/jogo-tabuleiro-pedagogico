// js/animations.js

const animations = {
    // --- Animação do Movimento do Peão ---
    animatePlayerMove(player, steps, totalCasas, gameLogicInstance, uiInstance) {
        const startPosition = player.position;
        let currentStep = 0;
        let intermediatePosition = startPosition;

        // Desabilitar o botão de dado enquanto o peão se move
        const btnLancarDado = document.getElementById('btn-lancar-dado');
        if (btnLancarDado) btnLancarDado.disabled = true;

        return new Promise((resolve) => { // Retorna uma Promise para sabermos quando a animação termina
            const moveInterval = setInterval(() => {
                if (currentStep < steps) {
                    const oldVisualPosition = intermediatePosition;
                    intermediatePosition++;

                    if (intermediatePosition > totalCasas) {
                        intermediatePosition = totalCasas;
                    }

                    uiInstance.movePawnStep(player, intermediatePosition, oldVisualPosition);
                    // Não tocar som aqui, pois movePawnStep já faz isso
                    currentStep++;
                } else {
                    clearInterval(moveInterval);
                    // Movimento lógico final após a animação
                    player.moveTo(startPosition + steps, totalCasas);
                    uiInstance.updatePlayerPawn(player, startPosition); // Garante posição final correta
                    uiInstance.updateRanking(gameLogicInstance.players, gameLogicInstance.getCurrentPlayer().id); // Atualiza ranking após movimento

                    // Habilitar o botão de dado (será desabilitado novamente se for a vez do mesmo jogador e ele estiver finalizado)
                    // ou se o próximo jogador estiver finalizado. A lógica de gameLogicInstance.nextTurn() cuidará disso.
                    // if (btnLancarDado) btnLancarDado.disabled = false; // gameLogic.nextTurn fará isso

                    resolve(); // Resolve a Promise quando a animação do movimento estiver completa
                }
            }, 300); // Velocidade da animação
        });
    },

    // --- Animação do Pódio ---
    animatePodium(players, podiumElements, uiInstance) {
        const sortedByScore = [...players].sort((a, b) => b.score - a.score);
        const top3 = sortedByScore.slice(0, 3);

        const podiumConfig = [
            { elLugar: podiumElements.lugar1, elBarra: podiumElements.barra1, elNome: podiumElements.nome1, elPontos: podiumElements.pontos1, elTextoBarra: podiumElements.textoBarra1, height: 200, color: 'gold', text: '1º', delay: 0.5 },
            { elLugar: podiumElements.lugar2, elBarra: podiumElements.barra2, elNome: podiumElements.nome2, elPontos: podiumElements.pontos2, elTextoBarra: podiumElements.textoBarra2, height: 150, color: 'silver', text: '2º', delay: 0 },
            { elLugar: podiumElements.lugar3, elBarra: podiumElements.barra3, elNome: podiumElements.nome3, elPontos: podiumElements.pontos3, elTextoBarra: podiumElements.textoBarra3, height: 100, color: '#CD7F32', text: '3º', delay: 0.2 }
        ];

        // Resetar pódio antes de animar
        podiumConfig.forEach(p => {
            p.elLugar.classList.remove('visible');
            p.elBarra.style.height = '0px';
            p.elBarra.classList.remove('animated');
            p.elBarra.style.backgroundColor = '#007bff';
            p.elNome.textContent = '-';
            p.elPontos.textContent = '- PONTOS';
            if (p.elTextoBarra) p.elTextoBarra.textContent = '';
        });
            uiInstance.removeConfetti();

            // Animar barras e depois mostrar informações
            top3.forEach((player, index) => {
                if (podiumConfig[index]) {
                    const pd = podiumConfig[index];
                    setTimeout(() => {
                        pd.elBarra.style.backgroundColor = pd.color;
                        pd.elBarra.style.height = `${pd.height}px`;
                        if (pd.elTextoBarra) pd.elTextoBarra.textContent = pd.text;
                        pd.elBarra.classList.add('animated');

                        setTimeout(() => {
                            pd.elNome.textContent = player.name;
                            pd.elPontos.textContent = `${player.score} pts`;
                            pd.elLugar.classList.add('visible');

                            if (index === 0) {
                                uiInstance.triggerConfetti(pd.elBarra);
                                if (typeof playSound === 'function') playSound('podium_win');
                            } else {
                                if (typeof playSound === 'function') playSound('podium_place');
                            }
                        }, 1000); // Tempo da animação da barra + delay para texto

                    }, pd.delay * 1000);
                }
            });
    },

    // --- Animação do Dado (exemplo simples) ---
    // Esta função poderia ser chamada antes de ui.showDiceResult
    animateDiceRoll(uiInstance, finalRoll, callback) {
        let rolls = 0;
        const maxRolls = 10; // Número de "piscadas" do dado
        const intervalTime = 80; // Tempo entre piscadas

        const rollInterval = setInterval(() => {
            const randomFace = Math.floor(Math.random() * 6) + 1;
            uiInstance.imgDado.src = `assets/images/dice_${randomFace}.png`;
            rolls++;
            if (rolls >= maxRolls) {
                clearInterval(rollInterval);
                uiInstance.showDiceResult(finalRoll); // Mostra o resultado final real
                if (callback) callback();
            }
        }, intervalTime);
    }
};
