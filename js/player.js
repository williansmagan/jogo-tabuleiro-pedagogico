// Lista de cores para até 40 jogadores. Adicione mais se necessário.
// Cores distintas e visualmente agradáveis.
const PLAYER_COLORS = [
    "#FF6347", "#4682B4", "#32CD32", "#FFD700", "#6A5ACD", "#FF69B4", "#00CED1", "#FF4500", // 8
"#20B2AA", "#DA70D6", "#8A2BE2", "#00FA9A", "#DC143C", "#1E90FF", "#ADFF2F", "#FF1493", // 16
"#7B68EE", "#00FFFF", "#FF7F50", "#BA55D3", "#7FFF00", "#D2691E", "#9370DB", "#3CB371", // 24
"#FF00FF", "#6495ED", "#F0E68C", "#E9967A", "#8FBC8F", "#C71585", "#48D1CC", "#F4A460", // 32
"#D8BFD8", "#5F9EA0", "#FFDAB9", "#CD5C5C", "#87CEEB", "#FFA07A", "#B0E0E6", "#FA8072"  // 40 (Total: 32 + 8 = 40)
];

let playerIdCounter = 0;

class Player {
    constructor(name) {
        this.id = `player-${playerIdCounter++}`;
        this.name = name;
        this.score = 0;
        this.position = 0; // 0 é a casa inicial "antes do tabuleiro" ou a própria "INÍCIO"
        this.color = PLAYER_COLORS[playerIdCounter -1 % PLAYER_COLORS.length]; // Garante que teremos cores
        this.isFinished = false;
        this.pawnElement = null; // Referência ao elemento DOM do peão
        this.skipNextTurn = false;
    }

    addPoints(points) {
        this.score += points;
    }

    losePoints(points) {
        this.score -= points;
        //if (this.score < 0) this.score = 0; //Para não considerar pontuação negativa, remover o comentário do início da linha
    }

    resetPoints() {
        this.score = 0;
    }

    moveTo(newPosition, totalCasas) {
        const posicaoFinalLogica = totalCasas + 1; // Posição lógica que representa o FIM
        if (newPosition >= posicaoFinalLogica) { // Se chegou ou passou do FIM lógico
            this.position = posicaoFinalLogica;
            this.isFinished = true;
            ////console.log(`${this.name} chegou ao FIM! Posição Lógica: ${this.position}`);
        } else if (newPosition < 0) { // Não pode ir antes do início (posição 0)
            this.position = 0;
        } else { // Está entre INÍCIO e a última casa numerada, ou na última casa numerada
            this.position = newPosition;
            this.isFinished = false; // Garante que não está finalizado se voltou para trás
        }
    }

    returnToStart() {
        this.position = 0;
        this.isFinished = false; // Adicione ou confirme esta linha!
    }
}
