// const audioContext = new (window.AudioContext || window.webkitAudioContext)(); // Comente ou remova por agora
const audioCache = {};
let soundEnabled = true;

// Função para carregar um som (se for usar AudioContext com buffers)
async function loadSound(soundName) {
    if (audioCache[soundName]) {
        return audioCache[soundName];
    }
    try {
        const response = await fetch(`assets/sounds/${soundName}.mp3`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioCache[soundName] = audioBuffer;
        return audioBuffer;
    } catch (error) {
        //console.error(`Erro ao carregar o som ${soundName}:`, error);
        return null;
    }
}


function playSound(soundName, volume = 0.5, interrupt = true) {
    if (!soundEnabled) return;

    // //console.log(`Tentando tocar: ${soundName}, interrupt: ${interrupt}, time: ${Date.now()}`);

    let audioInstance = audioCache[soundName];

    if (!audioInstance) {
        // Se não existe, cria e armazena no cache
        audioInstance = new Audio(`assets/sounds/${soundName}.mp3`);
        audioCache[soundName] = audioInstance;
        // //console.log(`Nova instância de Audio criada para: ${soundName}`);
    }

    if (interrupt) {
        // Se devemos interromper, paramos o som atual (se estiver tocando)
        // e garantimos que o tempo seja resetado antes de tocar novamente.
        if (!audioInstance.paused) {
            audioInstance.pause();
            // //console.log(`Som ${soundName} pausado para interrupção.`);
        }
        audioInstance.currentTime = 0; // ESSENCIAL resetar o tempo
    } else {
        // Se não devemos interromper, e o som já está tocando, não fazemos nada.
        if (!audioInstance.paused && !audioInstance.ended) {
            // //console.log(`Som ${soundName} já tocando, não interrompendo.`);
            return;
        }
        // Se não estava tocando (pausado ou terminado), ele continuará para o play() abaixo.
    }

    audioInstance.volume = volume;
    const playPromise = audioInstance.play();

    if (playPromise !== undefined) {
        playPromise.then(_ => {
            // //console.log(`Som ${soundName} iniciou/retomou.`);
        }).catch(error => {
            // Não logar erros de interrupção que são esperados
            if (error.name === 'AbortError' && interrupt) {
                // Isso é normal quando .pause() é chamado logo antes de .play() em uma instância que está sendo interrompida.
                // //console.log(`Play() para ${soundName} abortado devido à interrupção, o que é esperado.`);
            } else {
                //console.error(`Erro ao tentar tocar ${soundName}:`, error);
            }
        });
    }
}


// Função para pré-carregar sons (opcional, mas pode melhorar a experiência inicial)
// Chame isso uma vez no início, talvez após uma interação do usuário.
async function preloadSounds(soundList) {
    // //console.log("Pré-carregando sons...");
    // for (const soundName of soundList) {
    //     if (audioContext) { // Se for usar AudioContext
    //         await loadSound(soundName);
    //     } else { // Se for usar new Audio()
    //         // Para new Audio(), o carregamento real acontece no primeiro play() ou com .load()
    //         // Mas podemos criar os objetos para o cache
    //         if (!audioCache[soundName]) {
    //             audioCache[soundName] = new Audio(`assets/sounds/${soundName}.mp3`);
    //             audioCache[soundName].load(); // Tenta iniciar o carregamento
    //         }
    //     }
    // }
    // //console.log("Sons pré-carregados.");
}

// Função para ligar/desligar sons (exemplo)
function toggleSounds(enable) {
    if (typeof enable === 'boolean') {
        soundEnabled = enable;
    } else {
        soundEnabled = !soundEnabled;
    }
    //console.log(`Sons ${soundEnabled ? 'ativados' : 'desativados'}`);
    // Você pode adicionar um botão na UI para chamar isso
    return soundEnabled;
}

// Lista de sons para pré-carregar (opcional)
const SOUNDS_TO_PRELOAD = [
    'dice_roll',
'pawn_move',
'question_correct',
'question_incorrect',
'special_action',
'podium_win',
'podium_place'
];

// Exemplo de como chamar o pré-carregamento (talvez no main.js após o DOMContentLoaded)
// document.addEventListener('DOMContentLoaded', () => {
//    Uma boa prática é pré-carregar após a primeira interação do usuário para evitar problemas de autoplay.
//    Por exemplo, após o primeiro clique no botão "Adicionar Jogador" ou "Iniciar Jogo".
//    Ou você pode ter um botão "Habilitar Som" que chama preloadSounds() e toggleSounds(true).
// });
