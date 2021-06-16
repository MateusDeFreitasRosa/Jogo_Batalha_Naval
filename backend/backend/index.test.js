const test = require('tape');
const supertest = require("supertest");
const index = require('./index.js');

test("Embarcacao", (t) => {
    let embarcacao = new index.Embarcacao("barco_03", 0, 1, 0, 3);
    t.assert(embarcacao.receberTiro(0, 2) === 'Acertou', "Tiro acertou a embarcacao");
    t.assert(embarcacao.receberTiro(1, 5) === 'Errou', "Tiro nao acertou a embarcacao");
    embarcacao.receberTiro(0, 1);
    t.assert(embarcacao.receberTiro(0, 3) === 'Explodiu', "A embarcacao explodiu");
    t.end();
});

test("Tabuleiro", (t) => {
    let embarcacao1 = new index.Embarcacao("barco_03", 0, 1, 0, 3);
    let embarcacao2 = new index.Embarcacao("barco_01", 5, 4, 5, 4);
    let tabuleiro = new index.Tabuleiro();
    tabuleiro.addEmbarcacao(embarcacao1);
    tabuleiro.addEmbarcacao(embarcacao2);
    t.assert(tabuleiro.testarTiro(0, 2)["Acertou"] === true, "Tiro acertou uma embarcacao no tabuleiro");
    t.assert(tabuleiro.testarTiro(5, 4)["Atingida"] !== undefined, "Uma embarcacao explodiu");
    t.end();
});

test("GET /jogar", (t) => {
    supertest(index.app).get("/jogar").expect('Content-Type', /json/).expect(200).end((err, res) => {
        t.error(err, "Sem erros");
        t.assert(Object.keys(res.body).find(e => e == "numeroJogador") !== undefined, "Atributo 'numeroJogador' encontrado");
        t.assert(Object.keys(res.body).find(e => e == "ID") !== undefined, "Atributo 'ID' encontrado");
        t.end();
    });
});

test("GET /vez", (t) => {
    supertest(index.app).get("/vez").expect('Content-Type', /json/).expect(200).end((err, res) => {
        t.error(err, "Sem erros");
        t.assert(Object.keys(res.body).find(e => e == "vez") !== undefined, "Atributo 'vez' encontrado");
        t.assert(typeof res.body["vez"] === "number", "Atributo 'vez' eh um numero");
        t.assert(res.body["vez"] === 1 || res.body["vez"] === 2, "Atributo 'vez' tem um valor valido");
        t.end();
    });
});

test("GET /winner", (t) => {
    supertest(index.app).get("/winner").expect('Content-Type', /json/).expect(404).end((err, res) => {
        t.error(err, "Sem erros");
        t.assert(res.body["status"] === "Não há quem venceu ainda", "Nao tem um vencedor, correto.");
        t.end();
    });
}); 

