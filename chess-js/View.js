// View.js — v2
export class View {
    constructor(board, controller) {
        this.board = board;
        this.controller = controller;
        this.selected = null;

        this.container = document.createElement("div");
        this.container.id = "chessboard-wrapper";
        document.body.appendChild(this.container);

        this.boardDiv = document.createElement("div");
        this.boardDiv.id = "chessboard";
        this.container.appendChild(this.boardDiv);

        this.createFileLabels();
        this.createRankLabels();
        this.render();
        this.addClickHandlers();
    }

    createFileLabels() {
        const files = "abcdefgh";
        for (let col = 0; col < 8; col++) {
            const lbl = document.createElement("div");
            lbl.className = "file-label";
            lbl.textContent = files[col];
            lbl.style.left = `${col * 60 + 25}px`;
            this.container.appendChild(lbl);
        }
    }

    createRankLabels() {
        for (let row = 0; row < 8; row++) {
            const lbl = document.createElement("div");
            lbl.className = "rank-label";
            lbl.textContent = 8 - row;
            lbl.style.top = `${row * 60 + 22}px`;
            this.container.appendChild(lbl);
        }
    }

    render() {
        this.boardDiv.innerHTML = "";

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const i = r * 8 + c;
                const cell = document.createElement("div");
                cell.classList.add("cell");
                cell.classList.add((r + c) % 2 === 0 ? "white" : "black");
                cell.dataset.index = i;

                if (this.selected === i) cell.classList.add("selected");

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

    renderLastAIMove(index) {
        const cell = this.boardDiv.querySelector(`[data-index="${index}"]`);
        if (!cell) return;

        cell.classList.add("ai-highlight");

        setTimeout(() => {
            cell.classList.remove("ai-highlight");
        }, 1000); // 1 segundo
    }

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
                    if (ok) this.selected = null;
                }
            }

            this.render();
        });
    }

    onGameOver({ winner, reason }) {
        const div = document.createElement("div");
        div.className = "game-over-message";
        div.textContent = `${winner} venceu por ${reason}!`;
        document.body.appendChild(div);
    }
}

