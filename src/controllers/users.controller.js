const {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../services/users.service");

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
  const users = await listUsers();
  return res.status(200).json(users);
}

async function getOne(req, res) {
  const id = parseInt(req.params.id);
  const user = await getUserById(id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.status(200).json(user);
}

async function update(req, res) {
  const id = parseInt(req.params.id);
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
  const id = parseInt(req.params.id);

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

module.exports = { create, list, getOne, update, remove };
