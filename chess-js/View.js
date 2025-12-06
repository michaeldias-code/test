import { Board } from './Board.js?v=999';  // Adiciona a importação do Board

export class View {
    constructor(board, controller) {
        this.board = board;
        this.controller = controller;
        this.selected = null;
        this.lastMove = null;

        this.container = document.createElement("div");
        this.container.id = "chess-container";
        document.body.appendChild(this.container);

        /* áreas */
        this.rankArea = document.createElement("div");
        this.rankArea.id = "rank-area";
        this.container.appendChild(this.rankArea);

        this.fileArea = document.createElement("div");
        this.fileArea.id = "file-area";
        this.container.appendChild(this.fileArea);

        /* tabuleiro */
        this.boardDiv = document.createElement("div");
        this.boardDiv.id = "chessboard";
        this.container.appendChild(this.boardDiv);

        /* <<<<<<<<<<<<<< IMPORTANTE >>>>>>>>>>>>>> */
        this.createRankLabels();
        this.createFileLabels();

        // Renderizar inicial
        this.render();

        // Adicionar eventos de clique
        this.addClickHandlers();
    }

    /* ---------------- Notações ---------------- */
    createFileLabels() {
        const files = "abcdefgh";
        for (let c = 0; c < 8; c++) {
            const lbl = document.createElement("div");
            lbl.textContent = files[c];
            this.fileArea.appendChild(lbl);
        }
    }

    createRankLabels() {
        for (let r = 0; r < 8; r++) {
            const lbl = document.createElement("div");
            lbl.textContent = 8 - r;
            this.rankArea.appendChild(lbl);
        }
    }

    /* ---------------- Renderização ---------------- */
    render() {
        this.boardDiv.innerHTML = "";

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const i = r * 8 + c;
                const cell = document.createElement("div");
                cell.classList.add("cell");
                cell.classList.add((r + c) % 2 === 0 ? "white" : "black");
                cell.dataset.index = i;

                // Seleção
                if (this.selected === i) cell.classList.add("selected");

                // Destaque último movimento
                if (this.lastMove && (i === this.lastMove.from || i === this.lastMove.to)) {
                    cell.classList.add("ai-move");
                }

                // Renderizar peça
                const piece = this.board.board[i];
                if (piece) {
                    const span = document.createElement("span");
                    span.textContent = piece.tipo;
                    span.className = `piece ${piece.cor}`;
                    cell.appendChild(span);
                }

                this.boardDiv.appendChild(cell);
            }
        }
    }

    /* ---------------- Destaque de movimento AI/último movimento ---------------- */
    highlightCell(index) {
        const prev = this.boardDiv.querySelector(".ai-move");
        if (prev) prev.classList.remove("ai-move");

        const cell = this.boardDiv.querySelector(`.cell[data-index="${index}"]`);
        if (cell) cell.classList.add("ai-move");

        setTimeout(() => {
            if (cell) cell.classList.remove("ai-move");
        }, 500);
    }

    /* ---------------- Eventos de clique ---------------- */
    addClickHandlers() {
        this.boardDiv.addEventListener("click", e => {
            const cell = e.target.closest(".cell");
            if (!cell) return;

            const index = Number(cell.dataset.index);
            const piece = this.board.board[index];

            if (this.selected === null) {
                if (piece && piece.cor === "brancas") {
                    this.selected = index;
                }
            } else {
                if (this.selected === index) {
                    this.selected = null;
                } else {
                    const ok = this.controller.movePiece(this.selected, index);
                    if (ok) this.lastMove = { from: this.selected, to: index };
                    this.selected = null;
                }
            }

            this.render();
        });
    }

    /* ---------------- Mensagem de fim de jogo ---------------- */
    onGameOver({ winner, reason }) {
        const modal = document.createElement("div");
        modal.className = "game-over-modal";  // Estilo de modal

        const modalContent = document.createElement("div");
        modalContent.className = "game-over-content";

        // Personaliza a mensagem com base no vencedor
        if (winner === "brancas") {
            modalContent.innerHTML = `
                <h2>Parabéns, você venceu!!!</h2>
                <p>Quer jogar novamente?</p>
            `;
        } else {
            modalContent.innerHTML = `
                <h2>Você perdeu!</h2>
                <p>Quer tentar novamente?</p>
            `;
        }

        // Botões de ação
        const replayButton = document.createElement("button");
        replayButton.textContent = "Sim";
        replayButton.className = "replay-button";
        replayButton.onclick = () => this.resetGame();  // Chama a função para reiniciar o jogo

        const noButton = document.createElement("button");
        noButton.textContent = "Não";
        noButton.className = "no-button";
        noButton.onclick = () => this.closeModal(modal);  // Fecha o modal

        // Adiciona os botões à mensagem
        modalContent.appendChild(replayButton);
        modalContent.appendChild(noButton);
        
        // Adiciona a estrutura do modal ao corpo
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Exibe o modal
        modal.style.display = "flex";
    }

    /* ---------------- Fechar o Modal ---------------- */
    closeModal(modal) {
        modal.style.display = "none"; // Fecha o modal
    }

    /* ---------------- Resetar o Jogo ---------------- */
    resetGame() {
        // Reinicia o tabuleiro e outras variáveis
        this.controller.gameOver = false;
        this.controller.currentTurn = "brancas"; // Você pode alterar a cor inicial conforme necessário
        this.controller.board = new Board(); // Reinicia o tabuleiro
        this.controller.view.render(); // Re-renderiza o tabuleiro

        // Remove a mensagem de fim de jogo
        this.closeMessage();
    }

    /* ---------------- Fechar a mensagem de fim de jogo ---------------- */
    closeMessage() {
        const gameOverMessage = document.querySelector(".game-over-message");
        if (gameOverMessage) {
            gameOverMessage.remove(); // Remove a mensagem de fim de jogo
        }
    }
}
