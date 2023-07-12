
const express = require('express');
const mysql = require('mysql');
require('dotenv').config();




const connection = mysql.createConnection({ 

  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});




connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});


const app = express();
app.use(express.json());


app.get('/slots', (req, res) => {
  connection.query('SELECT * FROM slots WHERE is_booked = 0', (err, results) => {
    if (err) {
      console.error('Error retrieving slots:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results);
  });
});


app.post('/slots', (req, res) => {
  const { date, startSlot, endSlot } = req.body;


  if (!date || !startSlot || !endSlot) {
    res.status(400).json({ error: 'Invalid request. Please provide date, startSlot, and endSlot' });
    return;
  }


  connection.query(
    'SELECT * FROM slots WHERE date = ? AND ((start_slot <= ? AND end_slot >= ?) OR (start_slot <= ? AND end_slot >= ?))',
    [date, startSlot, startSlot, endSlot, endSlot],
    (err, results) => {
      if (err) {
        console.error('Error checking slot availability:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      if (results.length > 0) {
        res.status(409).json({ error: 'Slot already exists for the specified time' });
        return;
      }

  
      connection.query(
        'INSERT INTO slots (date, start_slot, end_slot, is_booked) VALUES (?, ?, ?, 0)',
        [date, startSlot, endSlot],
        (err) => {
          if (err) {
            console.error('Error creating slot:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
          }
          res.status(201).json({ message: 'Slot created successfully' });
        }
      );
    }
  );
});


app.listen(3000, () => {
  console.log('Server started on port 3000');
});
