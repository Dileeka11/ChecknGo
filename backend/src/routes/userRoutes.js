const express = require("express");
const router = express.Router();
const {
  loginUser,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

// /api/users/login
router.post("/login", loginUser);

// /api/users
router.route("/").get(getUsers).post(createUser);

// /api/users/:id
router.route("/:id").put(updateUser).delete(deleteUser);

module.exports = router;
