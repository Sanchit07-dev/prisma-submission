const {
  createPost,
  listPosts,
  getPostById,
  updatePost,
  deletePost,
} = require("../services/posts.service");

async function create(req, res) {
  const { imageUrl, caption, location } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: "imageUrl is required" });
  }

  const post = await createPost({ imageUrl, caption, location });
  return res.status(201).json(post);
}

async function list(req, res) {
  const posts = await listPosts();
  return res.status(200).json(posts);
}

async function getOne(req, res) {
  const id = parseInt(req.params.id);
  const post = await getPostById(id);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  return res.status(200).json(post);
}

async function update(req, res) {
  const id = parseInt(req.params.id);
  const { caption, location } = req.body;

  const data = {};
  if (caption !== undefined) data.caption = caption;
  if (location !== undefined) data.location = location;

  try {
    const post = await updatePost(id, data);
    return res.status(200).json(post);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    throw err;
  }
}

async function remove(req, res) {
  const id = parseInt(req.params.id);

  try {
    await deletePost(id);
    return res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    throw err;
  }
}

module.exports = { create, list, getOne, update, remove };
