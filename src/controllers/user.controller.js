export const userController = (req, res) => {
  res.json({
    message: "ok",
    data: req.body,
  });
};
