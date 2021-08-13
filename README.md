# Yelp Camp

YelpCamp is the main project of Colt Steele's 2021 Web Development bootcamp. 
Built on HTML, CSS, JS, NodeJS with EJS. 
Hosted on Mongo.
The app offers full CRUD functionality.


## Middleware
Middleware are functions that have access to the request `req` and response `res` objects. 
Middleware can: 
- *end* the `req` by sending back a `res` object with methods like `res.send()`.
- *OR* it can be chained together, one after another, by calling `next()`.

"Express is a routing and middleware web framework that has minimal functionality of its own: an express application is essentially a series of middleware function calls. 

Middleware functions can perform the following tasks:
- Execute any code
- Make changes to the `req` and `res` objects
- End the `req`-`res` cycle
- Call the next middleware function in the stack." -  expressjs.com/guide/using-middleware.html

## Rating model
We will connect multiple reviews to a campground, so our rating model will have a 'one to many' relationship. 
What we'll do in this case, is embed an array of object ids in each campground. The reason to do this is because we could potentially have 1000s of reviews associated to an object, so instead of embedding the entire review into each campground, we'll break each rating into their own model and store the object ids in the campground.  

Updated campground model
```Javascript
const CampgroundSchema = new Schema({
    title: String,
    image: String,
    price: Number,
    description: String,
    location: String, 
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review',
        }
    ]
});
```

Review model
```Javascript
const reviewSchema = new Schema ({
    body: String,
    rating: Number,
});
```

We *could* add a `ref` for each review, but in this case, because we only care about the review in the context of the campground, it's not necessary. 

To read more about [Schema Types](https://mongoosejs.com/docs/schematypes.html)

## The review form
Because we only care about the review in the context of the background, we'll just add a review form to the show page of each campground. Therefore we don't need a new route for the review form, but we do however, need to *submit* to the route it's in. 

In order to make a review, we need to know the campground it's associated with. The easiest option is to include the campground id in the route, so nested routes. 

Instead of something like `POST /reviews` following the RESTful pattern we've been following, we'll do `POST /campgrounds/:id/reviews`. We don't need RESTful routes for reviews (we don't need `index` or `show` pages), we only need **all reviews** for a **single campground**. In this case, we definitely want the campground id so that we can associate the two (the single campground to some new review), so that's were we'll post the data to. 

Here's what our `POST` route for `reviews` looks like: 

```Javascript
app.post('/campgrounds/:id/reviews', wrapAsync(async(req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
}))
```

Next we'll add validation.

### Client side validation
Because the bootstrap `form-range` class already has a value (I think, need to check), it will default to the middle, so the value is 3, we don't have to worry about giving it a default value. 
For the textarea however, we do want it to be required. However, in order to do form validation in bootstrap, we need to include the 'novalidation' attribute and the 'validated-form' class like this: 
```Javascript
<form action="/campgrounds/<%= campground._id %>/reviews" method="POST" class="mb-3 validated-form" novalidate>
    <div class="mb-3">
        <label class="form-label" for="rating">Rating</label>
        <input class="form-range"type="range" min="1" max="5" name="review[rating]" id="rating">
    </div>
    <div class="mb-3">
        <label class="form-label" for="body">Review</label>
        <textarea class="form-control" name="review[body]" id="body" cols="30" rows="3" required></textarea>
    </div>
    <button class="btn btn-success">Submit</button>
</form>
```

### Server side validation 
We're preventing submit on the client side only. Someone could still use something like Postman or Ajax or send a request some other way to circumvent our form and create an empty review or rating. 

In order to validate server side, we'll use `Joi` and add a review schema to our `schemas.js` file in the root folder

```Javascript
module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        body: Joi.string().required(),
    }).required()
})
```
We are expecting an review that consists of an object that has nested inside a rating, which is a number and a body that is a string and they are both required. 

