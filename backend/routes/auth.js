import express from "express";

import { signin, signup, verifyUser } from "../controllers/auth.js";

const router = express.Router();

router.post('/signin', signin);
router.post('/signup', signup);
router.get('/confirm/:confirmationCode', verifyUser);

export default router;