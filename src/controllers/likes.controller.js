const { likePost, unlikePost } = require("../services/likes.service");

async function like(req, res) {
  const postId = parseInt(req.params.id, 10);
  const { userId } = req.body;

  if (userId === undefined || userId === null || userId === "") {
    return res.status(400).json({ error: "userId is required" });
  }

  const parsedUserId = parseInt(userId, 10);

  try {
    const createdLike = await likePost(postId, parsedUserId);
    return res.status(201).json(createdLike);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    throw err;
  }
}

async function unlike(req, res) {
  const postId = parseInt(req.params.id, 10);
  const userId = parseInt(req.params.userId, 10);

  try {
    await unlikePost(postId, userId);
    return res.status(204).send();
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    throw err;
  }
}

module.exports = {
  like,
  unlike,
};
