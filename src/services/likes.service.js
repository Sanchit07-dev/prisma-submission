const prisma = require("../db");

async function likePost(postId, userId) {
  // 1. Check if post exists
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    const err = new Error("Post not found");
    err.status = 404;
    throw err;
  }

  // 2. Check if user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  // 3. Insert like (catch duplicate like via P2002)
  try {
    return await prisma.like.create({
      data: {
        postId,
        userId,
      },
    });
  } catch (err) {
    if (err.code === "P2002") {
      const conflictErr = new Error("Already liked");
      conflictErr.status = 409;
      throw conflictErr;
    }
    throw err;
  }
}

async function unlikePost(postId, userId) {
  try {
    await prisma.like.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
  } catch (err) {
    if (err.code === "P2025") {
      const notFoundErr = new Error("Like not found");
      notFoundErr.status = 404;
      throw notFoundErr;
    }
    throw err;
  }
}

module.exports = {
  likePost,
  unlikePost,
};
