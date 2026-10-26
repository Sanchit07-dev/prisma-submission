const {
  createPost,
  listPosts,
  getPostById,
  updatePost,
  deletePost,
  getPostLikes,
} = require("../services/posts.service");
const { parsePagination, buildMeta } = require("../utils/pagination");

async function create(req, res) {
  const { imageUrl, caption, location, authorId } = req.body || {};

  if (!imageUrl || !authorId) {
    return res
      .status(400)
      .json({ error: "imageUrl and authorId are required" });
  }

  try {
    const post = await createPost({
      imageUrl,
      caption,
      location,
      authorId: parseInt(authorId, 10),
    });
    return res.status(201).json(post);
  } catch (err) {
    if (err.status === 404 || err.message === "User not found") {
      return res.status(404).json({ error: "User not found" });
    }
    throw err;
  }
}

async function list(req, res) {
  let pagination;
  try {
    pagination = parsePagination(req.query);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  const { search, location, sortBy = "createdAt", order = "desc" } = req.query;

  const allowedSortBy = ["createdAt", "updatedAt", "likes"];
  if (req.query.sortBy !== undefined && !allowedSortBy.includes(sortBy)) {
    return res
      .status(400)
      .json({ error: "sortBy must be one of: createdAt, updatedAt, likes" });
  }

  const allowedOrder = ["asc", "desc"];
  if (req.query.order !== undefined && !allowedOrder.includes(order)) {
    return res.status(400).json({ error: "order must be asc or desc" });
  }

  let fromDate;
  if (req.query.from !== undefined) {
    fromDate = new Date(req.query.from);
    if (isNaN(fromDate.getTime())) {
      return res.status(400).json({ error: "from and to must be valid dates" });
    }
  }

  let toDate;
  if (req.query.to !== undefined) {
    toDate = new Date(req.query.to);
    if (isNaN(toDate.getTime())) {
      return res.status(400).json({ error: "from and to must be valid dates" });
    }
  }

  const { page, limit, skip, take } = pagination;
  const { total, data } = await listPosts({
    skip,
    take,
    search,
    location,
    from: fromDate,
    to: toDate,
    sortBy,
    order,
  });

  return res.status(200).json({
    data,
    meta: buildMeta(page, limit, total),
  });
}

async function getOne(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }
  const post = await getPostById(id);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  return res.status(200).json(post);
}

async function update(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }
  const { caption, location } = req.body || {};

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
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }

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

async function getLikes(req, res) {
  const id = parseInt(req.params.id, 10);
  const users = await getPostLikes(id);

  if (!users) {
    return res.status(404).json({ error: "Post not found" });
  }

  return res.status(200).json(users);
}

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
  getLikes,
};
