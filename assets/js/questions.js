// js/questions.js

/**
 * Carrega as perguntas do arquivo JSON.
 * @returns {Promise<Array<Object>>} Uma promessa que resolve para um array de objetos de pergunta.
 *                                     Retorna um array vazio em caso de falha no carregamento ou JSON inválido.
 * @throws {Error} Se houver um erro na requisição HTTP.
 */
async function loadQuestions() {
    try {
        // MODIFICAÇÃO AQUI: Adicionar um timestamp à URL para cache busting
        const timestamp = new Date().getTime();
        const response = await fetch(`data/perguntas.json?v=${timestamp}`); // Adicionado ?v=${timestamp}

        if (!response.ok) {
            // Lança um erro que será capturado pelo Promise.all em main.js
            throw new Error(`HTTP error! status: ${response.status} ao buscar perguntas.json`);
        }
        const questionsData = await response.json();

        if (!Array.isArray(questionsData)) {
            console.error("Erro: O arquivo perguntas.json não contém um array JSON válido.");
            return []; // Retorna array vazio se o formato não for o esperado
        }

        console.log("Perguntas carregadas de questions.json:", questionsData);
        return questionsData; // Retorna os dados das perguntas
    } catch (error) {
        console.error("Falha crítica ao carregar ou processar perguntas.json:", error);
        // Para garantir que Promise.all não quebre se um dos fetchs falhar de forma catastrófica
        // antes de poder retornar um array vazio, é bom relançar o erro para que o catch de Promise.all o pegue.
        // Se o erro for apenas um JSON inválido ou vazio, já tratamos acima retornando [].
        throw error; // Propaga o erro para ser tratado no chamador (main.js)
    }
}

// Não há necessidade de exportar `allQuestions` globalmente daqui,
// nem das funções `getQuestionById` ou `getRandomQuestion` (esta última já está em gameLogic).
// `loadQuestions` é a única interface necessária deste arquivo.
