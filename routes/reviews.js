const express = require('express');
const router = express.Router({mergeParams: true});
const wrapAsync = require('../utilities/wrapAsync');
const ExpressError = require('../utilities/ExpressError');
const Campground = require('../models/campground');
const Review = require('../models/review');
const { reviewSchema } = require('../schemas');
const { validateReview, isLoggedIn } = require('../middleware');

router.post('/', isLoggedIn, validateReview, wrapAsync(async(req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash('success', 'Created a new review');
    res.redirect(`/campgrounds/${campground._id}`);
}))

router.delete('/:reviewId', wrapAsync(async(req, res) => {
    // delete the ONE ObjectId that corresponds to the campground review using the Mongo pull operator
    const {id, reviewId } = req.params;
    Campground.findByIdAndUpdate(id, {$pull: {reviews: reviewId}})
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted your review.');
    res.redirect(`/campgrounds/${id}`);
}))

module.exports = router;