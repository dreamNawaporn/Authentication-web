const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const path = require('path');

// Factory Pattern: UserController Factory
class UserControllerFactory {
  createUserController() {
    return new UserController();
  }
}

class UserController {
  constructor() {
    this.con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "mydb"
    });

    this.con.connect((err) => {
      if (err) throw err;
      console.log("Connected to MySQL database");
    });
  }

  // Display the signup form
  showSignupForm(req, res) {
    res.sendFile(path.join(__dirname, '../views/signup.html'));
  }

  // Handle the signup POST request
  signup(req, res) {
    const username = req.body.username;
    const password = req.body.password;
    const authorities = req.body.authorities;

    const sql = "INSERT INTO users (username, password, authorities) VALUES (?, ?, ?)";

    this.con.query(sql, [username, password, authorities], (err, result) => {
      if (err) {
        console.error("Error inserting data: " + err.message);
        res.send("Error occurred while signing up. Please try again.");
      } else {
        console.log("Signup Complete");
        res.sendFile(path.join(__dirname, '../views/signup_success.html'));
      }
    });
  }

  // Retrieve all user data as JSON
  getAllUserData(req, res) {
    const sql = "SELECT username, authorities, password FROM users";

    this.con.query(sql, (err, result) => {
      if (err) {
        console.error("Error retrieving data: " + err.message);
        res.status(500).json({ error: "Error occurred while retrieving data." });
      } else {
        console.log("Data retrieved successfully");
        res.json(result);
      }
    });
  }
}

// Create UserController using Factory
const userControllerFactory = new UserControllerFactory();
const userController = userControllerFactory.createUserController();

router.get('/signup', (req, res) => userController.showSignupForm(req, res));
router.post('/signup', (req, res) => userController.signup(req, res));
router.get('/admin/data', (req, res) => userController.getAllUserData(req, res));

module.exports = router;