exports.handler = function (event, context) {
	const express = require('express')

	const app = express()

	app.use(function(req, res, next) {
	  res.header("Access-Control-Allow-Origin", "*")
	  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
	  next()
	});
	// below the last app.use() method, add the following code �
	const axios = require('axios')

	app.get('/coins', function(req, res) {
	  let apiUrl = `https://api.coinlore.com/api/tickers?start=0&limit=10`
	  
	  console.log(req.query);
	  if (req && req.query) {
	    const { start = 0, limit = 10 } = req.query
	    apiUrl = `https://api.coinlore.com/api/tickers/?start=${start}&limit=${limit}`
	  }
	  axios.get(apiUrl)
	    .then(response => {
	      res.json({
	        coins: response.data.data
	      })
	    })
	   
	    .catch(err => res.json({ error: err }))
	})

}

