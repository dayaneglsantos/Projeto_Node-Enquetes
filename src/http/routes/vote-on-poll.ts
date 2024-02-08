import { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import z from "zod";
import { randomUUID } from "crypto";
import { redis } from "../../lib/redis";
import { voting } from "../../utils/voting-pub-sub";

export const voteOnPoll = async (app: FastifyInstance) => {
  app.post("/polls/:pollId/votes", async (req, reply) => {
    const voteOnPollBody = z.object({
      pollOptionId: z.string().uuid(),
    });

    const voteOnPollParams = z.object({
      pollId: z.string().uuid(),
    });

    const { pollId } = voteOnPollParams.parse(req.params);
    const { pollOptionId } = voteOnPollBody.parse(req.body);

    let { sessionId } = req.cookies;

    if (sessionId) {
      const userPreviousVote = await prisma.vote.findUnique({
        where: {
          sessionId_pollId: {
            sessionId,
            pollId,
          },
        },
      });

      if (userPreviousVote && userPreviousVote.pollOptionId !== pollOptionId) {
        await prisma.vote.delete({
          where: {
            id: userPreviousVote.id,
          },
        });
        // diminui 1 voto referente a opção anterior que o usuário tinha votado
        const votes = await redis.zincrby(
          pollId,
          -1,
          userPreviousVote.pollOptionId
        );

        voting.publish(pollId, {
          pollOptionId: userPreviousVote.pollOptionId,
          votes: Number(votes),
        });
      } else if (userPreviousVote) {
        return reply.send({ message: "Você já votou nesta enquete." });
      }
    }

    if (!sessionId) {
      sessionId = randomUUID();

      reply.setCookie("sessionId", sessionId, {
        path: "/", // todas as rotas terá o cookie
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        signed: true, // será assinado conforme o secret que definimos
        httpOnly: true, // só poderá ser acessado no backend (segurança)
      });
    }

    await prisma.vote.create({
      data: {
        sessionId,
        pollId,
        pollOptionId,
      },
    });

    //incrementa 1 na contagem dos votas da opção
    const votes = await redis.zincrby(pollId, 1, pollOptionId);

    voting.publish(pollId, {
      pollOptionId,
      votes: Number(votes),
    });

    return reply.send();
  });
};
