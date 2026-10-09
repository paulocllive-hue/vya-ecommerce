import "dotenv/config";
import app from "./app.js";

const porta = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "127.0.0.1";

const servidor = app.listen(porta, host, () => {
    console.log(
        `Servidor VYA funcionando em http://${host}:${porta}`
    );
});

function encerrarServidor(sinal) {
    console.log(`\nSinal ${sinal} recebido. Encerrando servidor...`);

    servidor.close(() => {
        console.log("Servidor encerrado corretamente.");
        process.exit(0);
    });
}

process.on("SIGINT", () => {
    encerrarServidor("SIGINT");
});

process.on("SIGTERM", () => {
    encerrarServidor("SIGTERM");
});