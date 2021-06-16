const express = require("express");
const socket = require("socket.io");
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const JSONdb = require('simple-json-db');
const db = new JSONdb('./database.json');


const app = express();
app.use(cors());
app.options('*', cors());

// Arquivos estaticos
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 8000;

const http = require("http").createServer(app);
const io = socket(http);

http.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});

let jogador1;
let jogador2;

let vidasJ1 = 15;
let vidasJ2 = 15;

let acertosj1 = 0;
let acertosj2 = 0;
let errosj1 = 0;
let errosj2 = 0;

let vez = Math.random() >= 0.5 ? 1 : 2;

app.get('/jogar', (req, res) => {
    let ID = crypto.randomBytes(16).toString("hex");
    let n = 0;
    if (jogador1 == undefined) {
        jogador1 = ID;
        n = 1;
        console.log("O Jogador 1 ingressou: " + ID);
    }
    else if (jogador2 == undefined) {
        jogador2 = ID;
        n = 2;
        console.log("O Jogador 2 ingressou: " + ID);
    }

    res.send({ "numeroJogador": n, "ID": ID });
});

class Embarcacao {
    constructor(tipo, x1, y1, x2, y2, tirosRecebidos = 0) {

        if (x1 != x2 && y1 != y2) {
            throw new Error("Invalid posição");
        }

        switch (tipo) {
            case 'barco_01':
                this.len = 1;
                this.tipo = tipo;
                break;
            case 'barco_02':
                this.len = 2;
                this.tipo = tipo;
                break;
            case 'barco_03':
                this.len = 3;
                this.tipo = tipo;
                break;
            case 'barco_04':
                this.len = 4;
                this.tipo = tipo;
                break;
            case 'barco_05':
                this.len = 5;
                this.tipo = tipo;
                break;
            default:
                throw new Error("Invalid tipo: " + tipo);
        }

        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;

        if (this.x1 > this.x2) {
            let aux = this.x1;
            this.x1 = this.x2;
            this.x2 = aux;
        }

        if (this.y1 > this.y2) {
            let aux = this.y1;
            this.y1 = this.y2;
            this.y2 = aux;
        }

        this.tirosRecebidos = tirosRecebidos;

    }

    receberTiro(x, y) {

        if (this.tirosRecebidos == this.len) {
            return 'Errou';
        }
        let aconteceu = "Errou";
        if ((this.x1 == this.x2) && (this.x1 == x)) {
            ///Posicionado horizontalmente  
            ///E o tiro foi na mesma linha
            if (y >= this.y1 && y <= this.y2) {
                this.tirosRecebidos++;

                aconteceu = 'Acertou';
            }
        } else if ((this.y1 == this.y2) && (this.y1 == y)) {
            ///Posicionado verticalmente
            ///E o tiro foi na mesma coluna
            if (x >= this.x1 && x <= this.x2) {
                this.tirosRecebidos++;
                aconteceu = 'Acertou';
            }
        }
        if (this.tirosRecebidos == this.len) {
            return 'Explodiu';
        }
        return aconteceu;
    }
}

class Tabuleiro {
    constructor() {
        this.matrix = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];
        this.embarcacoes = [];
    }

    getEmbarcacoes() {
        return this.embarcacoes;
    }

    getMatrix() {
        return this.matrix;
    }

    setEmbarcacoes(embarcacoes) {
        if (embarcacoes) {
            this.embarcacoes = embarcacoes;
        }
    }

    setMatrix(matrix) {
        if (matrix) {
            this.matrix = matrix;
        }
    }

    addEmbarcacao(embarcacao) {
        this.embarcacoes.forEach((emb) => {
            if (emb.tipo == embarcacao.tipo) {
                throw new Error("Invalid: Embarcacao repetida");
            }
        });

        let cpy_matrix = JSON.parse(JSON.stringify(this.matrix));

        if (embarcacao.x1 == embarcacao.x2) {
            for (let i = embarcacao.y1; i < embarcacao.y2; i++) {
                if (cpy_matrix[i][embarcacao.x1] == 0) {
                    cpy_matrix[i][embarcacao.x1] = 2;
                } else {
                    throw new Error("Invalid: Embarcacoes sobrepostas");
                }
            }
        } else if (embarcacao.y1 == embarcacao.y2) {
            for (let i = embarcacao.x1; i < embarcacao.x2; i++) {
                if (cpy_matrix[embarcacao.y1][i] == 0) {
                    cpy_matrix[embarcacao.y1][i] = 2;
                } else {
                    throw new Error("Invalid: Embarcacoes sobrepostas");
                }
            }
        }

        this.embarcacoes.push(embarcacao);

        this.matrix = cpy_matrix;
    }

    testarTiro(x, y) {

        let resultado = "Errou";
        if (this.matrix[y][x] == -2 || this.matrix[y][x] == 1) {

            return { "Acertou": false, "Log": "Tiro inválido!" };
        }
        let atingida;

        for (let emb of this.embarcacoes) {
            let res = emb.receberTiro(x, y);

            if (res != "Errou") {
                resultado = res;
                atingida = emb;
                break;
            }
        }

        switch (resultado) {
            case 'Errou':
                this.matrix[y][x] = 1;
                console.log("O Disparo foi na agua");
                return { "Acertou": false, "Log": "Tiro na agua" };
            case 'Acertou':
                this.matrix[y][x] = -2;
                console.log("O Disparo acertou uma embarcação");
                return { "Acertou": true, "Log": "Acertou uma embarcação" };
            case 'Explodiu':
                if (atingida.x1 == atingida.x2) {
                    for (let i = atingida.y1; i < atingida.y2; i++) {
                        this.matrix[i][atingida.x1] = -3;
                    }
                } else if (atingida.y1 == atingida.y2) {
                    for (let i = atingida.x1; i < atingida.x2; i++) {
                        this.matrix[atingida.y1][i] = -3;
                    }
                }

                console.log("O Disparo acertou uma embarcação e ela esplodiu");
                return {
                    "Acertou": true,
                    "Log": `Embarcação ${atingida.tipo} esplodiu!`,
                    "Atingida": {
                        "tipo": atingida.tipo,
                        "x1": atingida.x1,
                        "y1": atingida.y1,
                        "x2": atingida.x2,
                        "y2": atingida.y2
                    },
                };
        }
        return { "Acertou": false, "Log": "BUG" };
    }
}

