import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app = express();
const PORT = 3000;

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "A chave OPENAI_API_KEY não foi encontrada no arquivo .env"
  );
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


// Permite que o servidor receba JSON

app.use(express.json());


// Disponibiliza os arquivos da pasta public

app.use(express.static("public"));


// Rota para testar o servidor

app.get("/api/status", function (req, res) {
  res.json({
    funcionando: true,
    mensagem: "Servidor do chatbot funcionando!"
  });
});


// Rota principal do chatbot

app.post("/api/chat", async function (req, res) {
  const {
    mensagem,
    idRespostaAnterior
  } = req.body;

  if (
    typeof mensagem !== "string" ||
    mensagem.trim() === ""
  ) {
    return res.status(400).json({
      erro: "Digite uma pergunta válida."
    });
  }

  try {
    const configuracao = {
      model: "gpt-5.6-luna",

      instructions: `
        Você é o JurisIA, um assistente educacional
        sobre inteligência artificial aplicada ao
        meio jurídico.

        Responda em português do Brasil, com clareza
        e linguagem simples.

        Considere as mensagens anteriores para manter
        uma conversa coerente.

        Não se apresente como advogado e não forneça
        aconselhamento jurídico individualizado.

        Não invente leis, decisões judiciais ou
        informações.

        Quando a pergunta exigir análise jurídica
        profissional, informe que o usuário deve
        procurar um advogado qualificado.
      `,

      input: mensagem.trim(),
      max_output_tokens: 500,
      store: true
    };


    // Só adiciona memória após a primeira resposta

    if (
      typeof idRespostaAnterior === "string" &&
      idRespostaAnterior.trim() !== ""
    ) {
      configuracao.previous_response_id =
        idRespostaAnterior;
    }


    // Envia a solicitação para a OpenAI

    const resposta =
      await openai.responses.create(
        configuracao
      );


    // Retorna o texto e o identificador da resposta

    res.json({
      resposta: resposta.output_text,
      idResposta: resposta.id
    });
  } catch (erro) {
    console.error(
      "Erro ao consultar a OpenAI:",
      erro.message
    );

    res.status(500).json({
      erro: "Não foi possível obter uma resposta da inteligência artificial."
    });
  }
});


// Inicia o servidor

app.listen(PORT, function () {
  console.log(
    `Servidor rodando em http://localhost:${PORT}`
  );
});