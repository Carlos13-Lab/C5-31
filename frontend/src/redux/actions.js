import axios from 'axios';

axios.defaults.baseURL =
     'http://localhost:5000/api/v1';

//=============================
//           USER
//=============================
export function getUsers() {
    return async function (dispatch) {
        var json = await axios.get('/user');
        return dispatch({
            type: 'GET_USERS',
            payload: json.data.data.user,
        });
    };
}

export function getUser(id) {
    return async function (dispatch) {
        var json = await axios.get(`/user/${id}`);

        return dispatch({
            type: 'GET_USER',
            payload: json.data,
        });
    };
}

export function deleteUser(id, token) {
    return async function (dispatch) {
        let config = {
            headers: {
                xtoken: token,
            },
        };
        await axios.delete('/user/' + id, config);
        var json = await axios.get('/user');
        console.log(json.data);
        return dispatch({
            type: 'GET_USERS',
            payload: json.data.data.user,
        });
    };
}

export function updateUser(data, id, token) {
    return async function (dispatch) {
        let config = {
            headers: {
                xtoken: token,
            },
        };
        await axios.put('/user/' + id, data, config);
        var json = await axios.get('/user');
        return dispatch({
            type: 'GET_USERS',
            payload: json.data.data.user,
        });
    };
}

export function postUser(data, token) {
    return async function (dispatch) {
        let config = {
            headers: {
                xtoken: token,
            },
        };
        await axios.post('/user', data, config);
        var json = await axios.get('/user');
        return dispatch({
            type: 'GET_USERS',
            payload: json.data.data.user,
        });
    };
}

export function getProfile(user_id) {
    return async function (dispatch) {
        let user = await axios.get(`/user/${user_id}`);
        let courses_array = user.data.data.user.courses;

        const profile = [];
        await Promise.all(
            courses_array.map(async (course) => {
                await axios.get(`/course/${course._id}`).then((course_data) => {
                    let auxObjt = {
                        classmates:
                            course_data.data.data.course.students.filter(
                                (e) => e._id != user_id
                            ),
                        teacher: course_data.data.data.course.teacher,
                    };
                    auxObjt.teacher.course =
                        course_data.data.data.course.courseName;
                    profile.push(auxObjt);
                });
            })
        );
        let listStudents = [];
        let listTeachers = [];
        profile.map((obj) => {
            obj.classmates.map((e) => {
                if (!listStudents.includes(e.fullName)) {
                    listStudents.push(e.fullName);
                }
            });
            if (
                !listTeachers.some(
                    (teacher) => teacher.fullName == obj.teacher.fullName
                )
            ) {
                listTeachers.push(obj.teacher);
            }
        });

        return dispatch({
            type: 'GET_PROFILE',
            payload: { listStudents, listTeachers },
        });
    };
}

//============================
//         LOGIN
//============================

export function logout() {
    return async function (dispatch) {
        return dispatch({
            type: 'LOGOUT',
            payload: {},
        });
    };
}

export function login({ email, password, role }) {
    let data = { email, password };
    return async function (dispatch) {
        var json = await axios.post(`/auth/login`, data);
        const resRole = json.data.data.user.role;
        if (resRole != role) {
            if (resRole != 'admin') {
                throw new Error('Incorrect role');
            }
        }
        return dispatch({
            type: 'LOGIN',
            payload: json.data.data,
        });
    };
}

//============================
//         GRADES
//============================

export function getGrade(courses_id, student_id) {
    return async function (dispatch) {
        let grades = await axios.get('/grade');
        grades = grades.data.data.grade;
        let studentGrades = [];
        courses_id.map((id) => {
            let gradesCourse = grades.filter(
                (grade) => grade.course_id._id == id
            )[0];

            if (gradesCourse.studentGrades) {
                let gradesList = gradesCourse.studentGrades.filter(
                    (objGrade) => objGrade.student_id === student_id
                )[0];

                if (gradesList) {
                    gradesList.grades.map((e) =>
                        studentGrades.push(
                            Object.assign(e, {
                                course: gradesCourse.course_id.courseName,
                            })
                        )
                    );
                }
            }
        });

        return dispatch({
            type: 'GET_GRADE',
            payload: studentGrades,
        });
    };
}

