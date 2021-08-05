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

