const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());


//connection
const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Ceiwi3ch',
  database: 'adoption_center'
});

app.post('/signup', (req, res) => {
  const {email, password, fname, lname, phone, bio } = req.body;

  connection.query(
    'SELECT * FROM Users WHERE email = ?',
    [email],
    (error, results, fields) => {
      if (error) {
        console.error('Error while checking email existence:', error);
        res.status(500).send('Server error');
        return;
      }

      if (results.length > 0) {
        res.status(400).json({ message: 'User with this email already exists' });
        return;
      }

      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Error while hashing password:', err);
          res.status(500).send('Server error');
          return;
        }

        const sql = 'INSERT INTO Users (email, password, fname, lname, phone, bio) VALUES (?, ?, ?, ?, ?, ?)';
        const values = [email, hashedPassword, fname, lname, phone, bio];

        connection.query(sql, values, (insertError, results, fields) => {
          if (insertError) {
            console.error('Error while adding a new user:', insertError);
            res.status(500).send('Server error');
            return;
          }

          const token = jwt.sign({ email }, 'your_secret_key', { expiresIn: '1h' });

          console.log('User added successfully');
          res.status(201).json({ token });
        });
      });
    }
  );
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  connection.query(
    'SELECT * FROM Users WHERE email = ?',
    [email],
    async (error, results, fields) => {
      if (error) {
        console.error('Error while fetching user:', error);
        res.status(500).json({ message: 'Server error' });
        return;
      }

      if (results.length === 0) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      const user = results[0];

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      const token = jwt.sign({ email: user.email }, 'your_secret_key', { expiresIn: '1h' });

      res.json({ token });
    }
  );
});


module.exports = app;
