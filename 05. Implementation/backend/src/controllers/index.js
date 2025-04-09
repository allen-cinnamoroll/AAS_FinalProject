class IndexController {
    getIndex(req, res) {
        res.send('Welcome to the API!');
    }
}

module.exports = IndexController;