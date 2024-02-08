import { FastifyInstance } from "fastify";
import z from "zod";
import { prisma } from "../../lib/prisma";

export const deletePoll = async (app: FastifyInstance) => {
  app.delete("/polls/:pollId", async (req, res) => {
    const voteOnPollParams = z.object({
      pollId: z.string().uuid(),
    });

    const { pollId } = voteOnPollParams.parse(req.params);

    const poll = await prisma.poll.findUnique({
      where: {
        id: pollId,
      },
    });

    if (!poll) {
      return res.send({ message: "Enquete não encontrada." });
    }

    await prisma.vote.deleteMany({
      where: {
        pollId: pollId,
      },
    });
    await prisma.pollOption.deleteMany({
      where: {
        pollId: pollId,
      },
    });

    await prisma.poll.delete({
      where: {
        id: pollId,
      },
    });

    return res.send({ message: "Enquete deletada com sucesso!" });
  });
};
