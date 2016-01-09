// Required Packages
var express = require('express');
var app = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // include config file
var Joke = require('./models/jokeModel');
var User   = require('./models/userModel');
var cors = require('cors')

mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

app.use(cors());

// API routes section
app.get('/', function(req, res){
	res.send("Home Route of API");
})

app.get('/setup', function(req, res) {

  // create a sample user
  var user = new User({ 
    email: 'dummy@gmail.com', 
    password: 'secret_pass',
    admin: true 
  });

  // save the sample user
  user.save(function(err) {
    if (err) throw err;

    console.log('User saved successfully');
    res.json({ success: true });
  });
});


// route to authenticate a user (POST http://localhost:8080/api/authenticate)
app.post('/authenticate', function(req, res) {

  // find the user
  User.findOne({
    email: req.body.email
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {

      // check if password matches
      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {

        // if user is found and password is right
        // create a token
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresIn: 3600 // expires in 24 hours
        });

        // return the information including token as JSON
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }   

    }

  });
});



var JokeRouter = express.Router();

// route middleware to verify a token
JokeRouter.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;    
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.send({ 
        success: false, 
        message: 'No token provided.' 
    });
    
  }
});

JokeRouter.route('/')
    .post(function(req,res){
        var Joke = new Joke(req.body);

        console.log(Joke);
        Joke.save();
        res.send(Joke);
    })
    .get(function(req,res){

    	var query = {};
    	var custom_offset = req.query.offset;
    	var custom_limit = req.query.limit;
		var options = {
			select:   'joke jokeAddedDate',
			sort:     { updated: -1 },
			offset: custom_offset?Number(custom_offset):0,
		    limit:  custom_limit?Number(custom_limit):10
		};

		Joke.paginate(query, options).then(function(jokes) {
            	if(jokes){
            		res.json(jokes);
            	}
		});

    });


JokeRouter.use('/:jokeId', function(req, res, next){
    Joke.findById(req.params.jokeId, function(err, Joke){
        if(err) {
            console.log(err);
        }
        else if(Joke){
            req.Joke = Joke;
            next();
        }
        else{
            res.send("No Joke found");
        }

    });
});

JokeRouter.route('/:jokeId')
    .get(function(req,res){

        res.json(req.Joke);

    })
    .put(function (req, res) {
        req.Joke.joke = req.body.joke;
        req.Joke.jokeAddedDate = req.body.jokeAddedDate;

        req.Joke.save(function(err){
            if(err){
                res.send(err);
            }
            else{
                res.json(req.Joke);
            }
        });
    })
    .patch(function(req, res){
        if(req.body._id){
            delete req.body._id;
        }

        for(var i in req.body){
            req.Joke[i] = req.body[i];
        }

        req.Joke.save(function(err){
            if(err){
                res.send(err);
            }
            else{
                res.json(req.Joke);
            }
        });

    })
    .delete(function(req, res){
        req.Joke.remove(function(err){
            if(err){
                res.send(err);
            }
            else{
                res.send("removed");
            }
        });
    });

app.use('/api/jokes', JokeRouter);


app.listen(3000, function(){
	console.log("Listening on the Port: ", 3000);
});