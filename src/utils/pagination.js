function parsePagination(query) {
  let { page = 1, limit = 10 } = query;

  if (typeof page === "string") {
    if (!/^\d+$/.test(page) || parseInt(page, 10) <= 0) {
      const err = new Error("page and limit must be positive integers");
      err.status = 400;
      throw err;
    }
    page = parseInt(page, 10);
  } else if (typeof page === "number") {
    if (!Number.isInteger(page) || page <= 0) {
      const err = new Error("page and limit must be positive integers");
      err.status = 400;
      throw err;
    }
  }

  if (typeof limit === "string") {
    if (!/^\d+$/.test(limit) || parseInt(limit, 10) <= 0) {
      const err = new Error("page and limit must be positive integers");
      err.status = 400;
      throw err;
    }
    limit = parseInt(limit, 10);
  } else if (typeof limit === "number") {
    if (!Number.isInteger(limit) || limit <= 0) {
      const err = new Error("page and limit must be positive integers");
      err.status = 400;
      throw err;
    }
  }

  const skip = (page - 1) * limit;
  const take = limit;

  return { page, limit, skip, take };
}

function buildMeta(page, limit, total) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return { page, limit, total, totalPages };
}

module.exports = { parsePagination, buildMeta };
