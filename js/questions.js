let allQuestions = [];

async function loadQuestions() {
    try {
        const response = await fetch('data/perguntas.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allQuestions = await response.json();
        ////console.log("Perguntas carregadas:", allQuestions);
        return allQuestions;
    } catch (error) {
        ////console.error("Falha ao carregar perguntas:", error);
        // Tratar erro, talvez exibir mensagem na UI
        return []; // Retorna array vazio em caso de falha
    }
}

function getQuestionById(id) {
    return allQuestions.find(q => q.id === id);
}

// Para pegar uma pergunta aleatória se não for mapeada diretamente às casas
function getRandomQuestion(excludeIds = []) {
    const availableQuestions = allQuestions.filter(q => !excludeIds.includes(q.id));
    if (availableQuestions.length === 0) return null; // Todas já foram usadas ou não há perguntas
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    return availableQuestions[randomIndex];
}
