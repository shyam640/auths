import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { sendConfirmationEmail } from '../config/nodemailer.config.js';

import User from '../models/user.js'

export const signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email })
    
    if (!existingUser) return res.status(404).json({ message: "User doesn't exists" });

    if (existingUser.status !== 'Active') return res.status(401).json({ message: "Pending account, please verify your email" });

    const isPasswordCorrect = await bcrypt.compare(password, existingUser.password)

    if (!isPasswordCorrect) return res.status(400).json({ message: "invalid credentials" });

    const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, 'test', { expiresIn: '1h' });

    res.status(200).json({ result: existingUser, token });

  } catch (error) {
    res.status(500).json({ message: "something went wrong" });
  }
}

export const signup = async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    const existingUser = await User.findOne({ email });
    
    if (existingUser) return res.status(400).json({ message: "User already exists" });
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const token = jwt.sign({ email }, 'security_key', { expiresIn: "1d" });
    
    const result = await User.create({ name, email, password: hashedPassword, confirmationCode: token });
    
    res.status(200).json({ result });

    sendConfirmationEmail(result.name, result.email, result.confirmationCode);
    
  } catch (error) {
    res.status(500).json({ message: "something went wrong" });
  }
}

export const verifyUser = async (req, res) => {
  const { confirmationCode } = req.params;

  try {
    const existingUser = await User.findOne({ confirmationCode });

    if (!existingUser) return res.status(404).json({ message: "User doesn't exists" });
    
    let updateUserStatus = await User.findOneAndUpdate({confirmationCode}, { status: 'Active' }, { new: true });

    res.status(200).json({ updateUserStatus });

  } catch (error) {
    res.status(500).json({ message: "something went wrong" });
  }
}