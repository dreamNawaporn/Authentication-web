const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const session = require('express-session');
const path = require('path');

// Factory Pattern: Database Connection Factory
class DatabaseConnectionFactory {
  constructor() {
    this.connection = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "mydb"
    });
    this.connection.connect((err) => {
      if (err) throw err;
      console.log("Connected to MySQL database");
    });
  }

  getConnection() {
    return this.connection;
  }
}

class AuthController {
  constructor(databaseConnectionFactory) {
    this.router = express.Router();
    this.dbFactory = databaseConnectionFactory;

    this.router.use(session({
      secret: 'natthacha-secret-key', // Change this to a secure secret
      resave: false,
      saveUninitialized: true
    }));

    this.router.get('/login', this.displayLoginForm.bind(this));
    this.router.post('/login', this.handleLogin.bind(this));
    this.router.get('/dashboard', this.isAuthenticated.bind(this), this.displayDashboard.bind(this));
    this.router.get('/logout', this.logout.bind(this));
  }

  isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) {
      next();
    } else {
      res.redirect('/login');
    }
  }

  displayLoginForm(req, res) {
    res.sendFile(path.join(__dirname, '../views/login.html'));
  }

  handleLogin(req, res) {
    const username = req.body.username;
    const password = req.body.password;

    const connection = this.dbFactory.getConnection();
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    connection.query(sql, [username, password], (err, results) => {
      if (err) {
        console.error("Error querying database: " + err.message);
        res.send("Error occurred while logging in. Please try again.");
      } else {
        if (results.length === 1) {
          console.log("Login Successful");

          req.session.isAuthenticated = true;
          req.session.username = username;
          req.session.authorities = results[0].authorities;

          res.redirect('/dashboard');
        } else {
          console.log("Login Failed");
          res.send("Invalid username or password. Please try again.");
        }
      }
    });
  }

  displayDashboard(req, res) {
    const authorities = req.session.authorities;

    if (authorities === 'admin') {
      res.sendFile(path.join(__dirname, '../views/admin.html'));
    } else if (authorities === 'user') {
      res.sendFile(path.join(__dirname, '../views/user.html'));
    } else {
      res.send('Unknown user role');
    }
  }

  logout(req, res) {
    req.session.destroy();
    res.redirect('/login');
  }
}

// Singleton Pattern: Create a single instance of the Database Connection Factory
const dbFactory = new DatabaseConnectionFactory();

const authController = new AuthController(dbFactory);

module.exports = authController.router;
