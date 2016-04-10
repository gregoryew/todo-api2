var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());

app.get('/', function (req, res) {
	res.send('Todo API Root');
});

// GET /todos?xompleted=true
// GET /todos?completed=false&q=work
app.get('/todos', function (req, res) {
	var queryParams = req.query;
	var filteredTodos = todos;

	if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'true') {
		filteredTodos = _.where(filteredTodos, {completed: true});
	} else if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'false') {
		filteredTodos = _.where(filteredTodos, {completed: false});
	}

	if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
		filteredTodos = _.filter(filteredTodos, function(f) {return f.description.indexOf(queryParams.q) > -1});
	}

	res.json(filteredTodos);
});

// GET /todos
app.get('/todos', function (req, res) {
	res.json(todos);
});

// GET /todos/:id
app.get('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id);

	db.todo.findById(todoId).then(function (todo) {
		if (!!todo) {
			res.json(todo.toJSON());
		} else {
			res.status(404).send();
		}
	}, function (e) {
		res.status(500).send();
	});
});

// DELETE /todos/:id
app.delete('/todos/:id', function (req, res) {
	var todoId = parseInt(req.params.id);
	var matchedToDo = _.findWhere(todos, {id: todoId});
	if (matchedToDo) {
		todos = _.without(todos, matchedToDo);
		res.json(matchedToDo);
	} else {
		res.status(404).send();
	}
})

// POST /todos
app.post('/todos', function (req, res) {
	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create(body).then(function(todo) {
		res.json(todo.toJSON());
	}, function (e) {
		res.status(400).json(e);
	});
});

// PUT /todos/:id 
app.put('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id);
	var matchedToDo = _.findWhere(todos, {id: todoId});
	var body = _.pick(req.body, 'description', 'completed');
	var validAttributes = {};

	if (!matchedToDo) {
		return res.status(404).send();
	}

	if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
		validAttributes.completed = body.completed;
	} else if (body.hasOwnProperty('completed')) {
		return res.status(400).send();
	}

	if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.length > 0) {
		validAttributes.description = body.description;
	} else if (body.hasOwnProperty('description')) {
		return res.status(400).send();
	}

	_.extend(matchedToDo, validAttributes);
	res.json(matchedToDo);
})

db.sequelize.sync().then(function () {
	app.listen(PORT, function() {
		console.log('Express listening on port ' + PORT);
	});
});