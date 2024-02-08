import { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import z from "zod";

export const createPoll = async (app: FastifyInstance) => {
  app.post("/polls", async (req) => {
    // neste caso o zod vai verificar se nas requisições é passado no body o title. Caso contrário dará erro.
    const createPollBody = z.object({
      title: z.string(),
      options: z.array(z.string()),
    });

    const { title, options } = createPollBody.parse(req.body);

    const poll = await prisma.poll.create({
      data: {
        title,
        options: {
          createMany: {
            data: options.map((option) => {
              return { title: option };
            }),
          },
        },
      },
    });

    return poll;
  });
};
