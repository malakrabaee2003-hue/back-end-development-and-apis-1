export function authorizeModification(req, res, next) {
  const { role, id: reqUserId } = req.user;
  const targetUserId = req.params.userId;

  if (role === 'parent' || (role === 'child' && String(targetUserId) === String(reqUserId))) {
    return next();
  }

  return res.status(403).json({ error: "Access denied" });
}
