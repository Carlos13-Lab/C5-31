const express = require('express');
const cors = require('cors');
const { seedUsers } = require('../database/seedUsers');
const { dbConection } = require('../database/config.db');
const response = require('../helpers/response.js');

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT;
        this.path = {
            auth: '/api/v1/auth',
            course: '/api/v1/course',
            lesson: '/api/v1/lesson',
            event: '/api/v1/event',
            grade: '/api/v1/grade',
            notification: '/api/v1/notification',
            user: '/api/v1/user',
        };

        //Connet Database
        this.connectDB();


        //Middleware
        this.middleware();

        //Routes
        this.routes();
    }

    async connectDB() {
        try {
            await dbConection();
        } catch (err) {
            console.log(err.message);
        }
    }


    async initializeData() {
        try {
            await seedUsers();
            console.log('Datos inicializados correctamente');
        } catch (err) {
            console.log('Error al inicializar datos:', err.message);
        }
    }

    middleware() {
        //CORS
        this.app.use(cors());

        // Parse and lecture JSON
        this.app.use(express.json());

        //Public folder
        // this.app.use(express.static('public'));
    }

    routes() {
        this.app.use(this.path.auth, require('../routes/auth.route.js'));
        this.app.use(this.path.course, require('../routes/course.route.js'));
        this.app.use(this.path.grade, require('../routes/grade.route.js'));
        this.app.use(this.path.lesson, require('../routes/lesson.route.js'));
        this.app.use(this.path.event, require('../routes/event.route.js'));
        this.app.use(this.path.user, require('../routes/user.route.js'));
        this.app.use(
            this.path.notification,
            require('../routes/notification.route.js')
        );
        this.app.use('*', (req, res) =>
            response.error(req, res, 'Page not found', 404)
        );
    }

    listen() {
        this.app.listen(this.port, () => {
            console.log('Server on port', this.port);
        });
    }
}

module.exports = Server;