function redefinirGame() {
    vidasJ1 = 15;
    vidasJ2 = 15;
    jogador1 = undefined;
    jogador2 = undefined;
    vez = Math.random() >= 0.5 ? 1 : 2;
    console.log("Ambiente Redefinido...");
}

app.get("/existeGame", (req, res) => {
    let player1 = db.get("player1");
    let player2 = db.get("player2");
    if (player1 && player2) {
        if (player1["ID"] == req.query["ID"] || player2["ID"] == req.query["ID"]) {
            return res.send({ "Existe": true });
        }
    }
    res.send({ "Existe": false });
});


app.post("/existeGame", (req, res) => {
    let player1 = db.get("player1");
    let player2 = db.get("player2");
    vez = db.get("vez");

    let matriz_fake;
    let obj = {};
    if (req.body["ID"] == player1["ID"]) {
        tabuleiroJ1 = new Tabuleiro();

        jogador1 = player1["ID"];
        tabuleiroJ1.setMatrix(player1["matriz"]);

        let embarqs = [];
        for (let barco of player1["embarcacoes"]) {
            embarqs.push(new Embarcacao(barco.tipo, barco.x1, barco.y1, barco.x2, barco.y2, barco.tirosRecebidos));
        }
        tabuleiroJ1.setEmbarcacoes(embarqs);
        acertosj1 = player1["meusAcertos"];
        errosj1 = player1["meusErros"];
        acertosj2 = player2["meusAcertos"];
        errosj2 = player2["meusErros"];
        vidasJ1 = player1["vida"];


        matriz_fake = JSON.parse(JSON.stringify(player2['matriz']));

        obj["ID"] = jogador1;
        obj["embarcacoes"] = tabuleiroJ1.getEmbarcacoes();
        obj["matriz"] = tabuleiroJ1.getMatrix();
        obj["meusAcertos"] = acertosj1;
        obj["meusErros"] = errosj1;
        obj['errosAdversario'] = errosj2;
        obj['acertosAdversario'] = acertosj2
        obj["vida"] = vidasJ1;
    }
    else if (req.body["ID"] == player2["ID"]) {
        tabuleiroJ2 = new Tabuleiro();

        jogador2 = player2["ID"];
        tabuleiroJ2.setMatrix(player2["matriz"]);
        let embarqs = [];
        for (let barco of player2["embarcacoes"]) {
            embarqs.push(new Embarcacao(barco.tipo, barco.x1, barco.y1, barco.x2, barco.y2, barco.tirosRecebidos));
        }
        tabuleiroJ2.setEmbarcacoes(embarqs);
        acertosj2 = player2["meusAcertos"];
        errosj2 = player2["meusErros"];
        acertosj1 = player1["meusAcertos"];
        errosj1 = player1["meusErros"];
        vidasJ2 = player2["vida"];

        matriz_fake = JSON.parse(JSON.stringify(player1['matriz']));

        obj["ID"] = jogador2;
        obj["embarcacoes"] = tabuleiroJ2.getEmbarcacoes();
        obj["matriz"] = tabuleiroJ2.getMatrix();
        obj["meusAcertos"] = acertosj2;
        obj["meusErros"] = errosj2;
        obj['errosAdversario'] = errosj1;
        obj['acertosAdversario'] = acertosj1
        obj["vida"] = vidasJ2;
    }

    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            if (matriz_fake[i][j] == 2) {
                matriz_fake[i][j] = 0;
            }
        }
    }

    obj["matrizAdversario"] = matriz_fake;
    obj["vez"] = vez;
    res.send(obj);
});

app.get("/vez", (req, res) => {
    res.send({ "vez": vez })
});

let tabuleiroJ1;
let tabuleiroJ2;