export function addGrade(course_id, data, token) {
    return async function (dispacht) {
        let config = {
            headers: {
                xtoken: token,
            },
        };

        await axios.post(`/grade/student/${course_id}`, data, config);
        let course = await axios.get(`/course/${course_id}`);
        course = course.data.data.course;

        return dispacht({
            type: 'GET_COURSE_ID',
            payload: course,
        });
    };
}

export function deleteGrade(student_id, course_id, token) {
    return async function (dispacht) {
        let config = {
            headers: {
                xtoken: token,
            },
            data: {
                student_id: student_id,
            },
        };

        await axios.delete(`/grade/student/${course_id}`, config);

        let course = await axios.get(`/course/${course_id}`);
        course = course.data.data.course;

        return dispacht({
            type: 'GET_COURSE_ID',
            payload: course,
        });
    };
}

export function updateGrade(data, course_id, token) {
    return async function (dispacht) {
        let config = {
            headers: {
                xtoken: token,
            },
        };

        await axios.put(`/grade/student/${course_id}`, data, config);
        let course = await axios.get(`/course/${course_id}`);
        course = course.data.data.course;

        return dispacht({
            type: 'GET_COURSE_ID',
            payload: course,
        });
    };
}

//============================
//         COURSES
//============================

export function getCourses(id) {
    return async function (dispatch) {
        var json = await axios.get(`/user/${id}`);
        window.localStorage.setItem(
            'courses',
            JSON.stringify(json.data.data.user.courses)
        );
        return dispatch({
            type: 'GET_USER_COURSES',
            payload: json.data.data.user.courses,
        });
    };
}
export function getAllCourses() {
    return async function (dispacht) {
        let courses = await axios.get(`/course`);
        courses = courses.data.data.course;
        window.localStorage.setItem('courses', JSON.stringify(courses));
        return dispacht({
            type: 'GET_COURSES_ALL',
            payload: courses,
        });
    };
}
export function getCourseById(id) {
    return async function (dispacht) {
        let course = await axios.get(`/course/${id}`);
        course = course.data.data.course;

        return dispacht({
            type: 'GET_COURSE_ID',
            payload: course,
        });
    };
}

export function getCourse() {
    return async function (dispatch) {
        var json = await axios.get('/course/');

        window.localStorage.setItem(
            'courses',
            JSON.stringify(json.data.data.course)
        );
        return dispatch({
            type: 'GET_COURSE',
            payload: json.data.data.course,
        });
    };
}

export function deleteCourse(id, token) {
    return async function (dispatch) {
        let config = {
            headers: {
                xtoken: token,
            },
        };
        await axios.delete(`/course/${id}`, config);
        let courses = await axios.get(`/course`);
        courses = courses.data.data.course;
        window.localStorage.setItem('courses', JSON.stringify(courses));
        return dispatch({
            type: 'GET_COURSES_ALL',
            payload: courses,
        });
    };
}

export function updateCourse(data, id, token) {
    return async function (dispatch) {
        let config = {
            headers: {
                xtoken: token,
            },
        };
        await axios.put(`/course/${id}`, data, config);
        let courses = await axios.get(`/course`);
        courses = courses.data.data.course;
        window.localStorage.setItem('courses', JSON.stringify(courses));
        return dispatch({
            type: 'GET_COURSES_ALL',
            payload: courses,
        });
    };
}

export function addCourse(data, token) {
    return async function (dispatch) {
        let config = {
            headers: {
                xtoken: token,
            },
        };
        if (data.courseName == '') {
            delete data.courseName;
        }
        await axios.post(`/course/`, data, config);

        let courses = await axios.get(`/course`);
        courses = courses.data.data.course;
        window.localStorage.setItem('courses', JSON.stringify(courses));
        return dispatch({
            type: 'GET_COURSES_ALL',
            payload: courses,
        });
    };
}
//============================
//       NOTIFICATIONS
//============================

export function getNotifications() {
    return async function (dispatch) {
        var json = await axios.get('/notification');
        return dispatch({
            type: 'GET_NOTIFICATIONS',
            payload: json.data.data.notification,
        });
    };
}

