import {Router} from 'express';
import tasksController from '../controllers/tasks.controller.js';

const router = Router();

router.route('/')
.get(tasksController.getTasks)
.post(tasksController.createTask);

router
.route('/:id')
.get(tasksController.getTask)
.put(tasksController.updateTask)
.patch(tasksController.deleteTask)
.delete(tasksController.taskDone);

export default router;