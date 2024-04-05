var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./posts')
const passport = require('passport');
const upload = require('./multer');


const LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(userModel.authenticate()));
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});
router.get('/login', function(req, res, next) {
  // console.log(req.flash('error'));
  res.render('login' , {error : req.flash('error')});
});

router.get('/feed', function(req, res, next) {
  res.render('feed');
});

// router.post('/upload', isLoggedIn ,upload.single("file") ,async function(req, res, next) {
//   if(!req.file){
//     return res.status(404).send(`No files were given`);
//   }
  
//   const user = await userModel.findOne({username : req.session.passport.user});
//   const post = await postModel.create({
//     image:req.file.filename,
//     imageText :req.body.filecaption,
//     user:user._id
//   });

//   user.posts.push(post._id);
//   await user.save();
//   res.send("done");
// });


router.post('/upload', isLoggedIn, upload.single("file"), async function(req, res, next) {
  try {
    if (!req.file) {
      return res.status(404).send(`No files were given`);
    }

    const user = await userModel.findOne({ username: req.session.passport.user });
    if (!user) {
      return res.status(404).send('User not found');
    }

    const post = await postModel.create({
      image: req.file.filename,
      imageText: req.body.filecaption,
      user: user._id
    });

    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/profile', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({
    username : req.session.passport.user
  })
  .populate("posts");
  // console.log(user);
  res.render('profile' ,{user});
});

router.post('/register', (req, res) => {
  const { username, email, fullname, password } = req.body;
  const userData = new userModel({ username, email, fullname : fullname});
  
  userModel.register(userData, password, (err, user) => {
    if (err) {
      console.error(err);
      res.redirect('/');
    }
    passport.authenticate('local')(req, res, function(){
      res.redirect('/profile');
    });
  });
});


router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile', // Redirect to profile upon successful login
  failureRedirect: '/login', // Redirect to home page if authentication fails
  failureFlash: true
}));

// router.post('/login', passport.authenticate('local', {
//   successRedirect: '/profile',
//   failureRedirect: '/'
// }));

// router.get('/logout', (req, res) => {
//   req.logout();
//   res.redirect('/');
// });

router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) {
      console.error(err);
      return next(err);
    }
    res.redirect('/');
  });
});


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

module.exports = router;
