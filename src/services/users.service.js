const prisma = require("../db");

async function createUser(data) {
  return prisma.user.create({ data });
}

async function listUsers({ skip, take, search, isPrivate, hasPosts, sortBy = "createdAt", order = "desc" }) {
  const where = {};

  if (search) {
    where.OR = [
      { username: { contains: search } },
      { fullname: { contains: search } },
    ];
  }

  if (isPrivate !== undefined) {
    where.isPrivate = isPrivate;
  }

  if (hasPosts === true) {
    where.posts = { some: {} };
  } else if (hasPosts === false) {
    where.posts = { none: {} };
  }

  const orderBy = { [sortBy]: order };

  const [total, data] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy,
    }),
  ]);

  return { total, data };
}

async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          posts: true,
          likes: true,
        },
      },
    },
  });
}

async function updateUser(id, data) {
  return prisma.user.update({ where: { id }, data });
}

async function deleteUser(id) {
  return prisma.user.delete({ where: { id } });
}

async function getUserPosts(userId, { skip, take }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return null;
  }

  const where = { authorId: userId };
  const [total, data] = await prisma.$transaction([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { likes: true },
        },
      },
    }),
  ]);

  return { total, data };
}

module.exports = {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserPosts,
};
