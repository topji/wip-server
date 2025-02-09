const { Router: expressRouter } = require("express");
const router = expressRouter();

const userRoutes = require("./userRoutes");
const certificateRoutes = require("./certificateRoutes");

router.use("/users", userRoutes);
router.use("/certificates", certificateRoutes);

module.exports = router;
