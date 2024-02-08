import fastify from "fastify";
import { createPoll } from "./routes/create-poll";
import { getPoll } from "./routes/get-poll";
import { voteOnPoll } from "./routes/vote-on-poll";
import cookie from "@fastify/cookie";
import websocket from "@fastify/websocket";
import { pollResults } from "./ws/poll-results";
import { deletePoll } from "./routes/delete-poll";

const app = fastify();

app.register(cookie, {
  secret: "secret-qualquer", // é como se fosse uma assinatura
  hook: "onRequest",
});
app.register(websocket);
app.register(createPoll);
app.register(getPoll);
app.register(voteOnPoll);
app.register(pollResults);
app.register(deletePoll);

app.listen({ port: 3333 }).then(() => {
  console.log("HTTP server running!");
});
