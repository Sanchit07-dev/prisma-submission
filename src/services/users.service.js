const prisma = require("../db");

async function createUser(data) {
  return prisma.user.create({ data });
}

async function listUsers() {
  return prisma.user.findMany();
}

async function getUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

async function updateUser(id, data) {
  return prisma.user.update({ where: { id }, data });
}

async function deleteUser(id) {
  return prisma.user.delete({ where: { id } });
}

module.exports = { createUser, listUsers, getUserById, updateUser, deleteUser };
