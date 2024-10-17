require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const hbs = require('hbs');
const Register = require('./models/registers');
require('./db/conn');
require('./models/registers');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const auth = require('./middleware/auth');

const port = process.env.port || 3000;

const static_path = path.join(__dirname, '../public');
const template_path = path.join(__dirname, '../templates/views');
const partials_path = path.join(__dirname, '../templates/partials');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(static_path));
app.use(cookieParser());

app.set('view engine', 'hbs');
app.set('views', template_path);
hbs.registerPartials(partials_path);

app.get('/', (req, res) => {
    res.render('index');
})
app.get('/secret', auth, (req, res) => {
    console.log(`this is my cookie : ${req.cookies.jwt}`);
    res.render('secret');
})

app.get('/logout',auth, async (req, res) => {
    try {
        // for single logout
        console.log(req.user);
    req.user.tokens = req.user.tokens.filter((token) => {
        return token.token !== req.token;
    });

    // logout from all devices
    req.user.tokens = [];
        res.clearCookie('jwt');
        console.log('logout successfully');
        await req.user.save();
        res.render("login");
    } catch (err) {
        res.status(500).send(err);
    }
})
app.get('/register', (req, res) => {
    res.render('register');
})
app.post('/register', async (req, res) => {
    // console.log(req.body);
    try {
        const password = req.body.password;
        const cpassword = req.body.confirmpassword;
        if (password == cpassword) {
            const registerEmployee = new Register({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                age: req.body.age,
                phone: req.body.phone,
                email: req.body.email,
                gender: req.body.gender,
                password: req.body.password,
                confirmpassword: req.body.confirmpassword
            })
            const token= await registerEmployee.generateAuthToken();
            res.cookie('jwt',token,{expires:new Date(Date.now() + 5000),httpOnly:true});
          //  console.log( cookie);
           const resitered= await registerEmployee.save();
            res.status(201).render('index');
        } else {
            res.send("password and confirm password not match");
        }

    } catch (err) {
        res.status(400).send(err);
    }
})
app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/login', async (req, res) => {
    try{

        const email = req.body.email;
        const password = req.body.password;
        const checkemail = await Register.findOne({email:email});
        const isMatch = await bcrypt.compare(password, checkemail.password);
        //console.log(`password matched : ${isMatch}`);
        const token = await checkemail.generateAuthToken();
      //  console.log(`login token generated : ${token}`);
        res.cookie('jwt',token,{expires:new Date(Date.now() + 500000)});
       
        if(isMatch){
            res.status(201).render('index');
        }else{
            res.send(" Invalid email or password");
        }
       
    } catch (err) {
        res.status(400).send("invalid email or password");
    }
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