To read more on validation with Joi: [Joi docs](https://joi.dev/api/?v=17.4.2).

### Display reviews

Right now we don't have access to the reviews. What is currently in the review array inside of campgrounds, is just an array of ObjectIds. So we need to 'populate' our campgrounds so that we can render the reviews that correspond to each campground. 

```Javascript
app.get('/campgrounds/:id', wrapAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate('reviews');
    res.render('campgrounds/show', {campground});
}))
```

And then in our `show.ejs` template we'll loop through the reviews for that campground. 

```Javascript
<% for(let review of campground.reviews) { %> 
    <div class="mb-3">
        <p>Rating: <%= review.rating %></p>
        <p>Review: <%= review.body %> </p>
    </div>
<% } %> 
```

Express router likes to keep params separate. Routers get separate params, so you need to specify `{ mergeParams: true}` in order for parameters to be accessible for ALL routes. 
In our case, if we don't merge the parameters, in our `reviews.js` routes, we won't have access to the campground id, even though it is included in the route (it will show up as an empty object). 
`const router = express.Router({mergeParams: true});`

## Authentication with passport JS
To use passport local we need to install `passport`, `passport local` and `passport-local-mongoose`

`npm install passport-local-mongoose`

Passport-Local Mongoose does not require passport or mongoose dependencies directly but expects you to have these dependencies installed.

In case you need to install the whole set of dependencies

`npm install passport mongoose passport-local-mongoose`

### Usage
Plugin Passport-Local Mongoose
First you need to plugin Passport-Local Mongoose into your User schema

```Javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const User = new Schema({});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);
```

You're free to define your User how you like. **Passport-Local Mongoose will add a username, hash and salt field to store the username, the hashed password and the salt value.**
Additionally Passport-Local Mongoose adds some methods to your Schema. See the [API Documentation](https://github.com/saintedlama/passport-local-mongoose#api-documentation) section for more details.

### Passport.initialize and Passport.session

#### **Middleware**
In a Connect or Express-based application, passport.initialize() middleware is required to initialize Passport. If your application uses persistent login sessions, passport.session() middleware must also be used.

```Javascript
app.configure(function() {
  app.use(express.static('public'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
});
```
Note that *enabling session support is entirely optional, though it is recommended for most applications*. **If enabled, be sure to use session() before passport.session() to ensure that the login session is restored in the correct order**.

#### **Static methods**
Static methods are exposed on the model constructor. For example to use `createStrategy` function use

```Javascript
const User = require('./models/user');
User.createStrategy();
```

**authenticate() Generates a function that is used in Passport's LocalStrategy**
`passport.use(new LocalStrategy(User.authenticate()));`
serializeUser() Generates a function that is used by Passport to serialize users into the session
deserializeUser() Generates a function that is used by Passport to deserialize users into the session
register(user, password, cb) Convenience method to register a new user instance with a given password. Checks if username is unique. See login example.
findByUsername() Convenience method to find a user instance by it's unique username.
createStrategy() Creates a configured passport-local LocalStrategy instance that can be used in passport.

### Serialize vs Deserialize
How to store and delete user information. 

`serializeUser()` Generates a function that is used by Passport to serialize users into the session
`deserializeUser()` Generates a function that is used by Passport to deserialize users into the session

### The register method
`register(user, password, cb)` Convenience method to register a new user instance with a given password. Checks if username is unique. See [login](https://github.com/saintedlama/passport-local-mongoose/tree/master/examples/login) example.

### Passport's `req.user`
Passport automatically includes a `user` in the `req` object which will gives us the *deserialized* information about the user. This allows us to do things like hide routes dynamically according to whether the user is registered/logged on/logged out. 

```Javascript
req.user... {
  _id: 6115b650ed0b23531fc86390,
  email: 'john@john.com',
  username: 'John',
  __v: 0
}
```

In our `app.js`
```Javascript
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})
```
`res.locals.currentUser = req.user` will gives us access to `req.user` on every route. This way we can dynamically set our routes. 

### `req.login`
Passport gives us the functionality so that when users **register** they are **NOT** redirected, but logged in automatically. 

Passport exposes a login() function on req (also aliased as logIn()) that can be used to establish a login session.
```Javascript
req.login(user, function(err) {
  if (err) { return next(err); }
  return res.redirect('/users/' + req.user.username);
});
```
When the login operation completes, user will be assigned to `req.user`.
Note: `passport.authenticate()` middleware invokes `req.login()` automatically. This function is primarily used when users sign up, during which `req.login()` can be invoked to automatically log in the newly registered user.

```Javascript
router.post('/register', wrapAsync(async(req, res, next) => {
    try {
        const {email, username, password} = req.body;
        const user = new User({email, username});
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if(err) return next(err);
            req.flash('success', 'Welcome to YelpCamp');
            res.redirect('/campgrounds');
        })
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('register');
    }
}));
```

[Source: passport docs/operations](http://www.passportjs.org/docs/login/)

[Source: passport docs](http://www.passportjs.org/docs/)

[Source: npm - passport walkthrough](http://mherman.org/blog/2013/11/11/user-authentication-with-passport-dot-js/)

[Source: passport-local mongoose ](https://www.npmjs.com/package/passport-local-mongoose)

[Source: passport JS docs - strategies](http://www.passportjs.org/packages/)

[Source: passport JS docs](http://www.passportjs.org/docs/downloads/html/)

## ReturnTo Behavior
Redirecting the user to wherever they wanted to go. We keep track of where the user was initially requesting. 

For example, in our case, whether the request was made when they are trying to log in or when we are verifying that they are authenticated, if they're not, we can just store the URL they are requesting and then redirect.

In `middleware.js`
```Javascript
module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()){
        //store the url they are requesting
        req.flash('error', 'You must be signed in');
        return  res.redirect('/login');
    }
    next();
}
```

# Authorization
First, hide edit/delete buttons if they are not the author. This is simple and is done by adding a conditional to the template:

```Javascript
<% if(currentUser && campground.author.equals(currentUser._id)) { %> 
    <div class="card-body">
        <a class="card-link btn btn-info" href="/campgrounds/<%= campground._id %>/edit">Edit</a>
        <form class="d-inline" action="/campgrounds/<%= campground._id %>?_method=DELETE" method="POST">
            <button class="btn btn-danger">Delete</button>
        </form>
    </div>
<% } %>
```
If `campground.author` is empty, our code will break, so we make sure it's not empty by including `currentUser`. 

# Model - view -controller 
MVC is not a pattern unique to express. Controller is just a file that exports a function with functionality. 
For example, this logic: 
```Javascript
wrapAsync(async (req, res, next) => {
    const campground = new Campground(req.body.campground);
    campground.author = req.user._id;
    await campground.save();
    req.flash('success', 'Successfully made a new campground');
    res.redirect(`/campgrounds/${campground._id}`);
})
```
This is the logic we use to create a **new campground**, we'll move this to our **campground controller** and we'll give it a name (i.e. createCampground and then pass it through our router). This will help us abstract our routes as much as possible, making them easier to read and understand what they are doing at a glance. Also the function names we can give them can help clarify what we are doing with them. 

## MVC framework
MVC is an approach to structuring applications. We've been using models and views already. The basic concept is the following: 
Model - data, modeling of data
View - layout, everything the user sees
Controller - rendering views, the business logic

Our routes will look like this now: 
`router.get('/', wrapAsync());`

And our controllers will look like this: 
```Javascript
module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({})
    res.render('campgrounds/index', { campgrounds });
}
```

Make sure you remember to require the controller in the router: 
In routes/campgrounds: `const campgrounds = require('../controllers/campgrounds')`


## router.route(path)
Returns an instance of a single route which you can then use to handle HTTP verbs with optional middleware. Use `router.route()` to **avoid duplicate route naming and thus typing errors**.

The following code shows how to use `router.route()` to specify various HTTP method handlers.

```Javascript
const router = express.Router()

router.param('user_id', function (req, res, next, id) {
  // sample user, would actually fetch from DB, etc...
  req.user = {
    id: id,
    name: 'TJ'
  }
  next()
})

router.route('/users/:user_id')
  .all(function (req, res, next) {
  // runs for all HTTP verbs first
  // think of it as route specific middleware!
    next()
  })
  .get(function (req, res, next) {
    res.json(req.user)
  })
  .put(function (req, res, next) {
  // just an example of maybe updating the user
    req.user.name = req.params.name
    // save user ... etc
    res.json(req.user)
  })
  .post(function (req, res, next) {
    next(new Error('not implemented'))
  })
  .delete(function (req, res, next) {
    next(new Error('not implemented'))
  })
  ```
---

Or in our case: 

```Javascript
router.route('/register')
    .get(users.renderRegister)
    .post(wrapAsync(users.register));
```

[Source: expressJS docs - router.route ](https://expressjs.com/en/5x/api.html#router.route)

# Multiple image upload
Two things to keep in mind from the get go: 
1. A standard HTML form won't do, we'll need to modify it.
2. We can't, or shouldn't use Mongo to update images because there is a 16mb size limit, there are workarounds, but it's not good practice. 

If we want to upload files, we need to set the `enctype` of the form to `multipart/form-data`. 

`enctype`

If the value of the method attribute is post, enctype is the MIME type of the form submission. 

Possible values:

`application/x-www-form-urlencoded`: The default value.

`multipart/form-data`: Use this if the form contains `<input>` elements with `type=file`.

`text/plain`: Introduced by HTML5 for debugging purposes.

This value can be overridden by formenctype attributes on `<button>, <input type="submit">, or <input type="image">` elements.

[Source - MDN/html-forms](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form)

In our project, in views/campgrounds/new:

`<form action="/campgrounds" method="POST" novalidate class="validated-form" enctype="multipart/form-data">`

`<input type="file" name="image" id="image">`

## Parsing multi-part forms
In order to parse multi-part forms (the attribute we set up in the reference form above), we need to use another middleware.

### The Multer middleware

Multer is a node.js middleware for handling `multipart/form-data`, which is **primarily used for uploading files**. It is written on top of busboy for maximum efficiency.

NOTE: **Multer will not process any form which is not multipart** (multipart/form-data).

Multer **adds a body object and a file or files object to the request object**. The body object contains the values of the text fields of the form, the file or files object contains the files uploaded via the form.

Multer does what express' `urlencoded` middleware does for JSON data, that is parse it. 
`app.use(express.urlencoded({ extended: true }));`

But to use it is a bit different: 
1. Require multer
2. Initialize
3. Pass a configuration object
4. Specify a destination path. 

.single(fieldname)
Accept a single file with the name fieldname. The single file will be stored in req.file.

.array(fieldname[, maxCount])
Accept an array of files, all with the name fieldname. Optionally error out if more than maxCount files are uploaded. The array of files will be stored in req.files.

We can add `upload.single` middleware to the `post` route: 
```Javascript
.post(upload.single('image'), (req, res)=> {
        console.log(req.body, req.file)
    })
```
Output
```Javascript
Session {
  cookie: {
    path: '/',
    _expires: 2021-08-20T22:55:33.259Z,
    originalMaxAge: 604800000,
    httpOnly: true
  },
  flash: {},
  passport: { user: 'Simon' }
}
[Object: null prototype] {
  campground: [Object: null prototype] {
    title: 'asdasd',
    location: 'asdasd',
    price: '12',
    description: 'asdasd'
  }
} {
  fieldname: 'image',
  originalname: 'Magic_Paper__OG_Magic.png',
  encoding: '7bit',
  mimetype: 'image/png',
  destination: 'uploads/',
  filename: '7ba30aa9729e6fcea7d1748dbc3dd795',
  path: 'uploads/7ba30aa9729e6fcea7d1748dbc3dd795',
  size: 343009
}
```
A path to the upload, filename, destination, etc. Info about our file and where it is and it also creates an 'uploads' folder where it will temporary store files until we set up Cloudinary. 

[Source - npm/multer](https://www.npmjs.com/package/multer)

## .dotenv

Dotenv is a zero-dependency module that loads environment variables from a .env file into [`process.env`](https://nodejs.org/docs/latest/api/process.html#process_process_env). Storing configuration in the environment separate from code is based on The [Twelve-Factor App methodology](http://12factor.net/config).

### Configuring dotenv

In our app.js

```Javascript
if(process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}
```

And then store whatever information you need in `.env` in the form of **key: value** pairs.

`CLOUDINARY_NAME = cloudname` 

**DO NOT** use quotes or spaces for your values.

[Source - npm/dotenv](https://www.npmjs.com/package/dotenv)


## Cloudinary
Instead we'll use Cloudinary.



