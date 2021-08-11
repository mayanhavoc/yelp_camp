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