app.post('/cadastrarEmbarcacoes', (req, res) => {
    let embarcacoes = req.body["embarcacoes"];

    if (req.body["ID"] == jogador1) {
        tabuleiroJ1 = new Tabuleiro();

        embarcacoes.forEach((barco) => {
            b = JSON.parse(barco);
            let embarcacao = new Embarcacao(b.tipo, b.x1, b.y1, b.x2, b.y2);
            tabuleiroJ1.addEmbarcacao(embarcacao);
        });
        console.log("O Jogador 1 posicionou suas embarcações");
    } else if (req.body["ID"] == jogador2) {
        tabuleiroJ2 = new Tabuleiro();

        embarcacoes.forEach((barco) => {
            b = JSON.parse(barco);
            let embarcacao = new Embarcacao(b.tipo, b.x1, b.y1, b.x2, b.y2);
            tabuleiroJ2.addEmbarcacao(embarcacao);
        });
        console.log("O Jogador 2 posicionou suas embarcações");
    }

    if (tabuleiroJ1 && tabuleiroJ2) {
        //Inicia
        io.sockets.emit("Inicio de jogo");
        console.log("Partida iniciada: O Jogador " + vez + " vai primeiro");
    }

    res.send({ "Cadastrado": true });
});

app.get("/cleanDB", (req, res) => {
    db.delete("player1");
    db.delete("player2");
    db.delete("vez");
});

app.get("/winner", (req, res) => {
    if (vidasJ1 == 0) {
        return res.send({ "status": "Vitória do Jogador 2", "winner": 2 });
    } else if (vidasJ2 == 0) {
        return res.send({ "status": "Vitória do Jogador 1", "winner": 1 });
    }
    res.status(404).send({ "status": "Não há quem venceu ainda", "winner": 0 });
});

app.post("/getScore", (req, res) => {
    if (req.body["ID"] == jogador1) {
        res.send({ 'meusAcertos': acertosj1, 'meusErros': errosj1, 'acertosAdversario': acertosj2, 'errosAdversario': errosj2 });
    }
    else if (req.body["ID"] == jogador2) {
        res.send({ 'meusAcertos': acertosj2, 'meusErros': errosj2, 'acertosAdversario': acertosj1, 'errosAdversario': errosj1 });
    }
});

app.post('/atirar', (req, res) => {
    let resultado;
    if (req.body["ID"] == jogador1 && vez == 1) {
        resultado = tabuleiroJ2.testarTiro(req.body["X"], req.body["Y"]);
        console.log("O Jogador 1 efetuou um disparo");
        if (resultado["Acertou"]) {
            vidasJ2--;
            acertosj1++;
        }
        else {
            errosj1++;
        }
    }
    else if (req.body["ID"] == jogador2 && vez == 2) {
        resultado = tabuleiroJ1.testarTiro(req.body["X"], req.body["Y"]);
        console.log("O Jogador 2 efetuou um disparo");
        if (resultado["Acertou"]) {
            vidasJ1--;
            acertosj2++;
        }
        else {
            errosj2++;
        }
    }
    else {
        return res.status(401).end();
    }

    io.sockets.emit("Disparo Efetuado");

    if (vidasJ1 == 0 || vidasJ2 == 0) {
        io.sockets.emit("Fim de Jogo");
        console.log("Jogo finalizado");
        console.log("Vencedor = " + (vidasJ1 == 0 ? 2 : 1));
        setTimeout(() => {
            redefinirGame();
        }, 15000);
    }
    else if (!resultado["Acertou"]) {
        if (vez == 1) vez = 2;
        else if (vez == 2) vez = 1;
        io.sockets.emit("Proximo Jogador");
    }
    res.send(resultado);
});

app.get('/matrixDisparos', (req, res) => {

    let matrix = null;

    if (req.query["ID"] == jogador1) {
        matrix = tabuleiroJ1.getMatrix();
    } else if (req.query["ID"] == jogador2) {
        matrix = tabuleiroJ2.getMatrix();
    }

    res.send({ "matrix": matrix });
});

io.on("connection", function (socket) {
    console.log(`Socket conectado: ${socket.id}`);

    socket.on("disconnect", function () {
        if (tabuleiroJ1 && tabuleiroJ2) {
            let player1 = {
                "ID": jogador1,
                "embarcacoes": tabuleiroJ1.getEmbarcacoes(),
                "matriz": tabuleiroJ1.getMatrix(),
                'meusAcertos': acertosj1,
                'meusErros': errosj1,
                "vida": vidasJ1
            }

            let player2 = {
                "ID": jogador2,
                "embarcacoes": tabuleiroJ2.getEmbarcacoes(),
                "matriz": tabuleiroJ2.getMatrix(),
                'meusAcertos': acertosj2,
                'meusErros': errosj2,
                "vida": vidasJ2
            }
            db.set("player1", player1);
            db.set("player2", player2);
            db.set("vez", vez);
        }
    });
});

module.exports = { "Embarcacao": Embarcacao, "Tabuleiro": Tabuleiro, "app": app };