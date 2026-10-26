const prisma = require("../db");

async function createPost({ imageUrl, caption, location, authorId }) {
  const user = await prisma.user.findUnique({ where: { id: authorId } });
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  return prisma.post.create({
    data: { imageUrl, caption, location, authorId },
  });
}

async function listPosts({ skip, take, search, location, from, to, sortBy = "createdAt", order = "desc" }) {
  const where = {};

  if (search) {
    where.caption = { contains: search };
  }

  if (location) {
    where.location = {
      startsWith: location,
      endsWith: location,
    };
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lt = to;
  }

  let orderBy;
  if (sortBy === "likes") {
    orderBy = [
      { likes: { _count: order } },
      { createdAt: "desc" },
    ];
  } else {
    orderBy = [{ [sortBy]: order }];
  }

  const [total, data] = await prisma.$transaction([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullname: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    }),
  ]);

  return { total, data };
}

async function getPostById(id) {
  return prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          fullname: true,
        },
      },
      _count: {
        select: {
          likes: true,
        },
      },
    },
  });
}

async function updatePost(id, data) {
  // Ensure authorId is never modified
  delete data.authorId;
  return prisma.post.update({
    where: { id },
    data,
  });
}

async function deletePost(id) {
  return prisma.post.delete({ where: { id } });
}

async function getPostLikes(postId) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return null;
  }

  return prisma.user.findMany({
    where: {
      likes: {
        some: { postId },
      },
    },
    orderBy: { username: "asc" },
    select: {
      id: true,
      username: true,
      fullname: true,
    },
  });
}

module.exports = {
  createPost,
  listPosts,
  getPostById,
  updatePost,
  deletePost,
  getPostLikes,
};
