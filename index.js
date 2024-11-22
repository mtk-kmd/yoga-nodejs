const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./yogaDatabase');

const app = express();
const port = 8080;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Routes

// 1. Get all yoga classes
app.get('/classes', (req, res) => {
    const query = 'SELECT * FROM YogaClass';
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// 2. Add a new yoga class
app.post('/classes', (req, res) => {
    const { day, time, capacity, duration, price, type } = req.body;

    const query = `
        INSERT INTO YogaClass (day, time, capacity, duration, price, type)
        VALUES (?, ?, ?, ?, ?, ?)`;

    db.run(query, [day, time, capacity, duration, price, type], function (err) {
        if (err) {
            console.log(err);
            res.status(500).json({ error: err.message });
        } else {
            console.log('hello');
            res.status(201).json({ id: this.lastID });
        }
    });
});

app.delete('/classes', (req, res) => {
    const { id } = req.query;

    const query = 'DELETE FROM YogaClass WHERE id = ?';

    db.run(query, [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(200).json({ message: 'Class deleted'});
        }
    })
})

// 3. Get all class instances for a specific class
app.get('/instances', (req, res) => {
    const classId = req.query.classId;

    if (!classId) {
        return res.status(400).json({ error: 'classId is required' });
    }

    const query = 'SELECT * FROM ClassInstance WHERE class_id = ?';
    db.all(query, [classId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// 4. Add a new class instance
app.post('/instances', (req, res) => {
    const { date, teacher, comments, classId } = req.body;

    const query = `
        INSERT INTO ClassInstance (date, teacher, comments, class_id)
        VALUES (?, ?, ?, ?)`;

    db.run(query, [date, teacher, comments, classId], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(201).json({ id: this.lastID });
        }
    });
});

// 5. Delete a class instance
app.delete('/instances/:id', (req, res) => {
    const instanceId = req.params.id;

    const query = 'DELETE FROM ClassInstance WHERE id = ?';
    db.run(query, [instanceId], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(200).json({ message: `Class instance with ID ${instanceId} deleted.` });
        }
    });
});

// In-memory shopping cart
const shoppingCart = {};

// Add a class to the shopping cart
app.post('/cart/add', (req, res) => {
    const { email, classId } = req.body;

    if (!email || !classId) {
        return res.status(400).send({ error: 'Email and classId are required' });
    }

    if (!shoppingCart[email]) {
        shoppingCart[email] = [];
    }

    shoppingCart[email].push(classId);
    res.status(200).send({ message: 'Class added to cart', cart: shoppingCart[email] });
});

// Submit the shopping cart
app.post('/cart/submit', (req, res) => {
    const { email, cart } = req.body;

    if (!email || !Array.isArray(cart) || cart.length === 0) {
        return res.status(400).send({ error: 'Cart is empty or email is missing' });
    }

    const placeholders = cart.map(() => '(?, ?)').join(',');
    const values = cart.flatMap((classId) => [email, classId]);

    // Insert cart items into the Bookings table
    const query = `INSERT INTO Bookings (email, class_id) VALUES ${placeholders}`;
    db.run(query, values, function (err) {
        if (err) {
            console.error('Error submitting cart:', err);
            return res.status(500).send({ error: 'Failed to submit cart' });
        }

        res.status(200).send({ message: 'Cart submitted successfully', bookingId: this.lastID });
    });
});

// Get all bookings for a user
app.get('/bookings', (req, res) => {
    const { email } = req.query;

    const query = `
        SELECT YogaClass.id, YogaClass.day, YogaClass.time, YogaClass.type, YogaClass.price 
        FROM Bookings
        INNER JOIN YogaClass ON Bookings.class_id = YogaClass.id
    `;

    db.all(query, [email], (err, rows) => {
        if (err) {
            console.error('Error fetching bookings:', err);
            return res.status(500).send({ error: 'Failed to fetch bookings' });
        }

        res.status(200).send({ bookings: rows });
    });
});

app.delete('/bookings', (req, res) => {
    const { id } = req.query;

    const query = 'DELETE FROM Bookings where id = ?';

    db.run(query, [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(200).json({ message: `Booking with ID ${id} deleted.` });
        }
    });
})

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
