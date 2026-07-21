const buildUserScopedFilter = (id, userId) => ({ _id: id, userId });

module.exports = {
  buildUserScopedFilter,
};
