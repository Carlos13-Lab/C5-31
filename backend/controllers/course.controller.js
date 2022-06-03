const { Course, Lesson, Grade, User } = require('../models');
const { Types } = require('mongoose');
const response = require('../helpers/response.js');

const coursesGet = async (req, res) => {
    const { limit, from } = req.query;

    const [total, courses] = await Promise.all([
        await Course.countDocuments(),
        await Course.find()
            .skip(Number(from))
            .limit(Number(limit))
            .populate({ path: 'lessons', select: 'lectures' })
            .populate({ path: 'grades', select: 'studentGrades' })
            .exec(),
    ]);

    response.success(req, res, 'get API - list of courses', { total, courses });
};

const coursePost = async (req, res) => {
    let { courseName, image, description, teacher, students } = req.body;
    teacher = Types.ObjectId(teacher);
    const course = new Course({
        courseName,
        image,
        description,
        teacher,
        students,
    });

    try {
        const userTeacher = await User.findById(teacher);
        userTeacher.courses.push(course._id);
        await userTeacher.save();

        if (students) {
            students = [...new Set(students)];
            students.map(async (student) => {
                const userStudent = await User.findById(student);
                userStudent.courses = userStudent.courses.push(course._id);
                await userStudent.save();
            });
        }

        const lesson = new Lesson({
            course_id: course._id,
            lectures: [],
        });

        const grade = new Grade({
            course_id: course._id,
            studentGrades: [],
        });

        course.lessons = lesson._id;
        course.grades = grade._id;
        course.students = students;
        await lesson.save();
        await grade.save();
        await course.save();

        response.success(req, res, 'post API - Course created', { course });
    } catch (error) {
        console.error(`Error en coursePost:${error}`);
        response.error(req, res, 'Error creating user');
    }
};

const courseUpdate = async (req, res) => {
    const { id } = req.params;
    let { courseName, image, description, teacher, students } = req.body;
    const oldCourse = await Course.findById(id);

    let newCourse = {};

    if (courseName) newCourse.courseName = courseName;
    if (image) newCourse.image = image;
    if (description) newCourse.description = description;

    if (teacher) teacher = Types.ObjectId(teacher);

    if (teacher && !teacher.equals(oldCourse.teacher)) {
        const newTeacher = await User.findById(teacher);
        const oldTeacher = await User.findById(oldCourse.teacher);

        if (oldTeacher) {
            oldTeacher.courses = oldTeacher.courses.filter(
                (course) => !course.equals(oldCourse._id)
            );
            await oldTeacher.save();
        }

        newTeacher.courses.push(oldCourse._id);
        newTeacher.courses = newTeacher.courses.map((e) => e.toString());
        newTeacher.courses = [...new Set(newTeacher.courses)];

        await newTeacher.save();

        newCourse.teacher = teacher;
    }

    students = [...new Set(students)];
    // The new students array that are not include in the old one.
    students = students.map((e) => Types.ObjectId(e));
    let newStudents = students.filter(
        (student) => !oldCourse.students.includes(student)
    );
    let exit_students = oldCourse.students.filter(
        (student) => !students.includes(student)
    );

    if (
        newStudents &&
        JSON.stringify(students) !== JSON.stringify(exit_students)
    ) {
        exit_students.map(async (student) => {
            const oldStudent = await User.findById(student);
            if (oldStudent) {
                oldStudent.courses = oldStudent.courses.filter(
                    (course) => !course.equals(oldCourse._id)
                );
                await oldStudent.save();
            }
        });

        newStudents.map(async (student) => {
            const newStudent = await User.findById(student);
            newStudent.courses.push(oldCourse._id);
            newStudent.courses = newStudent.courses.map((e) => e.toString());
            newStudent.courses = [...new Set(newStudent.courses)];
            await newStudent.save();
        });

        newCourse.students = students;
    }

    const course = await Course.findByIdAndUpdate(id, newCourse, { new: true });

    response.success(req, res, 'put API - Course Updated', { course });
};

const courseDelete = async (req, res) => {
    const { id } = req.params;

    const courseDel = await Course.findById(id);

    try {
        courseDel.students.map(async (student) => {
            const userStudent = await User.findById(student);
            if (userStudent) {
                userStudent.courses = userStudent.courses.filter(
                    (course) => !course.equals(courseDel._id)
                );
                await userStudent.save();
            }
        });

        const userTeacher = await User.findById(courseDel.teacher);
        if (userTeacher) {
            userTeacher.courses = userTeacher.courses.filter(
                (course) => !course.equals(courseDel._id)
            );
            await userTeacher.save();
        }

        const deleted = await Course.findByIdAndDelete(id);
        response.success(req, res, 'delete API - Course deleted', {
            course: deleted,
        });
    } catch (error) {
        console.error(`Error en courseDelete:${error}`);
        response.error(req, res, 'Error deleting course');
    }
};

//

const courseGetById = async (req, res) => {
    const { id } = req.params;
    const course = await Course.findById(id)
        .populate({ path: 'lessons', select: 'lectures' })
        .populate({ path: 'grades', select: 'studentGrades' })
        .exec();

    response.success(req, res, 'get API - Course by id', { course });
};

// Get fullName of the students in the course
const courseGetStudents = async (req, res) => {
    const { id } = req.params;
    const course = await Course.findById(id)
        .populate('students', 'fullName')
        .exec();
    response.success(req, res, 'get API - Students of the course', {
        students: course.students,
    });
};

module.exports = {
    coursesGet,
    coursePost,
    courseUpdate,
    courseDelete,
    courseGetById,
    courseGetStudents,
};