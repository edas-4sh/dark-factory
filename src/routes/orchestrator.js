const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validation');
const router = express.Router();

// Example POST endpoint
router.post('/tasks',
  body('name').isString().notEmpty(),
  body('payload').isObject(),
  validate,
  (req, res) => {
    // handler logic
    res.status(201).json({ id: '123', ...req.body });
  }
);

// Add similar validation for other routes
module.exports = router;