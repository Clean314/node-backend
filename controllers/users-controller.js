const {validationResult} = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/user');
const user = require('../models/user');

const getUsers = async (req, res, next) => {
    let users;
    try {
        users = await User.find({}, '-password');
    } catch (err) {
        const error = new HttpError(
            '사용자들을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.',
            500
        );
        return next(error);
    }

    res.json({users: users.map(user => user.toObject({getters: true}))});
};

const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        const error = new HttpError('잘못된 입력값입니다. 다시 확인해주세요.', 422);
        return next(error);
    }
    
    const {name, email, password} = req.body;

    let existingUser;
    try{
        existingUser = await User.findOne({email: email});
    } catch(err){
        const error = new HttpError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.', 500);
        return next(error); 
    }

    if (existingUser){
        const error = new HttpError('이미 가입된 이메일입니다. 다른 이메일을 사용해주세요.', 422);
        return next(error);
    }

    const createdUser = new User({
        name,
        email,
        image : 'https://picsum.photos/seed/picsum/400/400',
        password,
        places : []
    });

    try {
          await createdUser.save();
    } catch (err) {
        const error = new HttpError(
        '회원가입에 실패했습니다. 다시 시도해주세요.',
        500
        );
        console.log(err);
        return next(error);
    }

    res.status(201).json({user: createdUser.toObject({getters: true})});
};


const login = async (req, res, next) => {
    const { email, password } = req.body;

    let existingUser;
    try{
        existingUser = await User.findOne({email: email});
    } catch(err){
        const error = new HttpError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.', 500);
        return next(error); 
    }

    if (!existingUser || existingUser.password !== password){
        const error = new HttpError('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
        return next(error);
    }

    res.json({message: 'Logged in'});
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;