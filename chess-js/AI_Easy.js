// AI_Easy.js (Estratégia de Dificuldade Concreta)

class AI_Easy {
    constructor() {
        // Configurações específicas da AI_Easy
        // O nível "Fácil" geralmente usa uma pesquisa rasa ou aleatória.
        this.searchDepth = 1; 
    }

    /**
     * O método principal que o AI Controller chamará.
     * Implementa a lógica de cálculo para o nível 'easy'.
     * * @param {object} boardState - O estado atual do tabuleiro.
     * @param {string} playerColor - A cor da peça que a IA está jogando.
     * @returns {object|null} O movimento escolhido.
     */
    findMove(boardState, playerColor) {
        console.log(`🤖 AI_Easy: Calculando movimento (Profundidade: ${this.searchDepth})...`);

        // 1. Obter todos os movimentos legais
        const possibleMoves = this.getLegalMoves(boardState, playerColor);
        
        if (possibleMoves.length === 0) {
            return null; // Não há movimentos legais
        }

        // 2. Lógica Simples (Fácil):
        // Para a AI mais simples, podemos implementar:
        // A) Escolher um movimento legal completamente aleatório. OU
        // B) Usar o Minimax com profundidade 1 (escolher o movimento que leva ao melhor score imediatamente).

        // Vamos optar pela Opção A para ser o *mais fácil* possível.
        const randomIndex = Math.floor(Math.random() * possibleMoves.length);
        const bestMove = possibleMoves[randomIndex];

        console.log(`🎉 AI_Easy: Movimento escolhido aleatoriamente: ${JSON.stringify(bestMove)}`);
        return bestMove;
    }

    /**
     * Função auxiliar: Deve se conectar ao seu motor principal de regras de xadrez.
     * OBS: O corpo real desta função dependerá de como seu motor de xadrez está estruturado.
     */
    getLegalMoves(boardState, playerColor) {
        // **ESTE É UM PLACEHOLDER.**
        // Você deve integrar aqui a chamada ao seu módulo de regras de xadrez 
        // para obter os movimentos válidos para o `playerColor`.

        // Exemplo de retorno simulado:
        return [
            { from: 'e2', to: 'e4' },
            { from: 'g1', to: 'f3' },
            { from: 'd2', to: 'd4' },
        ];
    }
}

export default AI_Easy;


