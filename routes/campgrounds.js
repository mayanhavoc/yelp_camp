const express = require('express');
const router = express.Router();
const campgrounds = require('../controllers/campgrounds');
const wrapAsync = require('../utilities/wrapAsync');
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware');
const multer  = require('multer')
const upload = multer({dest: 'uploads/'});
const Campground = require('../models/campground');

router.route('/')
    .get(wrapAsync(campgrounds.index))
    // .post( 
    //     isLoggedIn, 
    //     validateCampground, 
    //     wrapAsync(campgrounds.createCampground)
    //     );
    .post(upload.array('image'), (req, res)=> {
        console.log(req.body, req.files)
        res.send(`<h1>Image</h1>`)
    })

// router/new is a single route, no grouping required
router
    .get('/new', 
    isLoggedIn, 
    campgrounds.renderNewForm
    );
// ------

router.route('/:id')
    .get(wrapAsync(campgrounds.showCampground))
    .put( 
        isLoggedIn, 
        isAuthor, 
        validateCampground, 
        wrapAsync(campgrounds.updateCampground)
    )
    .delete( 
        isLoggedIn, 
        isAuthor, 
        wrapAsync(campgrounds.deleteCampground)
    );

router.get('/:id/edit', 
    isLoggedIn, 
    isAuthor, 
    wrapAsync(campgrounds.renderEditForm)
    );

module.exports = router;

// router.get('/', 
//     wrapAsync(campgrounds.index)
//     );


// router.post('/', 
//     isLoggedIn, 
//     validateCampground, 
//     wrapAsync(campgrounds.createCampground)
//     );

// router.get('/:id', 
//     wrapAsync(campgrounds.showCampground)
//     );


// router.put('/:id', 
//     isLoggedIn, 
//     isAuthor, 
//     validateCampground, 
//     wrapAsync(campgrounds.updateCampground)
//     );

// router.delete('/:id', 
//     isLoggedIn, 
//     isAuthor, 
//     wrapAsync(campgrounds.deleteCampground)
//     );

