function migrateToSharedAccess(kitchen) {
  if (Number(kitchen.accessModelVersion || 0) >= 3) return { changed: false, kitchen }

  const members = (kitchen.members || []).map(({ openid, ...member }) => member)

  return {
    changed: true,
    kitchen: {
      ...kitchen,
      members,
      developerOpenids: [],
      accessModelVersion: 3,
    },
  }
}

module.exports = { migrateToSharedAccess }
