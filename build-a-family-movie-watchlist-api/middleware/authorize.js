export function authorizeModification(req, res, next) {
  const user = req.user; // يأتي من الميدلوير authenticate
  const targetUserId = req.params.userId;

  // إذا كان المستخدم parent يسمح له دائماً، أو إذا كان child ويعدل على قائمة نفسه فقط
  if (user.role === 'parent' || user.id === targetUserId) {
    return next();
  }

  // إذا كان child ويحاول التعديل على قائمة مستخدم آخر
  return res.status(403).json({ error: "Access denied" });
}