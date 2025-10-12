const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();

app.use(bodyParser.json());
app.use('/api/places', placesRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
    const error = new HttpError('페이지를 찾을 수 없습니다', 404);
    throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || '서버 오류가 발생했습니다.' });
});

mongoose
.connect('mongodb+srv://user:IGd9Cig9BaYoIzKP@cluster0.x2vggog.mongodb.net/places?retryWrites=true&w=majority&appName=Cluster0')
.then(() => {
    console.log('연결 성공');
    app.listen(5000);
})
.catch(err => {
    console.log(err);
});