const express = require('express');
const path = require('path');
const methodOverride = require('method-override');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', require('./routes/pages'));
app.use('/filaments', require('./routes/filaments'));
app.use('/settings', require('./routes/settings'));

app.listen(PORT, () => {
    console.log(`BambuTracker running on port ${PORT}`);
});
