const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');


mongoose.connect('mongodb://localhost:27017/yelp-camp', { 
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.on("open", () => {
    console.log("Database connected");
});


const sample = (array) => array[Math.floor(Math.random() * array.length)];


const seedDB = async() => {
    await Campground.deleteMany({});
    for(let i = 0; i < 50; i++){
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: '6115b650ed0b23531fc86390',
            title: `${sample(descriptors)} ${sample(places)}`,
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            description: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus.',
            price,
            images: [
                {
                  url: 'https://res.cloudinary.com/mayanhavoc/image/upload/v1628900012/YelpCamp/jhm7i9qfqkefqdzyjguj.jpg',
                  filename: 'YelpCamp/jhm7i9qfqkefqdzyjguj'
                },
                {
                  url: 'https://res.cloudinary.com/mayanhavoc/image/upload/v1628900014/YelpCamp/uezycr28azgbzkizelvy.jpg',
                  filename: 'YelpCamp/uezycr28azgbzkizelvy'
                }
              ]
        })
        await camp.save(); 
    }
}

seedDB().then(()=> {
    mongoose.connection.close();
}) 