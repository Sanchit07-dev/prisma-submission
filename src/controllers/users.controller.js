const {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserPosts,
} = require("../services/users.service");
const { parsePagination, buildMeta } = require("../utils/pagination");

async function create(req, res) {
  const { username, email, fullname, bio } = req.body;

  if (!username || !email || !fullname) {
    return res
      .status(400)
      .json({ error: "username, email and fullname are required" });
  }

  try {
    const user = await createUser({ username, email, fullname, bio });
    return res.status(201).json(user);
  } catch (err) {
    if (err.code === "P2002") {
      return res
        .status(409)
        .json({ error: "username or email already taken" });
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

  const { search, sortBy = "createdAt", order = "desc" } = req.query;

  let isPrivate;
  if (req.query.isPrivate !== undefined) {
    if (req.query.isPrivate === "true") {
      isPrivate = true;
    } else if (req.query.isPrivate === "false") {
      isPrivate = false;
    } else {
      return res.status(400).json({ error: "isPrivate must be true or false" });
    }
  }

  let hasPosts;
  if (req.query.hasPosts !== undefined) {
    if (req.query.hasPosts === "true") {
      hasPosts = true;
    } else if (req.query.hasPosts === "false") {
      hasPosts = false;
    } else {
      return res.status(400).json({ error: "hasPosts must be true or false" });
    }
  }

  const { page, limit, skip, take } = pagination;
  const { total, data } = await listUsers({
    skip,
    take,
    search,
    isPrivate,
    hasPosts,
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
  const user = await getUserById(id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.status(200).json(user);
}

async function update(req, res) {
  const id = parseInt(req.params.id, 10);
  const { fullname, bio, isPrivate } = req.body;

  const data = {};
  if (fullname !== undefined) data.fullname = fullname;
  if (bio !== undefined) data.bio = bio;
  if (isPrivate !== undefined) data.isPrivate = isPrivate;

  try {
    const user = await updateUser(id, data);
    return res.status(200).json(user);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    throw err;
  }
}

async function remove(req, res) {
  const id = parseInt(req.params.id, 10);

  try {
    await deleteUser(id);
    return res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    throw err;
  }
}

async function getPosts(req, res) {
  const id = parseInt(req.params.id, 10);

  let pagination;
  try {
    pagination = parsePagination(req.query);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  const { page, limit, skip, take } = pagination;
  const result = await getUserPosts(id, { skip, take });

  if (!result) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.status(200).json({
    data: result.data,
    meta: buildMeta(page, limit, result.total),
  });
}

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
  getPosts,
};