export function deleteNotification(id, token) {
    return async function (dispacht) {
        let config = {
            headers: {
                xtoken: token,
            },
        };
        await axios.delete(`/notification/${id}`, config);
        var json = await axios.get('/notification');
        return dispacht({
            type: 'GET_NOTIFICATIONS',
            payload: json.data.data.notification,
        });
    };
}

export function addNotification(data, token) {
    return async function (dispacht) {
        let config = {
            headers: {
                xtoken: token,
            },
        };

        await axios.post(`/notification`, data, config);
        var json = await axios.get('/notification');
        return dispacht({
            type: 'GET_NOTIFICATIONS',
            payload: json.data.data.notification,
        });
    };
}

export function updateNotification(data, id, token) {
    return async function (dispacht) {
        let config = {
            headers: {
                xtoken: token,
            },
        };

        await axios.put(`/notification/${id}`, data, config);
        var json = await axios.get('/notification');
        return dispacht({
            type: 'GET_NOTIFICATIONS',
            payload: json.data.data.notification,
        });
    };
}
//============================
//       LESSONS
//============================

export function addLesson(course_id, data, token) {
    return async function (dispacht) {
        let config = {
            headers: {
                xtoken: token,
            },
        };

        await axios.post(`/lesson/${course_id}`, data, config);
        let course = await axios.get(`/course/${course_id}`);
        course = course.data.data.course;

        return dispacht({
            type: 'GET_COURSE_ID',
            payload: course,
        });
    };
}

export function updateLesson(data, course_id, token) {
    return async function (dispacht) {
        let config = {
            headers: {
                xtoken: token,
            },
        };

        await axios.put(`/lesson/${course_id}`, data, config);
        let course = await axios.get(`/course/${course_id}`);
        course = course.data.data.course;

        return dispacht({
            type: 'GET_COURSE_ID',
            payload: course,
        });
    };
}

export function deleteLesson(index, course_id, token) {
    return async function (dispacht) {
        let config = {
            headers: {
                xtoken: token,
            },
            data: {
                index: index,
            },
        };

        await axios.delete(`/lesson/${course_id}`, config);

        let course = await axios.get(`/course/${course_id}`);
        course = course.data.data.course;

        return dispacht({
            type: 'GET_COURSE_ID',
            payload: course,
        });
    };
}

//============================
//       EVENTS
//============================

export function getEvents(courses_id) {
    return async function (dispatch) {
        let events = await axios.get('/event');
        events = events.data.data.event;
        events = events.filter(
            (event) =>
                courses_id.indexOf(event.course_id._id) != -1 &&
                event.events.length != 0
        );

        return dispatch({
            type: 'GET_EVENTS',
            payload: events,
        });
    };
}

export function deleteActivity(index, course_id, token) {
    return async function (dispacht) {
        let config = {
            headers: {
                xtoken: token,
            },
            data: {
                index: index,
            },
        };

        await axios.delete(`/event/${course_id}`, config);
        let course = await axios.get(`/course/${course_id}`);
        course = course.data.data.course;

        return dispacht({
            type: 'GET_COURSE_ID',
            payload: course,
        });
    };
}
export function addActivity(course_id, data, token) {
    return async function (dispacht) {
        let config = {
            headers: {
                xtoken: token,
            },
        };

        await axios.post(`/event/${course_id}`, data, config);
        let course = await axios.get(`/course/${course_id}`);
        course = course.data.data.course;

        return dispacht({
            type: 'GET_COURSE_ID',
            payload: course,
        });
    };
}
export function updateActivity(course_id, data, token) {
    return async function (dispacht) {
        let config = {
            headers: {
                xtoken: token,
            },
        };

        await axios.put(`/event/${course_id}`, data, config);
        let course = await axios.get(`/course/${course_id}`);
        course = course.data.data.course;

        return dispacht({
            type: 'GET_COURSE_ID',
            payload: course,
        });
    };
}

//============================
//        MODAL
//============================

export function showModal(modal) {
    return async function (dispacht) {
        let obj = {
            name: modal,
            active: true,
        };
        return dispacht({
            type: 'MODAL_SHOW',
            payload: obj,
        });
    };
}

export function hideModal() {
    return async function (dispacht) {
        let obj = {
            name: '',
            active: false,
        };
        return dispacht({
            type: 'MODAL_HIDE',
            payload: obj,
        });
    };
}
