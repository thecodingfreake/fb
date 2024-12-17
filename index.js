const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/test');
const leaderboardRouter = require('./routes/leaderboard');
const uploadmodule=require('./routes/module')
const enroll=require('./routes/enroll')
const course=require('./routes/course')
const cookieParser = require('cookie-parser');
const cors = require('cors');
const Module = require("./models/Module");
dotenv.config();

connectDB();

const app = express();
const corsOptions = {
    origin: 'https://fluent-path-main.vercel.app', // Replace with your frontend URL
    credentials: true, // This allows cookies to be sent with the requests
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/upload',uploadmodule)
app.use('/api/enroll',enroll)
app.use('/api/course',course)
const PORT = process.env.PORT || 5000;


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
