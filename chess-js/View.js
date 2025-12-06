// View.js — v2
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

        // Adicionar evento de fechamento do modal
        document.getElementById('close-modal').addEventListener('click', this.closeModal);
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

    /* ---------------- Mensagem de Game Over ---------------- */
    onGameOver({ winner, reason }) {
        const messageBox = document.getElementById("game-over-modal");
        const messageText = document.getElementById("game-over-message");

        // Atualiza a mensagem
        messageText.textContent = `${winner} venceu por ${reason}!`;

        // Exibe o modal
        messageBox.style.display = 'flex';
    }

    /* ---------------- Fechar o Modal ---------------- */
    closeModal() {
        const messageBox = document.getElementById("game-over-modal");
        messageBox.style.display = 'none';
    }
}


